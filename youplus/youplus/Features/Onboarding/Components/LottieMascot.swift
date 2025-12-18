import SwiftUI
import Lottie

/// Lottie-based mascot with animations
struct LottieMascot: View {
    enum Expression: String {
        case neutral = "mascot-neutral"
        case speaking = "mascot-speaking"
        case listening = "mascot-listening"
        case thinking = "mascot-thinking"
        case encouraging = "mascot-encouraging"
        case proud = "mascot-proud"
        case serious = "mascot-serious"
        case winking = "mascot-winking"

        var animationName: String {
            self.rawValue
        }
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
    var autoPlay: Bool = true
    var loop: Bool = true

    @State private var animationProgress: CGFloat = 0

    var body: some View {
        LottieView(
            animation: .named(expression.animationName),
            autoPlay: autoPlay,
            loop: loop
        )
        .frame(width: size.dimension, height: size.dimension)
    }
}

/// SwiftUI wrapper for Lottie animations
struct LottieView: UIViewRepresentable {
    let animation: LottieAnimation?
    let autoPlay: Bool
    let loop: Bool

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        let animationView = LottieAnimationView(animation: animation)
        animationView.contentMode = .scaleAspectFit
        animationView.loopMode = loop ? .loop : .playOnce
        
        if autoPlay {
            animationView.play()
        }

        animationView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(animationView)

        NSLayoutConstraint.activate([
            animationView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            animationView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            animationView.topAnchor.constraint(equalTo: view.topAnchor),
            animationView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        return view
    }

    func updateUIView(_ view: UIView, context: Context) {
        // Handle updates if needed
    }
}

#Preview {
    VStack(spacing: 32) {
        HStack(spacing: 16) {
            VStack(alignment: .center, spacing: 4) {
                Text("Neutral")
                    .font(.caption)
                LottieMascot(expression: .neutral, size: .medium)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Speaking")
                    .font(.caption)
                LottieMascot(expression: .speaking, size: .medium)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Winking")
                    .font(.caption)
                LottieMascot(expression: .winking, size: .medium)
            }
        }

        HStack(spacing: 16) {
            VStack(alignment: .center, spacing: 4) {
                Text("Encouraging")
                    .font(.caption)
                LottieMascot(expression: .encouraging, size: .medium)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Proud")
                    .font(.caption)
                LottieMascot(expression: .proud, size: .medium)
            }

            VStack(alignment: .center, spacing: 4) {
                Text("Listening")
                    .font(.caption)
                LottieMascot(expression: .listening, size: .medium)
            }
        }
    }
    .padding()
    .background(AppTheme.blackAbsolute)
}

