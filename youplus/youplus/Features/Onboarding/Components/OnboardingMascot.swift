import SwiftUI

// swiftlint:disable line_length
struct OnboardingMascot: View {
    enum Expression {
        case neutral
        case speaking
        case listening
        case thinking
        case encouraging
        case proud
        case serious
        case winking
    }

    enum Size {
        case small
        case medium
        case large

        var dimension: CGFloat {
            switch self {
            case .small: return 80
            case .medium: return 120
            case .large: return 160
            }
        }
    }

    let expression: Expression
    let size: Size
    var speaking: Bool = false
    var animate: Bool = false

    @State private var bounceOffset: CGFloat = 0
    @State private var scaleValue: CGFloat = 1.0
    @State private var eyeWinkAmount: CGFloat = 0 // 0 = open, 1 = closed

    var body: some View {
        ZStack {
            // Glow effect
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: [
                            Color(red: 0.97, green: 0.45, blue: 0.1, opacity: 0.3),
                            Color(red: 0.97, green: 0.45, blue: 0.1, opacity: 0)
                        ]),
                        center: .center,
                        startRadius: 0,
                        endRadius: size.dimension * 0.6
                    )
                )
                .frame(width: size.dimension * 1.2, height: size.dimension * 1.2)

            // Real SVG Mascot
            ZStack {
                // BODY - Orange blob (same for all expressions)
                BlobBodyShape()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.97, green: 0.45, blue: 0.1),
                                Color(red: 0.85, green: 0.35, blue: 0.05)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                // FACIAL FEATURES - Expression-specific
                switch expression {
                case .neutral:
                    NeutralFeaturesShape()
                        .fill(Color.black)
                case .speaking:
                    SpeakingFeaturesShape()
                        .fill(Color.black)
                case .winking:
                    WinkingFeaturesShape(eyeWinkAmount: eyeWinkAmount)
                        .fill(Color.black)
                default:
                    NeutralFeaturesShape()
                        .fill(Color.black)
                }
            }
            .frame(width: size.dimension * 1.3, height: size.dimension * 1.3)
            .offset(x: -size.dimension * 0.15, y: bounceOffset)
            .scaleEffect(scaleValue)
        }
        .onChange(of: expression) {
            startAnimations()
        }
        .onAppear {
            startAnimations()
        }
    }

    private func startAnimations() {
        if !animate { return }

        switch expression {
        case .speaking:
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                bounceOffset = -6
                scaleValue = 1.02
            }

        case .encouraging:
            withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                bounceOffset = -6
                scaleValue = 1.05
            }

        case .proud:
            withAnimation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true)) {
                scaleValue = 1.08
            }

        case .thinking:
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                bounceOffset = -3
            }

        case .listening:
            withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) {
                bounceOffset = -4
            }

        case .winking:
            withAnimation(.easeInOut(duration: 0.4).repeatForever(autoreverses: true)) {
                eyeWinkAmount = 1.0
            }
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                bounceOffset = -2
                scaleValue = 1.01
            }

        default:
            withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) {
                bounceOffset = -3
            }
        }
    }
}

