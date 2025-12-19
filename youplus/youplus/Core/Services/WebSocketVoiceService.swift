import Foundation
import AVFoundation
import Combine

/// Manages WebSocket connection to Cartesia agent for real-time voice calls
@MainActor
class WebSocketVoiceService: NSObject, ObservableObject, URLSessionWebSocketDelegate {
    // MARK: - Published Properties
    @Published var isConnected = false
    @Published var isCallActive = false
    @Published var errorMessage: String?
    @Published var callDuration: TimeInterval = 0

    // MARK: - Private Properties
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var audioEngine = AVAudioEngine()
    private var playerNode = AVAudioPlayerNode()
    private var pingTimer: Timer?
    private var durationTimer: Timer?
    private var streamId: String?
    private var streamAcknowledged = false
    private var streamAcknowledgedContinuation: CheckedContinuation<Void, Never>?
    private var connectionContinuation: CheckedContinuation<Void, Error>?

    private let apiClient = APIClient.shared
    private var accessToken: String?
    private let agentId: String
    private let callKitManager = CallKitManager.shared
    private var currentUserId: String?
    private var currentVoiceId: String?

    // Audio format for Cartesia (PCM 44.1kHz)
    private let audioFormat = AVAudioFormat(
        commonFormat: .pcmFormatFloat32,
        sampleRate: 44100,
        channels: 1,
        interleaved: false
    )!

    // MARK: - Initialization
    init(agentId: String) {
        self.agentId = agentId
        super.init()
    }

    deinit {
        pingTimer?.invalidate()
        durationTimer?.invalidate()
    }

    // MARK: - Public Methods

    /// Connect to Cartesia WebSocket and begin audio streaming
    func connect(voiceId: String?, userId: String) async throws {
        print("DEBUG: Connecting to Cartesia with userId=\(userId), voiceId=\(voiceId ?? "default")")

        // 0. Start CallKit call first
        try await callKitManager.startCall(userId: userId, displayName: "Future You")

        // 1. Get access token from backend
        do {
            accessToken = try await fetchAccessToken()
        } catch {
            print("ERROR: Failed to fetch access token: \(error)")
            throw error
        }

        // 2. Build WebSocket URL (no query parameters - Cartesia doesn't support them)
        let url = URL(string: "wss://api.cartesia.ai/agents/stream/\(agentId)")!
        
        // Store userId and voiceId for use in start event metadata
        self.currentUserId = userId
        self.currentVoiceId = voiceId

        print("DEBUG: WebSocket URL = \(url.absoluteString)")

        // 3. Create URLSession with delegate
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        session = URLSession(configuration: config, delegate: self, delegateQueue: .main)

        // 4. Create WebSocket request
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken!)", forHTTPHeaderField: "Authorization")
        request.setValue("2025-04-16", forHTTPHeaderField: "Cartesia-Version")

        print("DEBUG: Creating WebSocket task...")
        webSocket = session?.webSocketTask(with: request)
        webSocket?.resume()

        // 5. Wait for connection to establish
        print("DEBUG: Waiting for connection to establish...")
        try await waitForConnection()

        // 6. Configure and setup audio
        configureAudioSession()
        setupAudioEngine()

        // 7. Send start event
        print("DEBUG: Sending start event...")
        sendStartEvent()

        // 8. Start receiving messages
        receiveMessages()

        // 9. Wait for stream acknowledgment
        print("DEBUG: Waiting for stream acknowledgment...")
        await waitForStreamAcknowledgment()
        print("DEBUG: Stream acknowledged!")

        // 10. Setup audio session listeners
        NotificationCenter.default.addObserver(
            forName: .audioSessionActivated,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.startAudioEngine()
        }

        NotificationCenter.default.addObserver(
            forName: .audioSessionDeactivated,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.stopAudioEngine()
        }

        // 11. Start keep-alive ping
        startPingTimer()

