import SwiftUI

/// Main call interface using native iOS CallKit UI
/// The actual call screen is provided by CallKit framework
struct CallView: View {
    @EnvironmentObject private var authManager: AuthManager
    @StateObject private var viewModel: CallViewModel
    @Environment(\.dismiss) private var dismiss

    init(voiceId: String?) {
        _viewModel = StateObject(wrappedValue: CallViewModel(voiceId: voiceId))
    }

    var body: some View {
        ZStack {
            // Dark background
            Color.black.ignoresSafeArea()

            // Premium dark UI atmosphere
            AtmosphereView(imageName: "onboarding", blurRadius: 60, opacity: 0.2)
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                // Call Status Info
                VStack(spacing: 16) {
                    if viewModel.isCallActive {
                        // Connected state
                        VStack(spacing: 12) {
                            Circle()
                                .fill(AppTheme.darkOrange)
                                .frame(width: 12, height: 12)
                                .scaleEffect(1.5)
                                .animation(.easeInOut(duration: 1).repeatForever(autoreverses: true), value: UUID())

                            Text("CALL ACTIVE")
                                .font(AppTheme.Fonts.mono(12))
                                .foregroundColor(AppTheme.darkOrange)
                                .tracking(2)

                            Text(formatTime(viewModel.callDuration))
                                .font(AppTheme.Fonts.mono(40))
                                .foregroundColor(AppTheme.whiteSoft)
                        }
                    } else {
                        // Loading state
                        VStack(spacing: 12) {
                            ProgressView()
                                .tint(AppTheme.whiteSoft)

                            Text("Calling Future You...")
                                .font(AppTheme.Fonts.mono(14))
                                .foregroundColor(.white.opacity(0.7))
                        }
                    }
                }

                Spacer()

                // Error message if any
                if let error = viewModel.errorMessage {
                    VStack(spacing: 12) {
                        Text("Error")
                            .font(AppTheme.Fonts.mono(12))
                            .foregroundColor(.red)
                            .tracking(2)

                        Text(error)
                            .font(AppTheme.Fonts.mono(13))
                            .foregroundColor(.red.opacity(0.8))
                            .lineLimit(3)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity)
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(12)
                    .padding(.horizontal, 32)
                }

                // End Call Button
                Button(action: {
                    viewModel.endCall()
                    dismiss()
                }) {
                    HStack(spacing: 12) {
                        Image(systemName: "phone.down.fill")
                        Text("END CALL")
                            .font(AppTheme.Fonts.mono(14))
                            .tracking(1)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.red.opacity(0.25))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.red.opacity(0.5), lineWidth: 1)
                    )
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 48)
            }
        }
        .navigationBarHidden(true)
        .task {
            // Get userId from authManager
            if let userId = authManager.userId, !userId.isEmpty {
                print("DEBUG CallView task: Got userId=\(userId)")
                await viewModel.startCall(userId: userId)
            } else {
                print("DEBUG CallView task: userId is nil or empty. isAuthenticated=\(authManager.isAuthenticated)")
                await MainActor.run {
                    viewModel.errorMessage = "Failed to get user ID"
                }
            }
        }
        .onDisappear {
            viewModel.endCall()
        }
    }

    private func formatTime(_ seconds: TimeInterval) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%02d:%02d", mins, secs)
    }
}

#Preview {
    CallView(voiceId: nil)
        .environmentObject(AuthManager.shared)
}
