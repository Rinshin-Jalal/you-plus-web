import SwiftUI

/// Post-paywall, post-login processing screen.
/// Goal: push onboarding payload to backend and poll job status (mirrors web `/setup`).
struct SetupProcessingView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var onboardingVM: OnboardingViewModel
    @AppStorage("onboarding_pushed") private var onboardingPushed: Bool = false
    
    @State private var statusText: String = "Preparing your Future Self..."
    @State private var progress: Double = 0.1
    @State private var isRunning: Bool = false
    @State private var errorMessage: String?
    @State private var jobId: String?
    
    var onComplete: (() -> Void)? = nil
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 24) {
                Spacer()
                
                WitnessLogo(size: 56, showWordmark: true)
                
                VStack(spacing: 10) {
                    Text("CREATING YOUR\nFUTURE SELF")
                        .font(AppTheme.Fonts.heavy(34))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .textCase(.uppercase)
                    
                    Text(statusText)
                        .font(AppTheme.Fonts.body(16))
                        .foregroundColor(.white.opacity(0.6))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                
                VStack(spacing: 10) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Rectangle().fill(Color.white.opacity(0.08))
                            Rectangle()
                                .fill(AppTheme.accent)
                                .frame(width: geo.size.width * min(max(progress, 0), 1))
                                .animation(.easeInOut(duration: 0.3), value: progress)
                        }
                    }
                    .frame(height: 6)
                    
                    Text("\(Int(progress * 100))%")
                        .font(AppTheme.Fonts.mono(12))
                        .foregroundColor(.white.opacity(0.4))
                }
                .padding(.horizontal, 24)
                
                if let errorMessage = errorMessage {
                    Text("Error: \(errorMessage)")
                        .font(AppTheme.Fonts.mono(10))
                        .foregroundColor(.red.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                
                Spacer()
            }
        }
        .onAppear {
            guard !isRunning else { return }
            isRunning = true
            pushOnboarding()
        }
    }
    
    private func pushOnboarding() {
        Task {
            do {
                // Guard we have a token
                guard let token = authManager.accessToken else {
                    await MainActor.run {
                        errorMessage = "No authentication token"
                    }
                    return
                }
                
                // Build payload from onboarding VM
                statusText = "Building your profile..."
                progress = 0.15
                
                let payload = onboardingVM.buildConversionPayload()
                
                // Push to backend
                statusText = "Uploading to server..."
                progress = 0.3
                
                let apiClient = APIClient()
                let jobResponse = try await apiClient.pushOnboarding(
                    payload: payload,
                    accessToken: token
                )
                
                await MainActor.run {
                    jobId = jobResponse.jobId
                }
                
                // Poll status
                await pollJobStatus(jobId: jobResponse.jobId, accessToken: token)
                
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    statusText = "Error"
                }
            }
        }
    }
    
    private func pollJobStatus(jobId: String, accessToken: String) async {
        let apiClient = APIClient()
        var pollCount = 0
        let maxPolls = 60 // Max 2 minutes of polling (every 2 seconds)
        
        while pollCount < maxPolls {
            do {
                statusText = "Processing your voice recordings..."
                progress = 0.3 + (Double(pollCount) / Double(maxPolls)) * 0.5
                
                let status = try await apiClient.pollOnboardingStatus(
                    jobId: jobId,
                    accessToken: accessToken
                )
                
                await MainActor.run {
                    switch status.status {
                    case "pending":
                        statusText = "Queued for processing..."
                        progress = 0.35
                    case "processing":
                        let step = status.currentStep ?? "processing"
                        statusText = "Step: \(step)"
                        if let jobProgress = status.progress {
                            progress = 0.3 + Double(jobProgress) / 100.0 * 0.5
                        }
                    case "completed":
                        statusText = "Complete!"
                        progress = 1.0
                        onboardingPushed = true
                        onComplete?()
                        return
                    case "failed":
                        errorMessage = status.error ?? "Unknown error"
                        statusText = "Error"
                        return
                    default:
                        statusText = status.status
                    }
                }
                
                // Poll again after 2 seconds
                pollCount += 1
                try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
                
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    statusText = "Error"
                }
                return
            }
        }
        
        // Timeout
        await MainActor.run {
            errorMessage = "Processing timeout - please check your profile"
            statusText = "Timeout"
        }
    }
}

#Preview {
    SetupProcessingView()
}


