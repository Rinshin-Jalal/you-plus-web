import SwiftUI

/// Matches web behavior: sequential typewriter lines, centered UI, no mascot
struct CommentarySection: View {
    let lines: [String]
    let onNext: () -> Void
    let showMascot: Bool

    @State private var currentLineIndex: Int = 0
    @State private var completedLines: Set<Int> = []
    @State private var isTyping: Bool = true
    @State private var hasCalledNext: Bool = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Commentary lines - centered container, left-aligned text
            VStack(alignment: .leading, spacing: 20) {
                ForEach(Array(lines.enumerated()), id: \.offset) { index, line in
                    // Only show lines up to current index
                    if index <= currentLineIndex {
                        let isCompleted = completedLines.contains(index)
                        let isCurrent = index == currentLineIndex

                        if isCompleted {
                            // Completed line - dimmed static text
                            Text(line)
                                .font(AppTheme.Fonts.mono(20))
                                .foregroundColor(.white.opacity(0.5))
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .transition(.opacity)
                                .animation(.easeInOut(duration: 0.3), value: isCompleted)
                        } else if isCurrent {
                            // Current line - typewriter
                            TypewriterText(
                                line,
                                font: AppTheme.Fonts.mono(20),
                                speed: 0.08
                            ) {
                                handleLineComplete()
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .transition(.opacity)
                            .animation(.easeInOut(duration: 0.3), value: isCurrent)
                        }
                    }
                }
            }
            .frame(maxWidth: 600)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.horizontal, 32)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .onAppear {
            // Reset state
            currentLineIndex = 0
            completedLines = []
            isTyping = true
            hasCalledNext = false
        }
    }

    private func handleLineComplete() {
        isTyping = false
        completedLines.insert(currentLineIndex)

        if currentLineIndex < lines.count - 1 {
            // More lines to show - wait then advance
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                currentLineIndex += 1
                isTyping = true
            }
        } else {
            // All lines complete - wait then go to next step
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                if !hasCalledNext {
                    hasCalledNext = true
                    onNext()
                }
            }
        }
    }
}

#Preview {
    CommentarySection(
        lines: [
            "Hey.",
            "It's me.",
            "You.",
            "From the future."
        ],
        onNext: { print("Next tapped") },
        showMascot: true
    )
    .background(AppTheme.blackAbsolute)
}