// MARK: - Blob Body (same for all expressions)
struct BlobBodyShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.size.width
        let height = rect.size.height

        // Main body blob
        path.move(to: CGPoint(x: 0.89467*width, y: 0.2166*height))
        path.addCurve(to: CGPoint(x: 0.90345*width, y: 0.21611*height), control1: CGPoint(x: 0.89759*width, y: 0.21638*height), control2: CGPoint(x: 0.90052*width, y: 0.21622*height))
        path.addCurve(to: CGPoint(x: 0.95172*width, y: 0.22103*height), control1: CGPoint(x: 0.91947*width, y: 0.21564*height), control2: CGPoint(x: 0.93614*width, y: 0.21801*height))
        path.addCurve(to: CGPoint(x: 1.13776*width, y: 0.30829*height), control1: CGPoint(x: 1.0203*width, y: 0.23432*height), control2: CGPoint(x: 1.08703*width, y: 0.26849*height))
        path.addCurve(to: CGPoint(x: 1.34786*width, y: 0.69976*height), control1: CGPoint(x: 1.26652*width, y: 0.4111*height), control2: CGPoint(x: 1.34189*width, y: 0.55154*height))
        path.addCurve(to: CGPoint(x: 1.01442*width, y: 1.05618*height), control1: CGPoint(x: 1.35332*width, y: 0.87467*height), control2: CGPoint(x: 1.22638*width, y: 1.02556*height))
        path.addCurve(to: CGPoint(x: 0.94432*width, y: 1.06277*height), control1: CGPoint(x: 0.99171*width, y: 1.05947*height), control2: CGPoint(x: 0.96735*width, y: 1.06231*height))
        path.addCurve(to: CGPoint(x: 0.8771*width, y: 1.06236*height), control1: CGPoint(x: 0.92081*width, y: 1.06266*height), control2: CGPoint(x: 0.90137*width, y: 1.06364*height))
        path.addCurve(to: CGPoint(x: 0.67053*width, y: 1.01227*height), control1: CGPoint(x: 0.80441*width, y: 1.05879*height), control2: CGPoint(x: 0.73281*width, y: 1.04316*height))
        path.addCurve(to: CGPoint(x: 0.50092*width, y: 0.74005*height), control1: CGPoint(x: 0.55234*width, y: 0.95365*height), control2: CGPoint(x: 0.48851*width, y: 0.85423*height))
        path.addCurve(to: CGPoint(x: 0.51298*width, y: 0.66846*height), control1: CGPoint(x: 0.50371*width, y: 0.7144*height), control2: CGPoint(x: 0.50501*width, y: 0.69417*height))
        path.addCurve(to: CGPoint(x: 0.6873*width, y: 0.46021*height), control1: CGPoint(x: 0.53903*width, y: 0.5844*height), control2: CGPoint(x: 0.60342*width, y: 0.51125*height))
        path.addCurve(to: CGPoint(x: 0.85696*width, y: 0.34947*height), control1: CGPoint(x: 0.7445*width, y: 0.42495*height), control2: CGPoint(x: 0.818*width, y: 0.40064*height))
        path.addCurve(to: CGPoint(x: 0.8757*width, y: 0.25965*height), control1: CGPoint(x: 0.87652*width, y: 0.32378*height), control2: CGPoint(x: 0.88146*width, y: 0.28938*height))
        path.addCurve(to: CGPoint(x: 0.86805*width, y: 0.23997*height), control1: CGPoint(x: 0.87412*width, y: 0.25298*height), control2: CGPoint(x: 0.86971*width, y: 0.24657*height))
        path.addCurve(to: CGPoint(x: 0.89467*width, y: 0.2166*height), control1: CGPoint(x: 0.86359*width, y: 0.22227*height), control2: CGPoint(x: 0.87785*width, y: 0.21922*height))
        path.closeSubpath()

        return path
    }
}

