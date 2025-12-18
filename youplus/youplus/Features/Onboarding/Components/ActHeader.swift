import SwiftUI

struct ActHeader: View {
    let currentStep: Int
    let totalSteps: Int

    var progress: CGFloat {
        guard totalSteps > 0 else { return 0 }
        return CGFloat(currentStep) / CGFloat(totalSteps)
    }

    var body: some View {
        HStack(spacing: 12) {
            // Step counter
            Text(String(format: "%02d", currentStep))
                .font(AppTheme.Fonts.mono(11))
                .foregroundColor(AppTheme.whiteMuted)

            // Progress bar - clean, no gradient
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background track (very subtle)
                    Rectangle()
                        .fill(AppTheme.whiteMuted.opacity(0.15))

                    // Progress fill (solid, no gradient)
                    Rectangle()
                        .fill(AppTheme.darkOrange)
                        .frame(width: geometry.size.width * progress)
                        .animation(.easeInOut(duration: 0.4), value: progress)
                }
                .cornerRadius(1)
            }
            .frame(height: 3)

            // Total steps
            Text(String(format: "%02d", totalSteps))
                .font(AppTheme.Fonts.mono(11))
                .foregroundColor(AppTheme.whiteMuted.opacity(0.5))
        }
        .padding(.horizontal, 4)
    }
}
