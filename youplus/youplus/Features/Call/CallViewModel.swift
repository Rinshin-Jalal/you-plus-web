import Foundation
import Combine

/// ViewModel for managing voice call lifecycle and state
@MainActor
class CallViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isCallActive = false
    @Published var callDuration: TimeInterval = 0

    private let voiceService: WebSocketVoiceService
    private let userId: String
    private let voiceId: String?

    /// Initialize view model with user and voice preferences
    init(userId: String, voiceId: String?, agentId: String = Config.cartesiaAgentId) {
        self.userId = userId
        self.voiceId = voiceId
        self.voiceService = WebSocketVoiceService(agentId: agentId)

        // Bind to voice service state
        setupBindings()
    }

    /// Start a new voice call
    func startCall() async {
        isLoading = true
        errorMessage = nil

        do {
            try await voiceService.connect(voiceId: voiceId, userId: userId)
        } catch {
            errorMessage = "Failed to start call: \(error.localizedDescription)"
            isLoading = false
            return
        }

        isLoading = false
    }

    /// End the active call
    func endCall() {
        voiceService.disconnect()
    }

    // MARK: - Private

    /// Setup bindings to voice service state
    private func setupBindings() {
        Task {
            for await isActive in voiceService.$isCallActive.values {
                self.isCallActive = isActive
            }
        }

        Task {
            for await duration in voiceService.$callDuration.values {
                self.callDuration = duration
            }
        }
    }
}
