import Foundation
import Combine

@MainActor
class CallViewModel: ObservableObject {
    @Published var isCallActive = false
    @Published var callDuration: TimeInterval = 0
    @Published var errorMessage: String?
    @Published var isConnecting = false

    // Replace WebSocketVoiceService with LiveKitVoiceService
    private let voiceService = LiveKitVoiceService()
    private var cancellables = Set<AnyCancellable>()

    init() {
        // Observe voice service state
        voiceService.$isCallActive
            .assign(to: &$isCallActive)

        voiceService.$callDuration
            .assign(to: &$callDuration)

        voiceService.$errorMessage
            .assign(to: &$errorMessage)
    }

    func startCall(userId: String) async {
        isConnecting = true
        errorMessage = nil

        do {
            try await voiceService.connect(userId: userId)
            isConnecting = false
        } catch {
            isConnecting = false
            errorMessage = error.localizedDescription
            print("❌ Call failed: \(error)")
        }
    }

    func endCall() async {
        await voiceService.disconnect()
    }
}