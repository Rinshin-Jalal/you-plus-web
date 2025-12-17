import SwiftUI

struct AppTheme {
    static let background = Color(hex: "050505") // Slightly deeper black
    static let text = Color(hex: "FFFFFF")
    static let accent = Color(hex: "FF6B00") // Vibrant Orange
    static let secondaryAccent = Color(hex: "E5E5E5")
    static let danger = Color(hex: "D93025")
    static let surface = Color(hex: "121212")
    
    struct Spacing {
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    struct Fonts {
        static func heavy(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .black, design: .default)
        }
        
        static func mono(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .bold, design: .monospaced)
        }
        
        static func body(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .medium, design: .default)
        }
        
        static func label(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .semibold, design: .default)
        }
    }
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
