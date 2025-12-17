import SwiftUI

struct BrutalButton: View {
    enum Style {
        case primary
        case secondary
        case accent
        case danger
    }
    
    let title: String
    let style: Style
    var icon: String? = nil
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .bold))
                }
                
                Text(title)
                    .font(AppTheme.Fonts.heavy(16))
                    .kerning(1.5)
                    .textCase(.uppercase)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var backgroundColor: Color {
        switch style {
        case .primary: return AppTheme.accent
        case .secondary: return .clear
        case .accent: return .white
        case .danger: return AppTheme.danger
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .primary: return .black
        case .secondary: return AppTheme.text
        case .accent: return .black
        case .danger: return .white
        }
    }
}
