import SwiftUI

struct WitnessLogo: View {
    let size: CGFloat
    var showWordmark: Bool = false
    
    var body: some View {
        HStack(spacing: 8) {
            // Placeholder for the custom geometric logo
            ZStack {
                Circle()
                    .stroke(Color.white, lineWidth: size * 0.08)
                    .frame(width: size, height: size)
                
                Circle()
                    .fill(Color.white)
                    .frame(width: size * 0.4, height: size * 0.4)
                    .offset(x: size * 0.15, y: -size * 0.15)
            }
            .frame(width: size, height: size)
            
            if showWordmark {
                Text("YOU+")
                    .font(AppTheme.Fonts.heavy(size * 0.8))
                    .tracking(2)
                    .foregroundColor(.white)
            }
        }
    }
}
