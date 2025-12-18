import SwiftUI

/// iOS Paywall (pre-auth) — for now this is a lightweight placeholder.
/// Next step: replace with StoreKit / RevenueCat and real entitlement validation.
struct PaywallView: View {
    @AppStorage("subscription_active") private var subscriptionActive: Bool = false
    
    var onSubscribed: (() -> Void)? = nil
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 24) {
                Spacer()
                
                VStack(spacing: 10) {
                    Text("YOU+ PRO")
                        .font(AppTheme.Fonts.mono(12))
                        .tracking(2)
                        .foregroundColor(AppTheme.accent)
                    
                    Text("UNLOCK DAILY\nCALLS")
                        .font(AppTheme.Fonts.heavy(40))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .textCase(.uppercase)
                }
                
                VStack(spacing: 12) {
                    featureRow("Daily accountability calls")
                    featureRow("Personalized Future Self")
                    featureRow("Progress tracking")
                    featureRow("Cancel anytime")
                }
                .padding(.horizontal, 24)
                
                VStack(spacing: 12) {
                    BrutalButton(title: "Subscribe", style: .primary) {
                        // MOCK: set active. Replace with StoreKit purchase.
                        subscriptionActive = true
                        onSubscribed?()
                    }
                    
                    Text("This is a placeholder paywall.\nNext: real purchase flow.")
                        .font(AppTheme.Fonts.mono(10))
                        .foregroundColor(.white.opacity(0.25))
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 24)
                
                Spacer()
            }
        }
    }
    
    private func featureRow(_ text: String) -> some View {
        HStack(spacing: 10) {
            Rectangle()
                .fill(AppTheme.accent)
                .frame(width: 8, height: 8)
            Text(text.uppercased())
                .font(AppTheme.Fonts.mono(12))
                .foregroundColor(.white.opacity(0.7))
            Spacer()
        }
    }
}

#Preview {
    PaywallView()
}


