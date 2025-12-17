import SwiftUI

struct ActHeader: View {
    let currentStep: Int
    let totalSteps: Int
    
    var progress: CGFloat {
        guard totalSteps > 0 else { return 0 }
        return CGFloat(currentStep) / CGFloat(totalSteps)
    }
    
    var body: some View {
        HStack(spacing: 8) {
            // Step counter
            Text(String(format: "%02d", currentStep))
                .font(AppTheme.Fonts.mono(12))
                .foregroundColor(AppTheme.accent)
            
            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background track
                    Rectangle()
                        .fill(AppTheme.text.opacity(0.1))
                        .frame(height: 2)
                    
                    // Progress fill
                    Rectangle()
                        .fill(AppTheme.accent)
                        .frame(width: geometry.size.width * progress, height: 2)
                        .animation(.spring(response: 0.5), value: progress)
                }
            }
            .frame(height: 2)
            
            // Total steps
            Text(String(format: "%02d", totalSteps))
                .font(AppTheme.Fonts.mono(12))
                .foregroundColor(AppTheme.text.opacity(0.3))
        }
    }
}