// MARK: - Neutral Features (closed mouth smile + open eyes)
struct NeutralFeaturesShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.size.width
        let height = rect.size.height

        // Left eye
        path.move(to: CGPoint(x: 0.83618*width, y: 0.55925*height))
        path.addCurve(to: CGPoint(x: 0.88246*width, y: 0.67547*height), control1: CGPoint(x: 0.89934*width, y: 0.55391*height), control2: CGPoint(x: 0.90952*width, y: 0.64402*height))
        path.addCurve(to: CGPoint(x: 0.84569*width, y: 0.69785*height), control1: CGPoint(x: 0.87103*width, y: 0.68877*height), control2: CGPoint(x: 0.86536*width, y: 0.69378*height))
        path.addCurve(to: CGPoint(x: 0.79958*width, y: 0.58006*height), control1: CGPoint(x: 0.78051*width, y: 0.70058*height), control2: CGPoint(x: 0.77282*width, y: 0.61334*height))
        path.addCurve(to: CGPoint(x: 0.83618*width, y: 0.55925*height), control1: CGPoint(x: 0.80936*width, y: 0.5679*height), control2: CGPoint(x: 0.81901*width, y: 0.56248*height))
        path.closeSubpath()

        // Right eye
        path.move(to: CGPoint(x: 1.10327*width, y: 0.55856*height))
        path.addCurve(to: CGPoint(x: 1.13236*width, y: 0.56638*height), control1: CGPoint(x: 1.11474*width, y: 0.55878*height), control2: CGPoint(x: 1.12273*width, y: 0.56057*height))
        path.addCurve(to: CGPoint(x: 1.10974*width, y: 0.69812*height), control1: CGPoint(x: 1.17583*width, y: 0.59263*height), control2: CGPoint(x: 1.17264*width, y: 0.69201*height))
        path.addCurve(to: CGPoint(x: 1.08165*width, y: 0.69045*height), control1: CGPoint(x: 1.09967*width, y: 0.69792*height), control2: CGPoint(x: 1.0899*width, y: 0.69526*height))
        path.addCurve(to: CGPoint(x: 1.10327*width, y: 0.55856*height), control1: CGPoint(x: 1.03478*width, y: 0.66324*height), control2: CGPoint(x: 1.03846*width, y: 0.56781*height))
        path.closeSubpath()

        // Closed mouth (smile curve)
        path.move(to: CGPoint(x: 0.91994*width, y: 0.74598*height))
        path.addCurve(to: CGPoint(x: 1.04112*width, y: 0.75225*height), control1: CGPoint(x: 0.95885*width, y: 0.74482*height), control2: CGPoint(x: 1.00249*width, y: 0.74782*height))
        path.addCurve(to: CGPoint(x: 1.04243*width, y: 0.78811*height), control1: CGPoint(x: 1.06097*width, y: 0.75453*height), control2: CGPoint(x: 1.06517*width, y: 0.77795*height))
        path.addCurve(to: CGPoint(x: 0.97133*width, y: 0.78557*height), control1: CGPoint(x: 1.02944*width, y: 0.79005*height), control2: CGPoint(x: 0.98706*width, y: 0.78603*height))
        path.addCurve(to: CGPoint(x: 0.91972*width, y: 0.78277*height), control1: CGPoint(x: 0.95442*width, y: 0.78439*height), control2: CGPoint(x: 0.93635*width, y: 0.78548*height))
        path.addCurve(to: CGPoint(x: 0.90631*width, y: 0.75852*height), control1: CGPoint(x: 0.9083*width, y: 0.78091*height), control2: CGPoint(x: 0.90281*width, y: 0.7668*height))
        path.addCurve(to: CGPoint(x: 0.91994*width, y: 0.74598*height), control1: CGPoint(x: 0.90981*width, y: 0.75023*height), control2: CGPoint(x: 0.9084*width, y: 0.74635*height))
        path.closeSubpath()

        return path
    }
}

