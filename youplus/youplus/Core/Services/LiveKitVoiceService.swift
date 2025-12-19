import Foundation
import LiveKit
import AVFoundation
import Combine

/// Manages LiveKit connection for real-time voice calls with Future Self
@MainActor
class LiveKitVoiceService: NSObject, ObservableObject {
    // MARK: - Published Properties
    @Published var isConnected = false
    @Published var isCallActive = false
    @Published var errorMessage: String?
    @Published var callDuration: TimeInterval = 0

    // MARK: - Private Properties
    private var room: Room?
    private var durationTimer: Timer?
    private let apiClient = APIClient.shared
    private let callKitManager = CallKitManager.shared
    private let authManager = AuthManager.shared

    // MARK: - Public Methods

    /// Connect to LiveKit room and begin voice call
    func connect(userId: String) async throws {
        print("DEBUG: Connecting to LiveKit for userId=\(userId)")

        // 1. Start CallKit call
        try await callKitManager.startCall(userId: userId, displayName: "Future You")

        // 2. Get LiveKit token from backend
        let tokenData = try await fetchLiveKitToken()

        // 3. Configure audio session
        try configureAudioSession()

        // 4. Connect to LiveKit room
        let roomOptions = RoomOptions(
            defaultCameraCaptureOptions: CameraCaptureOptions(
                dimensions: .h1080_169
            ),
            defaultAudioCaptureOptions: AudioCaptureOptions(
                echoCancellation: true,
                noiseSuppression: true
            ),
            adaptiveStream: true,
            dynacast: true
        )

        room = Room(delegate: self)

        try await room?.connect(
            url: tokenData.url,
            token: tokenData.token,
            roomOptions: roomOptions
        )

        // 5. Enable microphone
        try await room?.localParticipant.setMicrophone(enabled: true)

        isConnected = true
        isCallActive = true
        startDurationTimer()

        print("✅ Connected to LiveKit room: \(tokenData.roomName)")
    }

    /// Disconnect from LiveKit room
    func disconnect() async {
        print("DEBUG: Disconnecting from LiveKit")

        durationTimer?.invalidate()
        durationTimer = nil

        await room?.disconnect()
        room = nil

        isConnected = false
        isCallActive = false
        callDuration = 0

        await callKitManager.endCall()

        print("✅ Disconnected from LiveKit")
    }

    // MARK: - Private Methods

    private func fetchLiveKitToken() async throws -> LiveKitTokenResponse {
        guard let accessToken = authManager.accessToken else {
            throw LiveKitError.tokenFetchFailed
        }

        do {
            return try await apiClient.fetchLiveKitToken(accessToken: accessToken)
        } catch {
            print("ERROR: Failed to fetch LiveKit token: \(error)")
            throw LiveKitError.tokenFetchFailed
        }
    }

    private func configureAudioSession() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(
            .playAndRecord,
            mode: .voiceChat,
            options: [.allowBluetooth, .defaultToSpeaker]
        )
        try audioSession.setActive(true)
    }

    private func startDurationTimer() {
        callDuration = 0
        durationTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.callDuration += 1
            }
        }
    }
}

// MARK: - RoomDelegate
extension LiveKitVoiceService: RoomDelegate {
    nonisolated func room(_ room: Room, didUpdate connectionState: ConnectionState, from oldValue: ConnectionState) {
        Task { @MainActor in
            print("LiveKit connection state: \(connectionState)")

            switch connectionState {
            case .connected:
                isConnected = true
            case .disconnected:
                isConnected = false
                isCallActive = false
            case .reconnecting:
                print("⚠️ Reconnecting to LiveKit...")
            default:
                break
            }
        }
    }

    nonisolated func room(_ room: Room, participant: RemoteParticipant, didSubscribe track: Track, publication: TrackPublication) {
        Task { @MainActor in
            print("✅ Subscribed to track: \(track.kind)")

            if let audioTrack = track as? RemoteAudioTrack {
                // Agent audio track - automatically played
                print("🎧 Agent audio track subscribed")
            }
        }
    }

    nonisolated func room(_ room: Room, participant: RemoteParticipant, didUnsubscribe track: Track, publication: TrackPublication) {
        print("Track unsubscribed: \(track.kind)")
    }

    nonisolated func room(_ room: Room, didUpdateReconnectMode reconnectMode: ReconnectMode) {
        Task { @MainActor in
            print("LiveKit reconnect mode updated: \(reconnectMode)")
        }
    }
}

// MARK: - Models
struct LiveKitTokenResponse: Codable {
    let token: String
    let url: String
    let roomName: String
}

enum LiveKitError: LocalizedError {
    case tokenFetchFailed
    case connectionFailed

    var errorDescription: String? {
        switch self {
        case .tokenFetchFailed:
            return "Failed to fetch LiveKit access token"
        case .connectionFailed:
            return "Failed to connect to LiveKit room"
        }
    }
}
