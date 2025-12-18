import SwiftUI

struct ContentView: View {
    @StateObject private var authManager = AuthManager()
    @StateObject private var onboardingVM = OnboardingViewModel()
    @AppStorage("onboarding_completed") private var onboardingCompleted: Bool = false
    @AppStorage("subscription_active") private var subscriptionActive: Bool = false
    @AppStorage("onboarding_pushed") private var onboardingPushed: Bool = false
    @State private var showLogin = false
    @State private var showOnboarding = false

    var body: some View {
        Group {
            // If authenticated, prioritize dashboard flow (skip onboarding if already done)
            if authManager.isAuthenticated {
                if !subscriptionActive {
                    PaywallView(onSubscribed: {
                        subscriptionActive = true
                    })
                } else if !onboardingPushed && onboardingCompleted {
                    // Only show SetupProcessingView if onboarding was completed locally
                    SetupProcessingView(onComplete: {
                        onboardingPushed = true
                    })
                } else {
                    DashboardView()
                }
            }
            // No session: show onboarding flow
            else if !onboardingCompleted {
                NavigationStack {
                    WelcomeView(
                        onContinue: { showOnboarding = true },
                        onLogin: { showLogin = true }
                    )
                    .navigationDestination(isPresented: $showOnboarding) {
                        OnboardingView(onFinished: {
                            onboardingCompleted = true
                        })
                    }
                    .navigationDestination(isPresented: $showLogin) {
                        LoginView()
                    }
                }
                .preferredColorScheme(.dark)
                .tint(AppTheme.darkOrange)
            }
            // Onboarding completed but no subscription
            else if !subscriptionActive {
                PaywallView(onSubscribed: {
                    subscriptionActive = true
                })
            }
            // Fallback to login if no authentication
            else {
                LoginView()
            }
        }
        .environmentObject(authManager)
        .environmentObject(onboardingVM)
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

#Preview {
    ContentView()
}
