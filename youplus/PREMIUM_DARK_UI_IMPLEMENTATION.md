# 🌑 Premium Dark UI System - Implementation Guide
## "Dark Silence + Rare Light" for YouPlus Onboarding

Based on: "reading thoughts through frosted glass in a dark room"

---

## 🎨 1. COLOR TOKENS (Update AppTheme.swift)

```swift
// youplus/youplus/Core/Theme.swift

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
    
    // LEGACY (Keep for now, migrate gradually)
    static let background = blackAbsolute
    static let text = whiteSoft
    static let accent = darkOrange
    static let secondaryAccent = Color(hex: "E5E5E5")
    static let danger = Color(hex: "D93025")
    static let surface = blackSoft
    
    // GLASS SYSTEM
    struct Glass {
        static let background = Color.white.opacity(0.04)
        static let border = Color.white.opacity(0.06)
        static let blurRadius: CGFloat = 16
        
        // Focus glow (only when active)
        static let focusGlow = Color(hex: "F97316").opacity(0.12)
        static let focusGlowRadius: CGFloat = 40
    }
    
    // GRADIENTS
    struct Gradients {
        // Ambient (black → transparent)
        static func ambient() -> LinearGradient {
            LinearGradient(
                colors: [Color.black.opacity(0.6), Color.clear],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        
        // Accent bloom (rare)
        static func accentBloom() -> RadialGradient {
            RadialGradient(
                colors: [AppTheme.darkOrange.opacity(0.12), Color.clear],
                center: .top,
                startRadius: 50,
                endRadius: 400
            )
        }
    }
    
    // GLOW SYSTEM (DO NOT OVERUSE)
    struct Glow {
        // Orange glow = action/pulse/call
        static let orange = Shadow(
            color: AppTheme.darkOrange.opacity(0.3),
            radius: 60,
            x: 0,
            y: 12
        )
        
        // White glow = focus/reading
        static let white = Shadow(
            color: Color.white.opacity(0.2),
            radius: 40,
            x: 0,
            y: 8
        )
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
        
        // MONO (For code, labels)
        static func mono(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .medium, design: .monospaced)
        }
        
        // LEGACY (migrate away from these)
        static func heavy(_ size: CGFloat) -> Font {
            return headline(size) // Maps to new system
        }
        
        static func label(_ size: CGFloat) -> Font {
            return .system(size: size, weight: .semibold, design: .default)
        }
    }
}

// Shadow helper
struct Shadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

---

## 🪟 2. GLASS CARD COMPONENT

```swift
// youplus/youplus/Core/Components/GlassCard.swift

import SwiftUI

struct GlassCard<Content: View>: View {
    let content: Content
    var hasFocus: Bool = false
    var padding: CGFloat = 20
    
    init(hasFocus: Bool = false, padding: CGFloat = 20, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.hasFocus = hasFocus
        self.padding = padding
    }
    
    var body: some View {
        content
            .padding(padding)
            .background(glassBackground)
    }
    
    @ViewBuilder
    private var glassBackground: some View {
        ZStack {
            // Glass layer
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(AppTheme.Glass.background)
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(AppTheme.Glass.border, lineWidth: 1)
                )
            
            // Optional focus glow (only when active)
            if hasFocus {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.clear)
                    .shadow(
                        color: AppTheme.Glass.focusGlow,
                        radius: AppTheme.Glass.focusGlowRadius,
                        x: 0,
                        y: 0
                    )
            }
        }
        .background(.ultraThinMaterial) // iOS native blur
    }
}

// USAGE:
// GlassCard {
//     VStack {
//         Text("Content")
//     }
// }
```

---

## 🖼️ 3. IMAGE LAYER COMPONENT (The Big One)

```swift
// youplus/youplus/Core/Components/BackgroundImage.swift

import SwiftUI

struct BackgroundImage: View {
    let imageName: String
    var gradientOpacity: CGFloat = 0.7
    var imageOpacity: CGFloat = 0.4
    var desaturation: CGFloat = 0.5 // Slightly desaturated
    var blur: CGFloat = 60 // Soft focus
    
