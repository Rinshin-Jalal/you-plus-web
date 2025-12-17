import SwiftUI

struct GrainOverlay: View {
    var body: some View {
        Canvas { context, size in
            context.fill(
                Path(CGRect(origin: .zero, size: size)),
                with: .color(.black.opacity(0.1))
            )
            
            // Draw random noise points
            let width = Int(size.width)
            let height = Int(size.height)
            let pixelCount = width * height / 2 // Density factor
            
            for _ in 0..<1000 { // Simplified noise for performance in preview
                let x = Double.random(in: 0...size.width)
                let y = Double.random(in: 0...size.height)
                let rect = CGRect(x: x, y: y, width: 1, height: 1)
                context.fill(Path(rect), with: .color(.white.opacity(0.05)))
            }
        }
        .allowsHitTesting(false)
        .ignoresSafeArea()
        .blendMode(.overlay)
    }
}
