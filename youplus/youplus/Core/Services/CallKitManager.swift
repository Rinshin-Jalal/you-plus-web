import Foundation
import CallKit
import AVFoundation

/// Manages native iOS call interface using CallKit framework
/// Provides the same native call UI as regular phone calls
@MainActor
class CallKitManager: NSObject, ObservableObject {
    static let shared = CallKitManager()

    private let provider: CXProvider
    private let callController = CXCallController()
    private var activeCallUUID: UUID?

    @Published var hasActiveCall = false

    private override init() {
        // Configure CallKit provider for YOU+ app
        let configuration = CXProviderConfiguration(localizedName: "YOU+")
        configuration.supportsVideo = false
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportedHandleTypes = [.generic]

        // Optional: Add app icon to call screen
        if let appIcon = UIImage(named: "AppIcon") {
            configuration.iconTemplateImageData = appIcon.pngData()
        }

        self.provider = CXProvider(configuration: configuration)
        super.init()
        self.provider.setDelegate(self, queue: nil)
    }

    // MARK: - Public Methods

    /// Start an outgoing call through CallKit
    /// This will show the native iOS call screen
    func startCall(userId: String, displayName: String = "Future You") async throws {
        let uuid = UUID()
        activeCallUUID = uuid

        let handle = CXHandle(type: .generic, value: userId)
        let startCallAction = CXStartCallAction(call: uuid, handle: handle)
        startCallAction.isVideo = false

        let transaction = CXTransaction(action: startCallAction)

        try await callController.request(transaction)

        // Report that the call has connected
        provider.reportOutgoingCall(with: uuid, connectedAt: Date())
        hasActiveCall = true

        print("CallKit: Started outgoing call \(uuid)")
    }

    /// End the active call
    func endCall() {
        guard let uuid = activeCallUUID else { return }

        let endCallAction = CXEndCallAction(call: uuid)
        let transaction = CXTransaction(action: endCallAction)

        callController.request(transaction) { error in
            if let error = error {
                print("CallKit: End call error: \(error)")
            } else {
                print("CallKit: Call ended")
            }
        }

        activeCallUUID = nil
        hasActiveCall = false
    }

    /// Report an incoming call (not currently used, but available for future)
    func reportIncomingCall(userId: String, displayName: String = "Future You") {
        let uuid = UUID()
        activeCallUUID = uuid

        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: userId)
        update.localizedCallerName = displayName
        update.hasVideo = false

        provider.reportNewIncomingCall(with: uuid, update: update) { error in
            if let error = error {
                print("CallKit: Report incoming call error: \(error)")
            }
        }
    }
}

// MARK: - CXProviderDelegate
extension CallKitManager: CXProviderDelegate {
    /// Called when CallKit provider is reset (e.g., after phone restart)
    nonisolated func providerDidReset(_ provider: CXProvider) {
        print("CallKit: Provider reset")
    }

    /// Handle start call action
    nonisolated func provider(
        _ provider: CXProvider,
        perform action: CXStartCallAction
    ) {
        print("CallKit: Perform start call action")
        configureAudioSession()
        action.fulfill()
    }

    /// Handle answer call action
    nonisolated func provider(
        _ provider: CXProvider,
        perform action: CXAnswerCallAction
    ) {
        print("CallKit: Perform answer call action")
        configureAudioSession()
        action.fulfill()
    }

    /// Handle end call action
    nonisolated func provider(
        _ provider: CXProvider,
        perform action: CXEndCallAction
    ) {
        print("CallKit: Perform end call action")
        Task { @MainActor in
            CallKitManager.shared.activeCallUUID = nil
            CallKitManager.shared.hasActiveCall = false
        }
        action.fulfill()
    }

    /// Called when CallKit activates the audio session
    /// Start audio engine when CallKit is ready
    nonisolated func provider(
        _ provider: CXProvider,
        didActivate audioSession: AVAudioSession
    ) {
        print("CallKit: Audio session activated")
        NotificationCenter.default.post(name: .audioSessionActivated, object: nil)
    }

    /// Called when CallKit deactivates the audio session
    nonisolated func provider(
        _ provider: CXProvider,
        didDeactivate audioSession: AVAudioSession
    ) {
        print("CallKit: Audio session deactivated")
        NotificationCenter.default.post(name: .audioSessionDeactivated, object: nil)
    }

    /// Configure audio session for voice call
    private nonisolated func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.allowBluetooth, .defaultToSpeaker]
            )
            try session.setActive(true)
        } catch {
            print("CallKit: Audio session configuration failed: \(error)")
        }
    }
}

// MARK: - Notifications
extension Notification.Name {
    static let audioSessionActivated = Notification.Name("audioSessionActivated")
    static let audioSessionDeactivated = Notification.Name("audioSessionDeactivated")
}