    var body: some View {
        ZStack {
            // IMAGE LAYER (bottom)
            Image(imageName)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .blur(radius: blur) // Soft focus
                .grayscale(desaturation) // Slightly desaturated
                .opacity(imageOpacity) // Never full brightness
            
            // DARK GRADIENT (middle) - obscures image
            LinearGradient(
                colors: [
                    AppTheme.blackAbsolute.opacity(gradientOpacity),
                    AppTheme.blackAbsolute.opacity(0.3),
                    AppTheme.blackAbsolute.opacity(gradientOpacity)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            
            // FILM GRAIN (top) - removes digital flatness
            Rectangle()
                .fill(Color.white.opacity(0.05))
                .background(.ultraThinMaterial.opacity(0.03))
                .blendMode(.overlay)
        }
        .ignoresSafeArea()
    }
}

// USAGE:
// ZStack {
//     BackgroundImage(imageName: "commitment-hero")
//     
//     // Glass layer sits above
//     ScrollView {
//         GlassCard {
//             // Your content
//         }
//     }
// }
```

---

## 🎯 4. COMMITMENT CARD (Premium Implementation)

```swift
// Replace existing CommitmentCardView with this:

struct CommitmentCardView: View {
    let data: [String: Any]
    let onAccept: () -> Void
    
    @State private var agreed: Bool = false
    
    var coreIdentity: String { (data["core_identity"] as? String) ?? "Someone who shows up" }
    var primaryPillar: String { (data["primary_pillar"] as? String) ?? "" }
    
    var body: some View {
        ZStack {
            // LAYER 1: Distant image (dream, memory, reflection)
            BackgroundImage(
                imageName: "commitment-hero",
                gradientOpacity: 0.8, // Heavy darkness
                imageOpacity: 0.3,    // Image is distant
                desaturation: 0.6,    // Muted colors
                blur: 70              // Soft focus
            )
            
            // LAYER 2: Optional accent bloom (rare light)
            AppTheme.Gradients.accentBloom()
                .blendMode(.screen)
                .opacity(0.4)
            
            // LAYER 3: Content through glass
            ScrollView(showsIndicators: false) {
                VStack(spacing: 48) { // Calm spacing
                    Spacer(minLength: 40)
                    
                    // Icon (minimal, calm)
                    Image(systemName: "shield.fill")
                        .font(.system(size: 36))
                        .foregroundColor(AppTheme.whiteSoft)
                        .shadow(
                            color: AppTheme.Glow.white.color,
                            radius: AppTheme.Glow.white.radius,
                            x: 0,
                            y: 8
                        )
                    
                    // Headline (serif, editorial)
                    VStack(spacing: 8) {
                        Text("Your Commitment")
                            .font(AppTheme.Fonts.headline(32))
                            .foregroundColor(AppTheme.whiteSoft)
                        
                        Text("This contract is binding.")
                            .font(AppTheme.Fonts.body(15))
                            .foregroundColor(AppTheme.whiteMuted)
                    }
                    
                    // Identity card (glass)
                    GlassCard(hasFocus: false, padding: 24) {
                        VStack(spacing: 12) {
                            Text("I AM BECOMING")
                                .font(AppTheme.Fonts.mono(11))
                                .foregroundColor(AppTheme.whiteMuted)
                                .tracking(2.5)
                            
                            Text(coreIdentity)
                                .font(AppTheme.Fonts.headline(26))
                                .foregroundColor(AppTheme.whiteSoft)
                                .multilineTextAlignment(.center)
                                .lineSpacing(4)
                        }
                    }
                    
                    // Primary pillar (if exists)
                    if !primaryPillar.isEmpty {
                        pillarCard
                    }
                    
                    // The Code (glass list)
                    GlassCard(padding: 0) {
                        VStack(spacing: 0) {
                            pledgeRow("I will show up every single day.")
                            pledgeRow("I will be radically honest with myself.")
                            pledgeRow("I will not negotiate with my weaker self.")
                        }
                    }
                    
                    Spacer(minLength: 32)
                    
                    // Agreement + Button
                    VStack(spacing: 16) {
                        // Simple checkbox (no glow unless agreed)
                        agreementToggle
                        
                        // Primary button (white bg, waits patiently)
                        primaryButton
                    }
                    
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 20)
            }
        }
    }
    
    private var pillarCard: some View {
        GlassCard(padding: 18) {
            HStack(spacing: 14) {
                let pillar = getPillar(primaryPillar)
                
                Text(pillar?.icon ?? "🎯")
                    .font(.system(size: 28))
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(pillar?.label ?? primaryPillar)
                        .font(AppTheme.Fonts.body(16))
                        .foregroundColor(AppTheme.darkOrange) // Orange = intent
                    
                    if let future = data["pillar_\(primaryPillar)_future"] as? String {
                        Text(future)
                            .font(AppTheme.Fonts.body(14))
                            .foregroundColor(AppTheme.whiteMuted)
                            .lineLimit(2)
                    }
                }
                
                Spacer()
            }
        }
    }
    
    private var agreementToggle: some View {
        Button(action: {
            withAnimation(.easeOut(duration: 0.4)) {
                agreed.toggle()
            }
        }) {
            HStack(spacing: 14) {
                // Minimal checkbox
                ZStack {
                    Circle()
                        .strokeBorder(
                            agreed ? AppTheme.darkOrange : AppTheme.whiteMuted,
                            lineWidth: 1.5
                        )
                        .frame(width: 20, height: 20)
                    
                    if agreed {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(AppTheme.darkOrange)
                    }
                }
                
                Text("I accept full responsibility for my outcome.")
                    .font(AppTheme.Fonts.body(15))
                    .foregroundColor(agreed ? AppTheme.whiteSoft : AppTheme.whiteMuted)
                    .multilineTextAlignment(.leading)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(agreed ? AppTheme.orangeMist : Color.clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(
                                agreed ? AppTheme.darkOrange.opacity(0.3) : AppTheme.Glass.border,
                                lineWidth: 1
                            )
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var primaryButton: some View {
        Button(action: { onAccept() }) {
            Text("Sign Commitment")
                .font(AppTheme.Fonts.body(16))
                .foregroundColor(AppTheme.blackAbsolute) // Black text on white
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(agreed ? AppTheme.whiteSoft : AppTheme.whiteMuted)
                )
                // Orange glow appears on press (only when agreed)
                .shadow(
                    color: agreed ? AppTheme.Glow.orange.color : Color.clear,
                    radius: agreed ? AppTheme.Glow.orange.radius : 0,
                    x: 0,
                    y: agreed ? 12 : 0
                )
        }
        .disabled(!agreed)
        .opacity(agreed ? 1 : 0.5)
        .animation(.easeOut(duration: 0.3), value: agreed)
        .buttonStyle(PlainButtonStyle())
    }
    
    private func pledgeRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 16))
                .foregroundColor(AppTheme.darkOrange.opacity(0.6))
            
            Text(text)
                .font(AppTheme.Fonts.body(15))
                .foregroundColor(AppTheme.whiteSoft)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
        .background(
            Rectangle()
                .fill(AppTheme.Glass.border)
                .frame(height: 1),
            alignment: .bottom
        )
    }
    
    private func getPillar(_ id: String) -> PillarPreset? {
        PillarPreset.all.first(where: { $0.id == id })
    }
}
```

---

## 🎬 5. MOTION SYSTEM

```swift
// youplus/youplus/Core/Utilities/Animations.swift

import SwiftUI

struct PremiumAnimations {
    // Slow fade (300-600ms)
    static let slowFade = Animation.easeOut(duration: 0.5)
    