// MARK: - Speaking Features (open O-mouth + open eyes)
struct SpeakingFeaturesShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.size.width
        let height = rect.size.height

        // Left eye (same as neutral)
        path.move(to: CGPoint(x: 0.83618*width, y: 0.55925*height))
        path.addCurve(to: CGPoint(x: 0.88246*width, y: 0.67547*height), control1: CGPoint(x: 0.89934*width, y: 0.55391*height), control2: CGPoint(x: 0.90952*width, y: 0.64402*height))
        path.addCurve(to: CGPoint(x: 0.84569*width, y: 0.69785*height), control1: CGPoint(x: 0.87103*width, y: 0.68877*height), control2: CGPoint(x: 0.86536*width, y: 0.69378*height))
        path.addCurve(to: CGPoint(x: 0.79958*width, y: 0.58006*height), control1: CGPoint(x: 0.78051*width, y: 0.70058*height), control2: CGPoint(x: 0.77282*width, y: 0.61334*height))
        path.addCurve(to: CGPoint(x: 0.83618*width, y: 0.55925*height), control1: CGPoint(x: 0.80936*width, y: 0.5679*height), control2: CGPoint(x: 0.81901*width, y: 0.56248*height))
        path.closeSubpath()

        // Right eye (same as neutral)
        path.move(to: CGPoint(x: 1.10327*width, y: 0.55856*height))
        path.addCurve(to: CGPoint(x: 1.13236*width, y: 0.56638*height), control1: CGPoint(x: 1.11474*width, y: 0.55878*height), control2: CGPoint(x: 1.12273*width, y: 0.56057*height))
        path.addCurve(to: CGPoint(x: 1.10974*width, y: 0.69812*height), control1: CGPoint(x: 1.17583*width, y: 0.59263*height), control2: CGPoint(x: 1.17264*width, y: 0.69201*height))
        path.addCurve(to: CGPoint(x: 1.08165*width, y: 0.69045*height), control1: CGPoint(x: 1.09967*width, y: 0.69792*height), control2: CGPoint(x: 1.0899*width, y: 0.69526*height))
        path.addCurve(to: CGPoint(x: 1.10327*width, y: 0.55856*height), control1: CGPoint(x: 1.03478*width, y: 0.66324*height), control2: CGPoint(x: 1.03846*width, y: 0.56781*height))
        path.closeSubpath()

        // OPEN MOUTH (O-shape)
        path.move(to: CGPoint(x: 0.91993*width, y: 0.74594*height))
        path.addCurve(to: CGPoint(x: 1.04093*width, y: 0.77548*height), control1: CGPoint(x: 0.97865*width, y: 0.74594*height), control2: CGPoint(x: 1.03203*width, y: 0.75332*height))
        path.addCurve(to: CGPoint(x: 0.91993*width, y: 0.79025*height), control1: CGPoint(x: 1.02313*width, y: 0.80502*height), control2: CGPoint(x: 0.96975*width, y: 0.79764*height))
        path.addCurve(to: CGPoint(x: 0.91993*width, y: 0.74594*height), control1: CGPoint(x: 0.87011*width, y: 0.78287*height), control2: CGPoint(x: 0.90569*width, y: 0.74594*height))
        path.closeSubpath()

        return path
    }
}

// MARK: - Winking Features (left eye wink + open right eye + open mouth)
struct WinkingFeaturesShape: Shape {
    var eyeWinkAmount: CGFloat = 0 // 0 = open, 1 = closed

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.size.width
        let height = rect.size.height

        // LEFT EYE - WINKING (interpolate between open and closed)
        let leftEyeOpenY1 = 0.55925*height
        let leftEyeClosedY = 0.62038*height
        let leftEyeAnimY = leftEyeOpenY1 + (leftEyeClosedY - leftEyeOpenY1) * eyeWinkAmount

        if eyeWinkAmount < 0.5 {
            // Eye opening/closing with curve
            path.move(to: CGPoint(x: 0.83618*width, y: leftEyeAnimY))
            path.addCurve(to: CGPoint(x: 0.88246*width, y: 0.67547*height - (0.11622*height * eyeWinkAmount * 2)),
                          control1: CGPoint(x: 0.89934*width, y: 0.55391*height),
                          control2: CGPoint(x: 0.90952*width, y: 0.64402*height))
            path.addCurve(to: CGPoint(x: 0.84569*width, y: 0.69785*height - (0.11779*height * eyeWinkAmount * 2)),
                          control1: CGPoint(x: 0.87103*width, y: 0.68877*height),
                          control2: CGPoint(x: 0.86536*width, y: 0.69378*height))
            path.addCurve(to: CGPoint(x: 0.79958*width, y: 0.58006*height - (0.02779*height * eyeWinkAmount * 2)),
                          control1: CGPoint(x: 0.78051*width, y: 0.70058*height),
                          control2: CGPoint(x: 0.77282*width, y: 0.61334*height))
            path.addCurve(to: CGPoint(x: 0.83618*width, y: leftEyeAnimY),
                          control1: CGPoint(x: 0.80936*width, y: 0.5679*height),
                          control2: CGPoint(x: 0.81901*width, y: 0.56248*height))
        } else {
            // Closed eye (wink line)
            path.move(to: CGPoint(x: 0.8363*width, y: 0.62038*height))
            path.addQuadCurve(to: CGPoint(x: 0.87189*width, y: 0.62038*height),
                              control: CGPoint(x: 0.85409*width, y: 0.613*height))
            path.addQuadCurve(to: CGPoint(x: 0.8363*width, y: 0.62038*height),
                              control: CGPoint(x: 0.85409*width, y: 0.63516*height))
        }
        path.closeSubpath()

