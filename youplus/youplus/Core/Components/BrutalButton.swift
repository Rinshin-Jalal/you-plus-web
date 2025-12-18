import SwiftUI

struct BrutalButton: View {
    enum Style {
        case primary   // White background, waits patiently
        case secondary // Text-only, muted
        case accent
        case danger
    }
    
    let title: String
    let style: Style
    var icon: String? = nil
    var action: () -> Void
    
    @State private var isPressed: Bool = false
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                }
                
                Text(title)
                    .font(AppTheme.Fonts.body(16)) // Calm, not shouting
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56) // Taller, easy to tap
            .background(backgroundView)
            .foregroundColor(foregroundColor)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous)) // Medium radius, not pill
            .shadow(
                color: shadowColor,
                radius: shadowRadius,
                x: 0,
                y: shadowY
            )
        }
        .buttonStyle(PremiumButtonStyle())
    }
    
    @ViewBuilder
    private var backgroundView: some View {
        switch style {
        case .primary:
            // White background (buttons wait patiently)
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(AppTheme.whiteSoft)
        case .secondary:
            // Transparent (text-only)
            Color.clear
        case .accent:
            // Rare - only for special moments
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(AppTheme.darkOrange)
        case .danger:
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(AppTheme.danger)
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .primary:
            return AppTheme.blackAbsolute // Black text on white
        case .secondary:
            return AppTheme.whiteMuted
        case .accent:
            return AppTheme.whiteSoft
        case .danger:
            return AppTheme.whiteSoft
        }
    }
    
    private var shadowColor: Color {
        switch style {
        case .primary:
            // Orange glow appears on press
            return AppTheme.Glow.orange().color
        default:
            return Color.clear
        }
    }
    
    private var shadowRadius: CGFloat {
        switch style {
        case .primary:
            return AppTheme.Glow.orange().radius
        default:
            return 0
        }
    }
    
    private var shadowY: CGFloat {
        switch style {
        case .primary:
            return 12
        default:
            return 0
        }
    }
}

// Premium button press style (subtle, no bounce)
struct PremiumButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(PremiumAnimations.slowFade, value: configuration.isPressed)
    }
}