    // Breathing opacity (subtle loop)
    static let breathing = Animation
        .easeInOut(duration: 2.0)
        .repeatForever(autoreverses: true)
    
    // Vertical drift (2-6px)
    static let drift = Animation
        .easeInOut(duration: 3.0)
        .repeatForever(autoreverses: true)
    
    // NO bounce, elastic, or springy
    // Motion = air moving, not UI reacting
}

// USAGE:
// .animation(PremiumAnimations.slowFade, value: someState)
```

---

## 📋 EXECUTION CHECKLIST

Before shipping any screen, verify:

- [ ] **Is darkness dominant?** (Background = #0A0A0A)
- [ ] **Is light earned?** (White only for important text)
- [ ] **Is orange rare?** (Only for intent/decisions, not decoration)
- [ ] **Is glass subtle?** (0.04 opacity, barely visible border)
- [ ] **Is image softened?** (Blur 60-80, desaturated, opacity < 0.4)
- [ ] **Does it feel calm?** (Not impressive, but confident)
- [ ] **Film grain added?** (3-6% opacity overlay)
- [ ] **Glow used sparingly?** (Max 1 glow per screen)
- [ ] **Motion is slow?** (300-600ms, no bounce)
- [ ] **Buttons wait patiently?** (White bg, orange glow only on action)

---

## 🚫 FORBIDDEN

Never use:
- Rainbow gradients
- Sharp transitions
- Bold paragraphs
- Orange for decoration
- Bounce/elastic animations
- Multiple glows
- Sharp images
- Bright backgrounds
- Pill-shaped buttons (use medium radius)

---

## ✅ APPROVED

Always use:
- Darkness as default
- Glass cards (0.04 opacity)
- Soft, distant images
- Serif headlines
- Muted body text
- Slow fades
- White primary buttons
- Orange for meaning only

---

**"If something looks cool immediately, it's probably wrong. This style reveals itself slowly."**
