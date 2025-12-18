import SwiftUI

struct LandingView: View {
    var onStart: () -> Void
    var onSignIn: (() -> Void)? = nil
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            GrainOverlay()
            
            VStack(spacing: 24) {
                Spacer()
                
                WitnessLogo(size: 72, showWordmark: true)
                
                VStack(spacing: 10) {
                    Text("FUTURE SELF")
                        .font(AppTheme.Fonts.mono(12))
                        .tracking(2)
                        .foregroundColor(AppTheme.accent)
                    
                    Text("LOCK IN")
                        .font(AppTheme.Fonts.heavy(44))
                        .foregroundColor(.white)
                        .textCase(.uppercase)
                }
                .padding(.top, 8)
                
                Text("A brutal onboarding. Then daily calls.\nNo excuses.")
                    .font(AppTheme.Fonts.body(16))
                    .foregroundColor(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                
                VStack(spacing: 12) {
                    BrutalButton(title: "Start", style: .primary) {
                        onStart()
                    }
                    
                    if let onSignIn {
                        BrutalButton(title: "I already have an account", style: .secondary) {
                            onSignIn()
                        }
                    }
                }
                .padding(.horizontal, 24)
                
                Spacer()
                
                Text("Your data stays yours. Your Future Self just holds you to it.")
                    .font(AppTheme.Fonts.mono(10))
                    .foregroundColor(.white.opacity(0.25))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 16)
            }
        }
    }
}

#Preview {
    LandingView(onStart: {}, onSignIn: {})
}


