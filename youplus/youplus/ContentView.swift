import SwiftUI

struct ContentView: View {
    @StateObject private var authManager = AuthManager()
    @AppStorage("onboarding_completed") private var onboardingCompleted: Bool = false
    @AppStorage("subscription_active") private var subscriptionActive: Bool = false
    @AppStorage("onboarding_pushed") private var onboardingPushed: Bool = false
    @State private var showLogin = false
    @State private var showOnboarding = false

    var body: some View {
        Group {
            // Target funnel: Onboarding -> Paywall -> Login -> Push Onboarding -> Dashboard
            if !onboardingCompleted {
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
            } else if !subscriptionActive {
                PaywallView(onSubscribed: {
                    subscriptionActive = true
                })
            } else if !authManager.isAuthenticated {
                LoginView()
            } else if !onboardingPushed {
                SetupProcessingView(onComplete: {
                    onboardingPushed = true
                })
            } else {
                DashboardView()
            }
        }
        .environmentObject(authManager)
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

#Preview {
    ContentView()
}