        isConnected = true
        startDurationTimer()
    }

    /// Disconnect from WebSocket
    func disconnect() {
        callKitManager.endCall()
        webSocket?.cancel(with: .goingAway, reason: nil)
        stopAudioEngine()
        stopTimers()
        NotificationCenter.default.removeObserver(self)
        isConnected = false
        isCallActive = false
        callDuration = 0
        audioPacketCount = 0  // Reset for next call
        streamAcknowledged = false
        streamId = nil
    }

    // MARK: - Private Methods

    private func waitForConnection() async throws {
        try await withCheckedThrowingContinuation { continuation in
            connectionContinuation = continuation
            // Timeout after 10 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) {
                if !self.isConnected && self.connectionContinuation != nil {
                    self.connectionContinuation = nil
                    continuation.resume(throwing: VoiceCallError.connectionFailed)
                }
            }
        }
    }

    private func waitForStreamAcknowledgment() async {
        if streamAcknowledged {
            return
        }

        await withCheckedContinuation { continuation in
            self.streamAcknowledgedContinuation = continuation
        }
    }

    private func fetchAccessToken() async throws -> String {
        let authManager = AuthManager.shared
        guard let userAccessToken = authManager.accessToken else {
            print("ERROR: No user access token in AuthManager")
            throw VoiceCallError.noAccessToken
        }

        let response = try await apiClient.post(
            "/api/cartesia/access-token",
            body: [:],
            accessToken: userAccessToken
        )

        guard let token = response["accessToken"] as? String else {
            print("ERROR: No accessToken in response")
            throw VoiceCallError.noAccessToken
        }

        print("DEBUG: Got Cartesia access token")
        return token
    }

    private func sendStartEvent() {
        streamId = UUID().uuidString

        var startEvent: [String: Any] = [
            "event": "start",
            "stream_id": streamId!,
            "config": [
                "input_format": "pcm_44100"
            ]
        ]
        
        // Add metadata with user_id and voice_id (since query params aren't supported)
        var metadata: [String: Any] = [
            "user_id": currentUserId ?? "unknown",
            "from": "youplus_ios_app"
        ]
        if let voiceId = currentVoiceId {
            metadata["voice_id"] = voiceId
        }
        startEvent["metadata"] = metadata

        guard let data = try? JSONSerialization.data(withJSONObject: startEvent),
              let jsonString = String(data: data, encoding: .utf8) else {
            print("ERROR: Failed to serialize start event")
            return
        }

        print("DEBUG: Sending start event: \(jsonString)")
        webSocket?.send(.string(jsonString)) { [weak self] error in
            if let error = error {
                print("ERROR: Failed to send start event: \(error)")
            } else {
                print("DEBUG: Start event sent successfully")
            }
        }
    }

    private func receiveMessages() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(.string(let text)):
                print("DEBUG: Received text message: \(text.prefix(100))")
                self?.handleMessage(text)
                self?.receiveMessages() // Continue receiving

            case .success(.data(let data)):
                print("DEBUG: Received data message: \(data.count) bytes")
                if let text = String(data: data, encoding: .utf8) {
                    self?.handleMessage(text)
                }
                self?.receiveMessages()

            case .failure(let error):
                print("ERROR: WebSocket receive failed: \(error)")
                self?.isConnected = false
                self?.isCallActive = false
                self?.errorMessage = "WebSocket error: \(error.localizedDescription)"

            @unknown default:
                print("DEBUG: Unknown receive result")
                self?.receiveMessages()
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let event = json["event"] as? String else {
            return
        }

        switch event {
        case "ack":
            print("DEBUG: Received ack event - starting audio capture NOW")
            if let receivedStreamId = json["stream_id"] as? String {
                self.streamId = receivedStreamId
            }
            streamAcknowledged = true
            isCallActive = true  // Enable audio streaming BEFORE starting engine
            
            // Start audio engine immediately - server expects audio right after ack
            startAudioEngine()
            print("DEBUG: Audio engine started, isCallActive=\(isCallActive)")
            
            if let continuation = streamAcknowledgedContinuation {
                streamAcknowledgedContinuation = nil
                continuation.resume()
            }

        case "media_output":
            print("DEBUG: Received audio from agent!")
            if let media = json["media"] as? [String: Any],
               let payload = media["payload"] as? String {
                print("DEBUG: Audio payload size: \(payload.count) chars")
                if let audioData = Data(base64Encoded: payload) {
                    print("DEBUG: Decoded audio data: \(audioData.count) bytes")
                    playAudioData(audioData)
                } else {
                    print("ERROR: Failed to decode base64 audio payload")
                }
            } else {
                print("ERROR: media_output missing media.payload - json: \(json)")
            }

        case "clear":
            print("DEBUG: Agent interrupted stream")

        default:
            print("DEBUG: Received event: \(event)")
        }
    }

    private func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.defaultToSpeaker]
            )
            try session.setActive(true)
        } catch {
            print("ERROR: Audio session configuration failed: \(error)")
        }
    }

    private func setupAudioEngine() {
        audioEngine.attach(playerNode)
        audioEngine.connect(
            playerNode,
            to: audioEngine.mainMixerNode,
            format: audioFormat
        )

        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)
        
        print("DEBUG: Setting up audio engine with input format: \(inputFormat)")

        inputNode.installTap(
            onBus: 0,
            bufferSize: 4096,
            format: inputFormat
        ) { [weak self] buffer, _ in
            self?.processInputAudio(buffer)
        }
        
        print("DEBUG: Audio tap installed, waiting for ack to start engine")
    }

    private func startAudioEngine() {
        guard !audioEngine.isRunning else {
            print("DEBUG: Audio engine already running")
            return
        }
        do {
            try audioEngine.start()
            playerNode.play()
            print("DEBUG: Audio engine started successfully")
        } catch {
            print("ERROR: Failed to start audio engine: \(error)")
        }
    }

    private func stopAudioEngine() {
        audioEngine.stop()
        playerNode.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
    }

    private func processInputAudio(_ buffer: AVAudioPCMBuffer) {
        // This runs on audio thread, so capture values we need
        guard isCallActive, let channelData = buffer.floatChannelData?[0] else { return }

        let frameLength = Int(buffer.frameLength)
        
        // Convert Float32 samples to Int16 PCM (Cartesia expects 16-bit PCM)
        var pcmData = Data(capacity: frameLength * 2)
        for i in 0..<frameLength {
            // Clamp to [-1, 1] and scale to Int16 range
            let clampedSample = max(-1.0, min(1.0, channelData[i]))
            let int16Sample = Int16(clampedSample * 32767.0)
            withUnsafeBytes(of: int16Sample.littleEndian) { pcmData.append(contentsOf: $0) }
        }

        let base64Audio = pcmData.base64EncodedString()
        
        // Dispatch to main actor for WebSocket send
        Task { @MainActor [weak self] in
            self?.sendMediaInput(base64Audio)
        }
    }

    private var audioPacketCount = 0
    
    private func sendMediaInput(_ base64Audio: String) {
        guard let streamId = streamId else {
            print("DEBUG: sendMediaInput - no streamId, dropping audio")
            return
        }

        let mediaEvent: [String: Any] = [
            "event": "media_input",
            "stream_id": streamId,
            "media": [
                "payload": base64Audio
            ]
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: mediaEvent),
              let jsonString = String(data: data, encoding: .utf8) else {
            return
        }

        audioPacketCount += 1
        if audioPacketCount <= 5 || audioPacketCount % 50 == 0 {
            print("DEBUG: Sending audio packet #\(audioPacketCount), payload size: \(base64Audio.count) chars")
        }
        
        webSocket?.send(.string(jsonString)) { error in
            if let error = error {
                print("ERROR: Failed to send media input: \(error)")
            }
        }
    }

    private func playAudioData(_ data: Data) {
        // Cartesia sends PCM 16-bit audio, convert to Float32 for playback
        let frameCount = data.count / MemoryLayout<Int16>.size

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: audioFormat,
            frameCapacity: AVAudioFrameCount(frameCount)
        ) else {
            return
        }

        buffer.frameLength = AVAudioFrameCount(frameCount)

        // Convert Int16 PCM to Float32
        data.withUnsafeBytes { ptr in
            let int16Ptr = ptr.bindMemory(to: Int16.self)
            for i in 0..<frameCount {
                buffer.floatChannelData![0][i] = Float(int16Ptr[i]) / 32767.0
            }
        }

        playerNode.scheduleBuffer(buffer)
    }

    private func startPingTimer() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { [weak self] _ in
            self?.webSocket?.sendPing { _ in }
        }
    }

    private func startDurationTimer() {
        durationTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.callDuration += 1
        }
    }

    private func stopTimers() {
        pingTimer?.invalidate()
        durationTimer?.invalidate()
        pingTimer = nil
        durationTimer = nil
    }

    // MARK: - URLSessionWebSocketDelegate

    nonisolated func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        print("DEBUG: WebSocket connected!")
        Task { @MainActor in
            self.isConnected = true
            if let continuation = self.connectionContinuation {
                self.connectionContinuation = nil
                continuation.resume()
            }
        }
    }

    nonisolated func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        let reasonStr = reason.flatMap { String(data: $0, encoding: .utf8) } ?? "unknown"
        print("DEBUG: WebSocket closed with code \(closeCode.rawValue): \(reasonStr)")
        Task { @MainActor in
            self.isConnected = false
            self.isCallActive = false
        }
    }
}

// MARK: - Error Types
enum VoiceCallError: LocalizedError {
    case invalidURL
    case noAccessToken
    case connectionFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid WebSocket URL"
        case .noAccessToken:
            return "Failed to get access token"
        case .connectionFailed:
            return "Failed to connect to voice service"
        }
    }
}
