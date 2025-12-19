import Foundation
import AVFoundation
import Combine

/// Manages WebSocket connection to Cartesia agent for real-time voice calls
@MainActor
class WebSocketVoiceService: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var isConnected = false
    @Published var isCallActive = false
    @Published var errorMessage: String?
    @Published var callDuration: TimeInterval = 0

    // MARK: - Private Properties
    private var webSocketTask: URLSessionWebSocketTask?
    private var audioEngine = AVAudioEngine()
    private var playerNode = AVAudioPlayerNode()
    private var pingTimer: Timer?
    private var durationTimer: Timer?
    private var receiveTask: Task<Void, Never>?

    private let apiClient = APIClient.shared
    private var accessToken: String?
    private let agentId: String
    private let callKitManager = CallKitManager.shared

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
        setupAudioEngine()
    }

    deinit {
        stopTimers()
        receiveTask?.cancel()
    }

    // MARK: - Public Methods

    /// Connect to Cartesia WebSocket and begin audio streaming
    func connect(voiceId: String?, userId: String) async throws {
        // 0. Start CallKit call first (shows native iOS call screen)
        try await callKitManager.startCall(userId: userId, displayName: "Future You")

        // 1. Get access token from backend
        accessToken = try await fetchAccessToken()

        // 2. Build WebSocket URL with user context
        var components = URLComponents(string: "wss://api.cartesia.ai/agents/stream/\(agentId)")!
        components.queryItems = [
            URLQueryItem(name: "user_id", value: userId),
            URLQueryItem(name: "voice_id", value: voiceId ?? "default"),
        ]

        guard let url = components.url else {
            throw VoiceCallError.invalidURL
        }

        // 3. Create WebSocket request with Cartesia headers
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken!)", forHTTPHeaderField: "Authorization")
        request.setValue("2025-04-16", forHTTPHeaderField: "Cartesia-Version")

        // 4. Create and establish WebSocket connection
        let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
        webSocketTask = session.webSocketTask(with: request)
        webSocketTask?.resume()

        // 5. Send start event to initialize stream
        try await sendStartEvent()

        // 6. Setup audio session listeners
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

        // 7. Start receiving messages from agent
        startReceivingMessages()

        // 8. Start keep-alive ping (every 20s, server closes after 30s inactivity)
        startPingTimer()

        isConnected = true
        isCallActive = true
        startDurationTimer()
    }

    /// Disconnect from WebSocket and cleanup resources
    func disconnect() {
        // End CallKit call
        callKitManager.endCall()

        // Close WebSocket connection
        webSocketTask?.cancel(with: .goingAway, reason: nil)

        // Cleanup resources
        stopAudioEngine()
        stopTimers()
        receiveTask?.cancel()

        // Remove observers
        NotificationCenter.default.removeObserver(self)

        isConnected = false
        isCallActive = false
        callDuration = 0
    }

    // MARK: - Private Methods

    /// Fetch Cartesia access token from backend
    private func fetchAccessToken() async throws -> String {
        let response = try await apiClient.post(
            "/api/cartesia/access-token",
            body: [:]
        )

        guard let token = response["accessToken"] as? String else {
            throw VoiceCallError.noAccessToken
        }

        return token
    }

    /// Send start event to initialize WebSocket stream
    private func sendStartEvent() async throws {
        let startEvent: [String: Any] = [
            "type": "start",
            "audio_format": "pcm_44100",  // 44.1kHz PCM
        ]

        let data = try JSONSerialization.data(withJSONObject: startEvent)
        try await webSocketTask?.send(.data(data))
    }

    /// Setup AVAudioEngine for microphone input and speaker output
    private func setupAudioEngine() {
        // Attach audio player node for agent output
        audioEngine.attach(playerNode)
        audioEngine.connect(
            playerNode,
            to: audioEngine.mainMixerNode,
            format: audioFormat
        )

        // Setup input node tap for microphone
        let inputNode = audioEngine.inputNode
        let inputFormat = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(
            onBus: 0,
            bufferSize: 4096,
            format: inputFormat
        ) { [weak self] buffer, _ in
            self?.processInputAudio(buffer)
        }

        // Configure audio session for voice calls
        configureAudioSession()
    }

    /// Configure AVAudioSession for voice call mode
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
            print("Audio session configuration failed: \(error)")
        }
    }

    /// Start the audio engine and player node
    private func startAudioEngine() {
        guard !audioEngine.isRunning else { return }

        do {
            try audioEngine.start()
            playerNode.play()
        } catch {
            print("Failed to start audio engine: \(error)")
        }
    }

    /// Stop the audio engine
    private func stopAudioEngine() {
        audioEngine.stop()
        playerNode.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
    }

    /// Process microphone input and send to WebSocket
    private func processInputAudio(_ buffer: AVAudioPCMBuffer) {
        guard isCallActive, let channelData = buffer.floatChannelData else { return }

        // Convert PCM buffer to Data
        let frameLength = Int(buffer.frameLength)
        let data = Data(
            bytes: channelData[0],
            count: frameLength * MemoryLayout<Float>.size
        )

        // Convert to base64 for transmission
        let base64Audio = data.base64EncodedString()

        // Send via WebSocket
        Task {
            try? await sendMediaInput(base64Audio)
        }
    }

    /// Send audio data to WebSocket
    private func sendMediaInput(_ base64Audio: String) async throws {
        let mediaEvent: [String: Any] = [
            "type": "media_input",
            "data": base64Audio,
        ]

        let data = try JSONSerialization.data(withJSONObject: mediaEvent)
        try await webSocketTask?.send(.data(data))
    }

    /// Start receiving messages from WebSocket
    private func startReceivingMessages() {
        receiveTask = Task {
            await receiveLoop()
        }
    }

    /// Continuous message receive loop
    private func receiveLoop() async {
        while isCallActive {
            do {
                guard let task = webSocketTask else { return }
                let message = try await task.receive()
                handleMessage(message)
            } catch {
                print("WebSocket receive error: \(error)")
                await MainActor.run {
                    self.errorMessage = "Connection lost"
                    self.disconnect()
                }
                return
            }
        }
    }

    /// Handle received WebSocket message
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .data(let data):
            handleDataMessage(data)
        case .string(let text):
            handleTextMessage(text)
        @unknown default:
            break
        }
    }

    /// Handle binary data message (audio output)
    private func handleDataMessage(_ data: Data) {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return
        }

        switch type {
        case "media_output":
            // Decode and play agent audio response
            if let base64Audio = json["data"] as? String,
               let audioData = Data(base64Encoded: base64Audio) {
                playAudioData(audioData)
            }

        case "ack":
            print("WebSocket connection acknowledged")
            startAudioEngine()

        case "end_call":
            Task { @MainActor in
                disconnect()
            }

        default:
            print("Unknown message type: \(type)")
        }
    }

    /// Handle text message
    private func handleTextMessage(_ text: String) {
        print("WebSocket text message: \(text)")
    }

    /// Play audio data from agent
    private func playAudioData(_ data: Data) {
        // Convert Data to AVAudioPCMBuffer
        let frameCount = data.count / MemoryLayout<Float>.size

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: audioFormat,
            frameCapacity: AVAudioFrameCount(frameCount)
        ) else {
            return
        }

        buffer.frameLength = AVAudioFrameCount(frameCount)

        data.withUnsafeBytes { ptr in
            memcpy(buffer.floatChannelData![0], ptr.baseAddress!, data.count)
        }

        // Schedule buffer for playback
        playerNode.scheduleBuffer(buffer)
    }

    /// Start ping timer to keep connection alive
    private func startPingTimer() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 20, repeats: true) { [weak self] _ in
            self?.webSocketTask?.sendPing { error in
                if let error = error {
                    print("Ping failed: \(error)")
                }
            }
        }
    }

    /// Start call duration timer
    private func startDurationTimer() {
        durationTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.callDuration += 1
        }
    }

    /// Stop all timers
    private func stopTimers() {
        pingTimer?.invalidate()
        durationTimer?.invalidate()
        pingTimer = nil
        durationTimer = nil
    }
}

// MARK: - URLSessionWebSocketDelegate
extension WebSocketVoiceService: URLSessionWebSocketDelegate {
    nonisolated func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocolString: String?
    ) {
        print("WebSocket connected")
    }

    nonisolated func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        print("WebSocket disconnected: \(closeCode)")
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
