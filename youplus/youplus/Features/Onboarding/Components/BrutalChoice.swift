import SwiftUI

struct BrutalChoice: View {
    let title: String
    let selected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Text (calm, not shouting)
                Text(title)
                    .font(AppTheme.Fonts.body(16)) // Regular weight, not bold
                    .foregroundColor(selected ? AppTheme.whiteSoft : AppTheme.whiteMuted)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)

                Spacer()
                
                // Subtle indicator (only when selected)
                if selected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(AppTheme.darkOrange) // Orange = intent
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(selected ? AppTheme.orangeMist : AppTheme.Glass.background) // Glass cards
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(
                                selected ? AppTheme.darkOrange.opacity(0.3) : AppTheme.Glass.border,
                                lineWidth: 1
                            )
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .animation(PremiumAnimations.slowFade, value: selected)
    }
}
