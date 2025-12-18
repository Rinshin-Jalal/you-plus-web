import SwiftUI

struct AtmosphereView: View {
    var imageName: String? = "AtmosphereBackground"
    var blurRadius: CGFloat = 40
    var opacity: Double = 0.3

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // 1. Absolute Black Base
                AppTheme.blackAbsolute.ignoresSafeArea()

                // 2. The Image (Static, Deep, Anchored)
                if let imageName = imageName, !imageName.isEmpty {
                    Image(imageName)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                        .blur(radius: blurRadius)
                        .opacity(opacity)
                }

                // 3. Paper-like Grain Overlay
                Canvas { context, size in
                    // Subtle paper texture - very fine grain
                    let width = Int(size.width)
                    let height = Int(size.height)

                    // Draw fine grain pattern (like paper texture)
                    for _ in 0..<2000 {
                        let x = Double.random(in: 0...size.width)
                        let y = Double.random(in: 0...size.height)
                        let randomOpacity = Double.random(in: 0.03...0.08)
                        let rect = CGRect(x: x, y: y, width: 0.5, height: 0.5)
                        context.fill(Path(rect), with: .color(.white.opacity(randomOpacity)))
                    }
                }
                .allowsHitTesting(false)
                .blendMode(.overlay)
            }
        }
        .ignoresSafeArea()
    }
}
