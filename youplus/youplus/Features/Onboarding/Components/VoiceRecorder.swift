import SwiftUI

struct VoiceRecorder: View {
    @ObservedObject var recorder: AudioRecorderService
    var onComplete: () -> Void

    @State private var timeDomainData: [UInt8] = Array(repeating: 128, count: 1024)
    @State private var displayLink: CADisplayLink?

    private let minDuration: TimeInterval = 15

    var canStop: Bool {
        recorder.recordingDuration >= minDuration
    }

    var timeRemaining: Int {
        max(0, Int(minDuration - recorder.recordingDuration))
    }
    
    var progress: CGFloat {
        min(CGFloat(recorder.recordingDuration / minDuration), 1.0)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Waveform box - taller and wider
            VStack(spacing: 8) {
                // Time indicator - Minimal but focused
                Text(formatDuration(recorder.recordingDuration))
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundColor(.white.opacity(0.9))

                ZStack {
                    Color(red: 0.04, green: 0.04, blue: 0.04)

                    // Progress background fill (brighter, lower opacity)
                    if recorder.isRecording {
                        GeometryReader { geo in
                            HStack(spacing: 0) {
                                AppTheme.blackSoft
                                    .frame(width: geo.size.width * progress)
                                Color.clear
                            }
                        }
                    }

                    VStack(spacing: 0) {
                        Spacer()

                        // Real waveform visualization - exact web algorithm
                        WaveformView(
                            timeDomainData: timeDomainData,
                            progress: progress,
                            canStop: canStop,
                            isRecording: recorder.isRecording
                        )
                        .frame(height: 140)
                        .padding(.horizontal, 8)

                        Spacer()
                    }
                }
                .frame(height: 220)
                .border(Color.white.opacity(0.2), width: 1)
            }
            .padding(.vertical, 20)

            Spacer()
                .frame(minHeight: 0)

            // Bottom section - Button and Info text
            VStack(spacing: 20) {
                // Web-style button: 2px border, scale effects, state-based styling
                Button(action: {
                    if recorder.isRecording {
                        if canStop {
                            recorder.stopRecording()
                            displayLink?.invalidate()
                            displayLink = nil
                            // Auto-save and move to next step
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                onComplete()
                            }
                        }
                    } else {
                        recorder.requestMicrophonePermission { granted in
                            if granted {
                                recorder.startRecording()
                                setupDisplayLink()
                            }
                        }
                    }
                }) {
                    ZStack {
                        // Border background
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(
                                (recorder.isRecording && !canStop)
                                    ? Color.gray.opacity(0.5)
                                    : (recorder.isRecording
                                        ? (canStop ? Color.green : Color(red: 0.98, green: 0.57, blue: 0.09))
                                        : Color.white.opacity(0.3)),
                                lineWidth: 2
                            )
                            .background(
                                (recorder.isRecording && !canStop)
                                    ? Color.gray.opacity(0.2)
                                    : (recorder.isRecording && canStop
                                        ? Color.green
                                        : Color.clear)
                            )
                        
                        // Icon
                        if recorder.isRecording {
                            // Stop icon (square) when recording
                            Image(systemName: "square.fill")
                                .font(.system(size: 36, weight: .semibold))
                                .foregroundColor(
                                    (recorder.isRecording && !canStop)
                                        ? Color.gray
                                        : (canStop ? Color.black : Color(red: 0.98, green: 0.57, blue: 0.09))
                                )
                        } else {
                            // Mic icon (outline) when idle
                            Image(systemName: "mic")
                                .font(.system(size: 40, weight: .semibold))
                                .foregroundColor(Color.white.opacity(0.7))
                        }
                    }
                    .frame(width: 120, height: 120)
                    .scaleEffect(
                        (recorder.isRecording && !canStop)
                            ? 1.0
                            : (recorder.isRecording
                                ? (canStop ? 1.1 : 1.05)
                                : 1.0)
                    )
                }
                .disabled(recorder.isRecording && !canStop)
                .animation(.easeInOut(duration: 0.3), value: recorder.isRecording)
                .animation(.easeInOut(duration: 0.3), value: canStop)

                // Info text
                Text("Speak clearly and naturally.")
                    .font(.system(size: 11, weight: .regular, design: .default))
                    .foregroundColor(.white.opacity(0.3))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        return String(format: "%02d:%02d", mins, secs)
    }
    
    private func setupDisplayLink() {
        let displayLink = CADisplayLink(
            target: WaveformUpdater.shared,
            selector: #selector(WaveformUpdater.update)
        )
        displayLink.add(to: .main, forMode: .common)
        self.displayLink = displayLink
        
        WaveformUpdater.shared.onUpdate = { data in
            // Apply smoothing to slow down the amplitude changes
            let smoothingFactor = 0.15 // Lower value = slower/smoother movement
            if self.timeDomainData.count == data.count {
                self.timeDomainData = zip(self.timeDomainData, data).map { old, new in
                    UInt8(Double(old) * (1 - smoothingFactor) + Double(new) * smoothingFactor)
                }
            } else {
                self.timeDomainData = data
            }
        }
    }
}

// Display link updater
class WaveformUpdater {
    static let shared = WaveformUpdater()
    var onUpdate: (([UInt8]) -> Void)?
    
    @objc func update() {
        guard let recorder = AudioRecorderService.shared else { return }
        let data = recorder.getTimeDomainData()
        onUpdate?(data)
    }
}