        // RIGHT EYE (open - always)
        path.move(to: CGPoint(x: 1.10327*width, y: 0.55856*height))
        path.addCurve(to: CGPoint(x: 1.13236*width, y: 0.56638*height), control1: CGPoint(x: 1.11474*width, y: 0.55878*height), control2: CGPoint(x: 1.12273*width, y: 0.56057*height))
        path.addCurve(to: CGPoint(x: 1.10974*width, y: 0.69812*height), control1: CGPoint(x: 1.17583*width, y: 0.59263*height), control2: CGPoint(x: 1.17264*width, y: 0.69201*height))
        path.addCurve(to: CGPoint(x: 1.08165*width, y: 0.69045*height), control1: CGPoint(x: 1.09967*width, y: 0.69792*height), control2: CGPoint(x: 1.0899*width, y: 0.69526*height))
        path.addCurve(to: CGPoint(x: 1.10327*width, y: 0.55856*height), control1: CGPoint(x: 1.03478*width, y: 0.66324*height), control2: CGPoint(x: 1.03846*width, y: 0.56781*height))
        path.closeSubpath()

        // OPEN MOUTH
        path.move(to: CGPoint(x: 0.88968*width, y: 0.73855*height))
        path.addCurve(to: CGPoint(x: 1.03203*width, y: 0.73855*height), control1: CGPoint(x: 0.92527*width, y: 0.73117*height), control2: CGPoint(x: 0.99644*width, y: 0.73117*height))
        path.addCurve(to: CGPoint(x: 0.96085*width, y: 0.80502*height), control1: CGPoint(x: 1.05872*width, y: 0.78287*height), control2: CGPoint(x: 0.99644*width, y: 0.81241*height))
        path.addCurve(to: CGPoint(x: 0.88968*width, y: 0.73855*height), control1: CGPoint(x: 0.92527*width, y: 0.79764*height), control2: CGPoint(x: 0.89858*width, y: 0.78287*height))
        path.closeSubpath()

        return path
    }
}

#Preview {
    VStack(spacing: 32) {
        HStack(spacing: 16) {
            VStack(alignment: .center, spacing: 4) {
                Text("Neutral")
                    .font(.caption)
                OnboardingMascot(expression: .neutral, size: .medium, animate: true)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Speaking")
                    .font(.caption)
                OnboardingMascot(expression: .speaking, size: .medium, speaking: true, animate: true)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Winking")
                    .font(.caption)
                OnboardingMascot(expression: .winking, size: .medium, animate: true)
            }
        }

        HStack(spacing: 16) {
            VStack(alignment: .center, spacing: 4) {
                Text("Encouraging")
                    .font(.caption)
                OnboardingMascot(expression: .encouraging, size: .medium, animate: true)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Proud")
                    .font(.caption)
                OnboardingMascot(expression: .proud, size: .medium, animate: true)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Listening")
                    .font(.caption)
                OnboardingMascot(expression: .listening, size: .medium, animate: true)
            }
        }
    }
    .padding()
    .background(AppTheme.blackAbsolute)
}
