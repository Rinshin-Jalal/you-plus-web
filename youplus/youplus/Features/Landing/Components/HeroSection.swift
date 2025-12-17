import SwiftUI

struct HeroSection: View {
    var onStart: () -> Void
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: AppTheme.Spacing.lg) {
                Spacer()
                
                // Badge
                Text("FOR PEOPLE DONE WITH EXCUSES")
                    .font(AppTheme.Fonts.mono(12))
                    .tracking(2.5)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .overlay(
                        Rectangle()
                            .stroke(AppTheme.accent, lineWidth: 1)
                    )
                    .foregroundColor(AppTheme.accent)
                
                // Headline
                VStack(spacing: -12) {
                    Text("YOUR")
                        .foregroundColor(.white)
                    Text("FUTURE SELF")
                        .foregroundColor(AppTheme.accent)
                    Text("CALLS TONIGHT.")
                        .foregroundColor(.white)
                }
                .font(AppTheme.Fonts.heavy(56))
                .multilineTextAlignment(.center)
                .textCase(.uppercase)
                
                // Subheadline
                Text("Every night at 9:00 PM, your phone rings.\nYou have to answer for what you did today.")
                    .font(AppTheme.Fonts.body(18))
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                    .lineSpacing(4)
                
                // CTA
                BrutalButton(title: "ANSWER THE CALL", style: .primary, icon: "arrow.right", action: onStart)
                    .padding(.horizontal, AppTheme.Spacing.xl)
                    .padding(.top, AppTheme.Spacing.md)
                
                Spacer()
                
                // Scroll Indicator
                Image(systemName: "square")
                    .font(.system(size: 24))
                    .foregroundColor(.white.opacity(0.3))
                    .overlay(
                        Circle()
                            .fill(.white)
                            .frame(width: 4, height: 4)
                    )
                    .padding(.bottom, AppTheme.Spacing.xxl)
            }
        }
        .frame(minHeight: UIScreen.main.bounds.height)
    }
}
