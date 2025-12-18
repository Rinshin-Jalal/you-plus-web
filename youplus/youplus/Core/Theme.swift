import SwiftUI

struct AppTheme {
    // DARK NEUTRALS (Darkness dominates)
    static let blackAbsolute = Color(hex: "0A0A0A")  // Main background
    static let blackSoft = Color(hex: "121212")      // Cards
    static let blackLifted = Color(hex: "1A1A1A")    // Modals
    
    // LIGHT NEUTRALS (Light is earned)
    static let whiteSoft = Color(hex: "EDEDED")      // Primary text
    static let whiteMuted = Color(hex: "9A9A9A")     // Secondary text
    
    // ACCENT (USE SPARINGLY - orange = intent, pulse, decision)
    static let darkOrange = Color(hex: "F97316")     // Only for meaning
    static let orangeGlow = Color(hex: "F97316").opacity(0.22)
    static let orangeMist = Color(hex: "F97316").opacity(0.08)
    
    // LEGACY ALIASES (for backward compatibility)
    static let background = blackAbsolute
    static let text = whiteSoft
    static let accent = darkOrange
    static let secondaryAccent = Color(hex: "E5E5E5")
    static let danger = Color(hex: "D93025")
    static let surface = blackSoft
    
    // GLASS SYSTEM (reading through frosted glass)
    struct Glass {
        static let background = Color.white.opacity(0.04)
        static let border = Color.white.opacity(0.06)
        static let blurRadius: CGFloat = 16
        
        // Focus glow (only when active)
        static let focusGlow = Color(hex: "F97316").opacity(0.12)
        static let focusGlowRadius: CGFloat = 40
    }
    
    // GRADIENTS (very controlled)
    struct Gradients {
        // Ambient (black → transparent)
        static func ambient() -> LinearGradient {
            LinearGradient(
                colors: [Color.black.opacity(0.6), Color.clear],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        
        // Accent bloom (rare - only for hero moments)
        static func accentBloom() -> RadialGradient {
            RadialGradient(
                colors: [AppTheme.darkOrange.opacity(0.12), Color.clear],
                center: .top,
                startRadius: 50,
                endRadius: 400
            )
        }
    }
    
    // GLOW SYSTEM (DO NOT OVERUSE - max 1 per screen)
    struct Glow {
        // Orange glow = action/pulse/call
        static func orange(radius: CGFloat = 60) -> (color: Color, radius: CGFloat) {
            return (AppTheme.darkOrange.opacity(0.3), radius)
        }
        
        // White glow = focus/reading
        static func white(radius: CGFloat = 40) -> (color: Color, radius: CGFloat) {
            return (Color.white.opacity(0.2), radius)
        }
    }
    
    struct Spacing {
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    struct Fonts {
        // HEADLINES (Editorial, calm - serif feel)
        static func headline(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .medium, design: .serif)
        }
        
        // BODY (Sans, small, calm)
        static func body(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .regular, design: .default)
        }
        
        // MONO (For labels, technical info)
        static func mono(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .medium, design: .monospaced)
        }
        
        // LEGACY SUPPORT
        static func heavy(_ size: CGFloat) -> Font {
            return headline(size)
        }
        
        static func label(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .semibold, design: .default)
        }
    }
}

// MOTION SYSTEM (air moving, not UI reacting)
struct PremiumAnimations {
    // Slow fade (300-600ms)
    static let slowFade = Animation.easeOut(duration: 0.5)
    
    // Breathing opacity (subtle loop)
    static let breathing = Animation
        .easeInOut(duration: 2.0)
        .repeatForever(autoreverses: true)
    
    // NO bounce, elastic, or springy
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
