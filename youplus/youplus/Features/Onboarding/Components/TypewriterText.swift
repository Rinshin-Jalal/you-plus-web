import SwiftUI
import Combine

struct TypewriterText: View {
    let text: String
    let font: Font
    var speed: TimeInterval = 0.03
    var onComplete: (() -> Void)? = nil
    
    @State private var displayedText: String = ""
    @State private var cancellable: AnyCancellable?
    
    init(_ text: String, font: Font = AppTheme.Fonts.mono(16), speed: TimeInterval = 0.03, onComplete: (() -> Void)? = nil) {
        self.text = text
        self.font = font
        self.speed = speed
        self.onComplete = onComplete
    }
    
    var body: some View {
        Text(displayedText)
            .font(font)
            .foregroundColor(AppTheme.text)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
            .onAppear {
                animateText()
            }
            .onChange(of: text) { _, newValue in
                displayedText = "" // Reset for new text
                animateText()
            }
    }
    
    private func animateText() {
        // Cancel existing timer
        cancellable?.cancel()
        displayedText = ""
        
        // If text is empty, we're done immediately
        guard !text.isEmpty else {
            onComplete?()
            return
        }
        
        let characters = Array(text)
        var currentIndex = 0
        
        cancellable = Timer.publish(every: speed, on: .main, in: .common)
            .autoconnect()
            .sink { _ in
                if currentIndex < characters.count {
                    displayedText.append(characters[currentIndex])
                    currentIndex += 1
                } else {
                    cancellable?.cancel()
                    onComplete?()
                }
            }
    }
}