// Real waveform visualization - EXACT web algorithm
struct WaveformView: View {
    let timeDomainData: [UInt8]
    let progress: CGFloat
    let canStop: Bool
    let isRecording: Bool

    var body: some View {
        Canvas { context, size in
            let width = size.width
            let height = size.height
            
            guard timeDomainData.count > 0 else { return }

            let bufferLength = timeDomainData.count
            let sliceWidth = width / CGFloat(bufferLength)

            // First pass: draw the "completed" portion (orange/green)
            var completedPath = Path()
            let progressX = progress * width
            
            for i in 0..<bufferLength {
                // WEB ALGORITHM - CENTER THE WAVEFORM VERTICALLY
                let v = CGFloat(timeDomainData[i]) / 255.0  // Normalize 0-255 to 0-1 range
                let centerY = height / 2
                let amplification: CGFloat = 5.0  // 5x amplitude height
                let y = centerY - (v - 0.5) * height * amplification  // Amplified: 5x taller spikes
                let currentX = CGFloat(i) * sliceWidth
                
                if currentX <= progressX {
                    if i == 0 || (i > 0 && CGFloat(i - 1) * sliceWidth > progressX) {
                        completedPath.move(to: CGPoint(x: currentX, y: y))
                    } else {
                        // Use cubic Bezier curves for ultra-smooth waveform
                        let prevI = i - 1
                        let prevV = CGFloat(timeDomainData[prevI]) / 255.0
                        let prevY = centerY - (prevV - 0.5) * height * amplification
                        let prevX = CGFloat(prevI) * sliceWidth
                        
                        // Get next point for smoother curve prediction
                        let nextI = min(i + 1, bufferLength - 1)
                        let nextV = CGFloat(timeDomainData[nextI]) / 255.0
                        let nextY = centerY - (nextV - 0.5) * height * amplification
                        let nextX = CGFloat(nextI) * sliceWidth
                        
                        // Create smooth control points using Catmull-Rom-like interpolation
                        let control1X = prevX + (currentX - prevX) * 0.5
                        let control1Y = prevY + (y - prevY) * 0.5
                        let control2X = currentX - (nextX - prevX) * 0.25
                        let control2Y = y - (nextY - prevY) * 0.25
                        
                        completedPath.addCurve(to: CGPoint(x: currentX, y: y), 
                                              control1: CGPoint(x: control1X, y: control1Y),
                                              control2: CGPoint(x: control2X, y: control2Y))
                    }
                }
            }
            
            let completedStrokeStyle = StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round)
            context.stroke(
                completedPath,
                with: .color(canStop ? Color.green : Color(red: 0.98, green: 0.57, blue: 0.09)),
                style: completedStrokeStyle
            )

            // Second pass: draw the "remaining" portion (white)
            var remainingPath = Path()
            var started = false
            
            for i in 0..<bufferLength {
                // WEB ALGORITHM - CENTER THE WAVEFORM VERTICALLY
                let v = CGFloat(timeDomainData[i]) / 255.0  // Normalize 0-255 to 0-1 range
                let centerY = height / 2
                let amplification: CGFloat = 5.0  // 5x amplitude height
                let y = centerY - (v - 0.5) * height * amplification  // Amplified: 5x taller spikes
                let currentX = CGFloat(i) * sliceWidth
                
                if currentX >= progressX {
                    if !started {
                        remainingPath.move(to: CGPoint(x: currentX, y: y))
                        started = true
                    } else {
                        // Use cubic Bezier curves for ultra-smooth waveform
                        let prevI = i - 1
                        let prevV = CGFloat(timeDomainData[prevI]) / 255.0
                        let prevY = centerY - (prevV - 0.5) * height * amplification
                        let prevX = CGFloat(prevI) * sliceWidth
                        
                        // Get next point for smoother curve prediction
                        let nextI = min(i + 1, bufferLength - 1)
                        let nextV = CGFloat(timeDomainData[nextI]) / 255.0
                        let nextY = centerY - (nextV - 0.5) * height * amplification
                        let nextX = CGFloat(nextI) * sliceWidth
                        
                        // Create smooth control points using Catmull-Rom-like interpolation
                        let control1X = prevX + (currentX - prevX) * 0.5
                        let control1Y = prevY + (y - prevY) * 0.5
                        let control2X = currentX - (nextX - prevX) * 0.25
                        let control2Y = y - (nextY - prevY) * 0.25
                        
                        remainingPath.addCurve(to: CGPoint(x: currentX, y: y), 
                                              control1: CGPoint(x: control1X, y: control1Y),
                                              control2: CGPoint(x: control2X, y: control2Y))
                    }
                }
            }
            
            let remainingStrokeStyle = StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round)
            context.stroke(
                remainingPath,
                with: .color(Color.white.opacity(0.3)),
                style: remainingStrokeStyle
            )

            // Draw progress line marker
            if progress < 1.0 {
                var progressLine = Path()
                progressLine.move(to: CGPoint(x: progressX, y: 0))
                progressLine.addLine(to: CGPoint(x: progressX, y: height))
                
                let progressStyle = StrokeStyle(lineWidth: 2, dash: [4, 4])
                context.stroke(
                    progressLine,
                    with: .color(Color(red: 0.98, green: 0.57, blue: 0.09)),
                    style: progressStyle
                )
            }
        }
    }
}

#Preview {
    VoiceRecorder(recorder: AudioRecorderService()) { }
        .padding()
        .background(AppTheme.background)
}
