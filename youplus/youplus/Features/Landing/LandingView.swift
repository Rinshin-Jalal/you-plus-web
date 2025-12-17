import SwiftUI

struct LandingView: View {
    var onStart: () -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                HeroSection(onStart: onStart)
                ProblemSection()
                HowItWorksSection()
                
                // Footer
                VStack(spacing: 24) {
                    Text("Stop lying to yourself.")
                        .font(AppTheme.Fonts.heavy(32))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                    
                    BrutalButton(title: "START YOUR FIRST CALL", style: .primary, icon: "phone.fill", action: onStart)
                        .padding(.horizontal, 32)
                }
                .padding(.vertical, 64)
                .frame(maxWidth: .infinity)
                .background(Color.black)
            }
        }
        .background(AppTheme.background)
        .ignoresSafeArea()
    }
}
