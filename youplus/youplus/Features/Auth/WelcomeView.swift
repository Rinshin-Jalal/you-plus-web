import SwiftUI

struct WelcomeView: View {
    var onContinue: () -> Void
    var onLogin: () -> Void = {}

    var body: some View {
        ZStack {
            // "Design environments, not pictures"
            // Using the hero image as an atmospheric layer
            AtmosphereView(
                imageName: "HeroBackground",
                blurRadius: 4,  // High visibility for Hero
                opacity: 0.8    // Distinctly visible
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Top header with login button
                HStack {
                    Spacer()
                    Button(action: onLogin) {
                        Text("Log In")
                            .font(AppTheme.Fonts.mono(13))
                            .foregroundColor(AppTheme.whiteMuted)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)

                Spacer()

                // Welcome Text
                VStack(spacing: 12) {
                    Text("WELCOME BACK")
                        .font(AppTheme.Fonts.mono(12))
                        .tracking(2)
                        .foregroundColor(AppTheme.accent)

                    Text("Ready to Lock In?")
                        .font(AppTheme.Fonts.heavy(40))
                        .foregroundColor(.white)
                        .lineLimit(2)

                    Text("Let's build your future together. One call at a time.")
                        .font(AppTheme.Fonts.body(16))
                        .foregroundColor(.white.opacity(0.6))
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 24)

                Spacer()

                // CTA Button
                VStack(spacing: 12) {
                    BrutalButton(title: "Get Started", style: .primary) {
                        onContinue()
                    }

                    Text("Your data stays yours.")
                        .font(AppTheme.Fonts.mono(10))
                        .foregroundColor(.white.opacity(0.3))
                        .multilineTextAlignment(.center)
                }
                .padding(24)
            }
        }
    }
}

#Preview {
    WelcomeView(onContinue: {}, onLogin: {})
}

