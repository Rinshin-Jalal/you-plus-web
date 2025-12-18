import SwiftUI
import Combine

struct TypewriterText: View {
    let text: String
    let font: Font
    var speed: TimeInterval = 0.08
    var onComplete: (() -> Void)?

    @State private var displayedText: String = ""
    @State private var cancellable: AnyCancellable?

    init(
        _ text: String,
        font: Font = AppTheme.Fonts.mono(16),
        speed: TimeInterval = 0.08,
        onComplete: (() -> Void)? = nil
    ) {
        self.text = text
        self.font = font
        self.speed = speed
        self.onComplete = onComplete
    }

    var body: some View {
        HStack(spacing: 0) {
            Text(displayedText)
                .font(font)
                .foregroundColor(AppTheme.text)
                .lineLimit(nil)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear {
            animateText()
        }
        .onChange(of: text) { _ in
            displayedText = ""
            animateText()
        }
    }

    private func animateText() {
        cancellable?.cancel()
        displayedText = ""

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
