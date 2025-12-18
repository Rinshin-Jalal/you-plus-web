import AVFoundation
import Combine

@MainActor
class AudioRecorderService: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var recordedAudioData: Data?
    @Published var errorMessage: String?
    @Published var recordingDuration: TimeInterval = 0
    
    static var shared: AudioRecorderService?
    
    private var audioRecorder: AVAudioRecorder?
    private var audioPlayer: AVAudioPlayer?
    private var displayLink: CADisplayLink?
    private var recordingStartTime: Date?
    
    let audioEngine = AVAudioEngine()
    private var timeDomainData: [UInt8] = Array(repeating: 128, count: 1024)  // FFT 2048 / 2 = 1024 bins
    
    override init() {
        super.init()
        setupAudioSession()
        AudioRecorderService.shared = self
        setupAudioEngine()
    }
    
    private func setupAudioEngine() {
        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        
        // Install tap to get real-time audio data
        inputNode.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, _ in
            self?.processAudioBuffer(buffer)
        }
        
        do {
            try audioEngine.start()
        } catch {
            errorMessage = "Failed to start audio engine: \(error.localizedDescription)"
        }
    }
    
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData else { return }
        let frameLength = Int(buffer.frameLength)
        let samples = channelData[0]
        
        // EXACT WEB ALGORITHM: getByteTimeDomainData
        // Downsample from audio buffer to 1024 bins (matching analyser.frequencyBinCount)
        let stride = max(1, frameLength / timeDomainData.count)
        for i in 0..<timeDomainData.count {
            let sampleIndex = min(i * stride, frameLength - 1)
            // Convert float sample to byte: (float + 1) / 2 * 255 to get 0-255
            let floatValue = samples[sampleIndex]
            let byteValue = Float((floatValue + 1.0) / 2.0 * 255.0)
            
            // Clamp to 0-255
            let clamped = UInt8(max(0, min(255, byteValue)))
            
            // NO smoothing - direct update like web's requestAnimationFrame
            timeDomainData[i] = clamped
        }
    }
    
    func getTimeDomainData() -> [UInt8] {
        timeDomainData
    }
    
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .default, options: [.duckOthers])
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            errorMessage = "Failed to setup audio: \(error.localizedDescription)"
        }
    }
    
    func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
        AVAudioApplication.requestRecordPermission { [weak self] granted in
            Task { @MainActor in
                if !granted {
                    self?.errorMessage = "Microphone permission denied. Enable in Settings."
                }
                completion(granted)
            }
        }
    }
    
    func startRecording() {
        // Create temp file URL
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("recording_\(UUID().uuidString)")
            .appendingPathExtension("m4a")
        
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            let recorder = try AVAudioRecorder(url: tempURL, settings: settings)
            recorder.delegate = self
            recorder.record()
            self.audioRecorder = recorder
            self.isRecording = true
            self.recordingStartTime = Date()
            self.recordingDuration = 0
            self.errorMessage = nil
            startDisplayLink()
        } catch {
            errorMessage = "Failed to start recording: \(error.localizedDescription)"
        }
    }
    
    func stopRecording() {
        stopDisplayLink()
        audioRecorder?.stop()
        isRecording = false
        
        // Load recorded audio into data
        if let url = audioRecorder?.url {
            do {
                recordedAudioData = try Data(contentsOf: url)
                try FileManager.default.removeItem(at: url)
            } catch {
                errorMessage = "Failed to load recording: \(error.localizedDescription)"
            }
        }
    }
    
    func playRecording() {
        guard let data = recordedAudioData else {
            errorMessage = "No recording to play"
            return
        }
        
        do {
            let player = try AVAudioPlayer(data: data, fileTypeHint: AVFileType.m4a.rawValue)
            player.delegate = self
            player.play()
            self.audioPlayer = player
        } catch {
            errorMessage = "Failed to play recording: \(error.localizedDescription)"
        }
    }
    
    func stopPlayback() {
        audioPlayer?.stop()
        audioPlayer = nil
    }
    
    func getBase64String() -> String? {
        recordedAudioData?.base64EncodedString()
    }
    
    func clearRecording() {
        recordedAudioData = nil
        recordingDuration = 0
        errorMessage = nil
        audioRecorder = nil
        audioPlayer = nil
    }
    
    private func startDisplayLink() {
        let displayLink = CADisplayLink(
            target: self,
            selector: #selector(updateRecordingDuration)
        )
        displayLink.add(to: .main, forMode: .common)
        self.displayLink = displayLink
    }
    
    private func stopDisplayLink() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    @objc
    private func updateRecordingDuration() {
        guard let startTime = recordingStartTime else { return }
        recordingDuration = Date().timeIntervalSince(startTime)
    }
}

// MARK: - AVAudioRecorderDelegate
extension AudioRecorderService: AVAudioRecorderDelegate {
    nonisolated func audioRecorderDidFinishRecording(
        _ recorder: AVAudioRecorder,
        successfully flag: Bool
    ) {
        Task { @MainActor in
            if !flag {
                self.errorMessage = "Recording failed"
            }
        }
    }
    
    nonisolated func audioRecorderEncodeErrorDidOccur(
        _ recorder: AVAudioRecorder,
        error: Error?
    ) {
        Task { @MainActor in
            self.errorMessage = "Recording error: \(error?.localizedDescription ?? "Unknown")"
        }
    }
}

// MARK: - AVAudioPlayerDelegate
extension AudioRecorderService: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(
        _ player: AVAudioPlayer,
        successfully flag: Bool
    ) {
        Task { @MainActor in
            if !flag {
                self.errorMessage = "Playback failed"
            }
        }
    }
}
