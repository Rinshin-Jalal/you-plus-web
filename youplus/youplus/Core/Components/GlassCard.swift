import SwiftUI

/// Glass card component - "reading through frosted glass"
/// Background: rgba(255,255,255,0.04)
/// Border: rgba(255,255,255,0.06)
/// Blur: 16px
struct GlassCard<Content: View>: View {
    let content: Content
    var hasFocus: Bool = false
    var padding: CGFloat = 20
    var cornerRadius: CGFloat = 20
    
    init(
        hasFocus: Bool = false,
        padding: CGFloat = 20,
        cornerRadius: CGFloat = 20,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.hasFocus = hasFocus
        self.padding = padding
        self.cornerRadius = cornerRadius
    }
    
    var body: some View {
        content
            .padding(padding)
            .background(glassBackground)
    }
    
    @ViewBuilder
    private var glassBackground: some View {
        ZStack {
            // Glass layer (subtle, almost invisible)
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(AppTheme.Glass.background)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .strokeBorder(AppTheme.Glass.border, lineWidth: 1)
                )
            
            // Optional focus glow (only when active - DO NOT OVERUSE)
            if hasFocus {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.clear)
                    .shadow(
                        color: AppTheme.Glass.focusGlow,
                        radius: AppTheme.Glass.focusGlowRadius,
                        x: 0,
                        y: 0
                    )
            }
        }
        .background(.ultraThinMaterial.opacity(0.5)) // iOS native blur (subtle)
    }
}
