import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss
    
    @StateObject private var vm = OnboardingViewModel()
    @StateObject private var audioRecorder = AudioRecorderService()
    @AppStorage("onboarding_completed") private var onboardingCompleted: Bool = false
    
    var onFinished: (() -> Void)? = nil
    
    // Local UI state (kept simple; actual persistence lives in the VM)
    @State private var textInput: String = ""
    @State private var sliderValue: Double = 5
    @State private var timeValue: Date = Date()
    @State private var isTransitioning: Bool = false
    
    var body: some View {
        ZStack {
            // Layer 1-4: Atmosphere (Base, Image, Gradient, Grain)
            AtmosphereView(imageName: "onboarding", blurRadius: 30, opacity: 0.5)
            
            VStack(spacing: 0) {
                header

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        if let step = vm.currentStep {
                            stepView(step)
                                .transition(.asymmetric(
                                    insertion: .move(edge: .trailing).combined(with: .opacity),
                                    removal: .move(edge: .leading).combined(with: .opacity)
                                ))
                                .id(step.id) // Force view recreation on step change
                        } else {
                            Text("Loading...")
                                .font(AppTheme.Fonts.mono(14))
                                .foregroundColor(.white.opacity(0.6))
                                .padding(.top, 48)
                        }
                    }
                    .padding(.horizontal, 20) // Reduced from 24 - more breathing room
                    .padding(.vertical, 32) // More vertical space
                    .frame(minHeight: UIScreen.main.bounds.height * 0.7)
                }
                .scrollIndicators(.hidden) // Clean, no scrollbar clutter
            }
        }
        .navigationBarHidden(true)
        .onChange(of: vm.currentStepIndex) { _, _ in
            // Trigger smooth transition animation when step changes
            withAnimation(.spring(response: 0.45, dampingFraction: 0.88)) { // Slightly snappier
                isTransitioning = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                isTransitioning = false
            }
        }
        .onChange(of: vm.didCompleteOnboarding) { _, didComplete in
            guard didComplete else { return }
            // Mark onboarding as complete (local). Auth/sub happens AFTER this.
            if vm.isOnboardingComplete() {
                onboardingCompleted = true
                onFinished?()
                dismiss()
            }
        }
        .onDisappear {
            audioRecorder.stopRecording()
            audioRecorder.stopPlayback()
        }
    }
    
    private var header: some View {
        HStack(spacing: 16) {
            Button(action: {
                vm.previousStep()
            }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(vm.currentStepIndex == 0 ? AppTheme.whiteMuted.opacity(0.3) : AppTheme.whiteMuted)
            }
            .disabled(vm.currentStepIndex == 0)

            ActHeader(currentStep: vm.currentStepIndex + 1, totalSteps: max(vm.steps.count, 1))

            Button(action: {
                dismiss()
            }) {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(AppTheme.whiteMuted.opacity(0.4))
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
    }

    @ViewBuilder
    private func stepView(_ step: OnboardingStep) -> some View {
        switch step.type {
        case .commentary:
            commentaryStep(step)
        case .choice:
            choiceStep(step)
        case .input:
            inputStep(step)
        case .slider:
            sliderStep(step)
        case .time:
            timeStep(step)
        case .pillarSelection:
            pillarSelectionStep(step)
        case .pillarPrimary:
            pillarPrimaryStep(step)
        case .voice:
            voiceStep(step)
        case .voicePreference:
            voicePreferenceStep(step)
        case .voiceSelection:
            voiceSelectionStep(step)
        case .card:
            CommitmentCardView(
                data: vm.answers,
                onAccept: {
                    vm.nextStep()
                }
            )
        case .pillarQuestions:
            PillarQuestionsView(
                selectedPillars: vm.stringArrayAnswer("selected_pillars"),
                onSave: { key, val in
                    vm.saveAnswer(for: key, value: val)
                },
                onFinish: {
                    vm.nextStep()
                }
            )
        default:
            VStack(alignment: .leading, spacing: 16) {
                Text("Not implemented: \(step.type.rawValue)")
                    .font(AppTheme.Fonts.mono(14))
                    .foregroundColor(.white.opacity(0.6))
                BrutalButton(title: "Skip", style: .secondary) {
                    vm.nextStep()
                }
            }
        }
    }
    
    // MARK: - Step UIs
    
    private func commentaryStep(_ step: OnboardingStep) -> some View {
        let lines = vm.commentaryLines(for: step)
        return CommentarySection(
            lines: lines,
            onNext: { vm.nextStep() },
            showMascot: true
        )
    }
    
    private func choiceStep(_ step: OnboardingStep) -> some View {
        let field = fieldName(for: step)
        let selected = vm.stringAnswer(field)
        
        return VStack(alignment: .leading, spacing: 18) {
            if let label = step.label {
                Text(label)
                    .font(AppTheme.Fonts.heavy(28))
                    .foregroundColor(.white)
            }
            
            VStack(spacing: 12) {
                ForEach(step.choices ?? [], id: \.self) { choice in
                    BrutalChoice(title: choice, selected: selected == choice) {
                        vm.saveAnswer(for: step.id, value: choice)
                        vm.nextStep()
                    }
                }
            }
        }
        .padding(.top, 16)
    }
    
    private func inputStep(_ step: OnboardingStep) -> some View {
        let field = fieldName(for: step)
        let current = vm.stringAnswer(field)
        
        return VStack(alignment: .leading, spacing: 18) {
            MegaInput(
                title: step.label ?? "Input",
                placeholder: step.placeholder ?? "",
                text: Binding(
                    get: { textInput.isEmpty ? current : textInput },
                    set: { textInput = $0 }
                )
            )
            
            BrutalButton(title: "Continue", style: .primary) {
                let val = textInput.isEmpty ? current : textInput
                vm.saveAnswer(for: step.id, value: val)
                textInput = ""
                vm.nextStep()
            }
            .disabled((textInput.isEmpty ? current : textInput).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(.top, 16)
    }
    
    private func sliderStep(_ step: OnboardingStep) -> some View {
        let field = fieldName(for: step)
        let minV = step.min ?? 1
        let maxV = step.max ?? 10
        let existing = Double(vm.intAnswer(field) ?? Int((minV + maxV) / 2))
        
        return VStack(alignment: .leading, spacing: 18) {
            Text(step.label ?? "Adjust")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            Text("\(Int(sliderValue))")
                .font(AppTheme.Fonts.heavy(48))
                .foregroundColor(AppTheme.accent)
            
            Slider(
                value: Binding(
                    get: { sliderValue == 5 ? existing : sliderValue },
                    set: { sliderValue = $0 }
                ),
                in: minV...maxV,
                step: 1
            )
            .tint(AppTheme.accent)
            
            HStack {
                Text("\(Int(minV))").font(AppTheme.Fonts.mono(12)).foregroundColor(.white.opacity(0.4))
                Spacer()
                Text("\(Int(maxV))").font(AppTheme.Fonts.mono(12)).foregroundColor(.white.opacity(0.4))
            }
            
            BrutalButton(title: "Continue", style: .primary) {
                let val = Int(sliderValue == 5 ? existing : sliderValue)
                vm.saveAnswer(for: step.id, value: val)
                sliderValue = 5
                vm.nextStep()
            }
        }
        .padding(.top, 16)
    }
    
    private func timeStep(_ step: OnboardingStep) -> some View {
        let field = fieldName(for: step)
        let existing = vm.stringAnswer(field)
        let initial = parseHHmm(existing) ?? timeValue
        
        return VStack(alignment: .leading, spacing: 18) {
            Text(step.label ?? "Pick a time")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            DatePicker(
                "",
                selection: Binding(
                    get: { timeValue == initial ? initial : timeValue },
                    set: { timeValue = $0 }
                ),
                displayedComponents: .hourAndMinute
            )
            .datePickerStyle(.wheel)
            .labelsHidden()
            .colorScheme(.dark)
            
            BrutalButton(title: "Set Time", style: .primary) {
                let d = timeValue == initial ? initial : timeValue
                vm.saveAnswer(for: step.id, value: formatHHmm(d))
                vm.nextStep()
            }
        }
        .padding(.top, 16)
    }
    
    private func pillarSelectionStep(_ step: OnboardingStep) -> some View {
        return PillarSelectionStep(
            selected: vm.stringArrayAnswer("selected_pillars"),
            onSelect: { pillars in
                vm.saveAnswer(for: step.id, value: pillars)
            },
            onContinue: {
                vm.nextStep()
            }
        )
        .padding(.top, 8)
    }
    
    private func pillarPrimaryStep(_ step: OnboardingStep) -> some View {
        let selected = vm.stringArrayAnswer("selected_pillars")
        return PillarPrimaryStep(selectedPillars: selected) { primary in
            vm.saveAnswer(for: step.id, value: primary)
            vm.nextStep()
        }
        .padding(.top, 8)
    }
    
    private func voiceStep(_ step: OnboardingStep) -> some View {
        let fieldName = fieldNameForStep(step)
        
        return VStack(alignment: .leading, spacing: 18) {
            Text(step.label ?? "Record")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            if let sub = step.subtext {
                Text(sub)
                    .font(AppTheme.Fonts.body(16))
                    .foregroundColor(.white.opacity(0.6))
            }
            
            VoiceRecorder(recorder: audioRecorder) {
                vm.saveAnswer(for: step.id, value: audioRecorder.getBase64String() ?? "")
                vm.nextStep()
            }
        }
        .padding(.top, 16)
    }
    
    private func fieldNameForStep(_ step: OnboardingStep) -> String {
        switch step.id {
        case "22":
            return "why_recording"
        case "28":
            return "pledge_recording"
        default:
            return "future_self_intro_recording"
        }
    }
    
    private func voicePreferenceStep(_ step: OnboardingStep) -> some View {
        return VStack(alignment: .leading, spacing: 18) {
            Text(step.label ?? "Voice")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            if let sub = step.subtext {
                Text(sub)
                    .font(AppTheme.Fonts.body(16))
                    .foregroundColor(.white.opacity(0.6))
            }
            
            VStack(spacing: 12) {
                BrutalChoice(title: "Use My Voice", selected: vm.stringAnswer("voice_preference") == "clone") {
                    vm.saveAnswer(for: step.id, value: "clone")
                    vm.nextStep()
                }
                BrutalChoice(title: "Choose a Voice", selected: vm.stringAnswer("voice_preference") == "preset") {
                    vm.saveAnswer(for: step.id, value: "preset")
                    vm.nextStep()
                }
            }
        }
        .padding(.top, 16)
    }
    
    private func voiceSelectionStep(_ step: OnboardingStep) -> some View {
        let selectedId = vm.stringAnswer("preset_voice_id")

        return VStack(alignment: .leading, spacing: 20) {
            Text(step.label ?? "Select a voice")
                .font(AppTheme.Fonts.headline(28))
                .foregroundColor(AppTheme.whiteSoft)

            if let sub = step.subtext {
                Text(sub)
                    .font(AppTheme.Fonts.body(15))
                    .foregroundColor(AppTheme.whiteMuted)
            }

            VStack(spacing: 12) {
                ForEach(PresetVoice.all, id: \.id) { voice in
                    BrutalChoice(
                        title: "\(voice.name) — \(voice.vibe)",
                        selected: selectedId == voice.id
                    ) {
                        vm.saveAnswer(for: step.id, value: voice.id)
                    }
                }
            }

            BrutalButton(title: "Continue", style: .primary) {
                vm.nextStep()
            }
            .disabled(selectedId.isEmpty)
        }
        .padding(.top, 16)
    }
    
    private func commitmentCardStep(_ step: OnboardingStep) -> some View {
        let name = vm.stringAnswer("name")
        let pillars = vm.stringArrayAnswer("selected_pillars")
        let primary = vm.stringAnswer("primary_pillar")
        
        return VStack(alignment: .leading, spacing: 18) {
            Text(step.label ?? "Commitment")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 10) {
                Text(name.isEmpty ? "You’re here." : "\(name), you’re here.")
                    .font(AppTheme.Fonts.body(18))
                    .foregroundColor(.white.opacity(0.85))
                
                Text("Pillars: \(pillars.map { $0.replacingOccurrences(of: "_", with: " ") }.joined(separator: ", "))")
                    .font(AppTheme.Fonts.mono(12))
                    .foregroundColor(.white.opacity(0.5))
                
                if !primary.isEmpty {
                    Text("Primary: \(primary.replacingOccurrences(of: "_", with: " "))")
                        .font(AppTheme.Fonts.mono(12))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
            .padding(20)
            .background(Color.white.opacity(0.05))
            .overlay(Rectangle().stroke(Color.white.opacity(0.12), lineWidth: 1))
            
            BrutalButton(title: "I Accept", style: .primary) {
                vm.nextStep()
            }
        }
        .padding(.top, 16)
    }
    
    // MARK: - Helpers
    
    private func fieldName(for step: OnboardingStep) -> String {
        // VM uses its own mapping by passing step.id, but for read-only we mirror it here:
        // The keys in VM.answers are already field names for base steps.
        // For safety, use VM.getFieldName via saving mechanism; for reads, just check known keys.
        switch step.id {
        case "2": return "change_attempts"
        case "4": return "name"
        case "5": return "age"
        case "6": return "gender"
        case "8": return "selected_pillars"
        case "9": return "primary_pillar"
        case "11": return "failure_pattern"
        case "12": return "previous_attempts"
        case "13": return "quit_pattern"
        case "14": return "favorite_excuse"
        case "16": return "who_disappointed"
        case "17": return "primary_fear"
        case "18": return "hidden_fear"
        case "19": return "dark_future"
        case "20": return "core_identity"
        case "22": return "why_recording"
        case "23": return "call_time"
        case "24": return "allow_interruptions"
        case "25": return "strikes_allowed"
        case "26": return "belief_score"
        case "28": return "pledge_recording"
        case "29": return "voice_preference"
        case "30": return "preset_voice_id"
        default:
            return step.id
        }
    }
    
    private func formatHHmm(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
    
    private func parseHHmm(_ value: String) -> Date? {
        guard !value.isEmpty else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.date(from: value)
    }
}

// MARK: - Pillar Selection (iOS)

private struct PillarSelectionStep: View {
    @State private var selected: [String]
    @State private var activeCategory: PillarCategory? = nil
    @State private var showCustomInput: Bool = false
    @State private var customText: String = ""
    
    let onSelect: ([String]) -> Void
    let onContinue: () -> Void
    
    init(selected: [String], onSelect: @escaping ([String]) -> Void, onContinue: @escaping () -> Void) {
        _selected = State(initialValue: selected)
        self.onSelect = onSelect
        self.onContinue = onContinue
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(alignment: .leading, spacing: 6) {
                Text("What are you fixing?")
                    .font(AppTheme.Fonts.heavy(28))
                    .foregroundColor(.white)
                Text("Pick \(PillarPreset.minPillars)-\(PillarPreset.maxPillars) areas. Be honest.")
                    .font(AppTheme.Fonts.mono(12))
                    .foregroundColor(.white.opacity(0.4))
            }
            
            // Category tabs
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    tab(title: "All", isActive: activeCategory == nil) { activeCategory = nil }
                    ForEach(PillarCategory.allCases, id: \.self) { category in
                        tab(title: "\(category.icon) \(category.title)", isActive: activeCategory == category) {
                            activeCategory = category
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            
            // Pillars list
            let display = pillarsToDisplay()
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(display, id: \.id) { pillar in
                    PillarTile(
                        pillar: pillar,
                        selected: selected.contains(pillar.id),
                        disabled: !selected.contains(pillar.id) && selected.count >= PillarPreset.maxPillars
                    ) {
                        toggle(pillar.id)
                    }
                }
                
                // Custom pillar (only in "All")
                if activeCategory == nil {
                    if showCustomInput {
                        customInputTile
                    } else {
                        PillarTile(
                            pillar: PillarPreset.createCustomPillar(id: "custom_custom"),
                            selected: false,
                            disabled: selected.count >= PillarPreset.maxPillars,
                            isCustomAdd: true
                        ) {
                            showCustomInput = true
                        }
                    }
                }
            }
            
            if !selected.isEmpty {
                Text("Selected: \(selected.count)")
                    .font(AppTheme.Fonts.mono(12))
                    .foregroundColor(.white.opacity(0.4))
            }
            
            BrutalButton(
                title: selected.count >= PillarPreset.minPillars
                    ? "Lock in \(selected.count) \(selected.count == 1 ? "pillar" : "pillars")"
                    : "Pick at least \(PillarPreset.minPillars)",
                style: .primary
            ) {
                onSelect(selected)
                onContinue()
            }
            .disabled(selected.count < PillarPreset.minPillars)
        }
    }
    
    private func pillarsToDisplay() -> [PillarPreset] {
        if let category = activeCategory {
            return PillarPreset.all.filter { $0.category == category }
        }
        return PillarPreset.all
    }
    
    private func toggle(_ id: String) {
        if let idx = selected.firstIndex(of: id) {
            selected.remove(at: idx)
        } else if selected.count < PillarPreset.maxPillars {
            selected.append(id)
        }
        onSelect(selected)
    }
    
    private func tab(title: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(AppTheme.Fonts.mono(10))
                .tracking(1.5)
                .foregroundColor(isActive ? .black : .white.opacity(0.6))
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(isActive ? AppTheme.accent : Color.white.opacity(0.08))
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var customInputTile: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Custom")
                .font(AppTheme.Fonts.mono(12))
                .foregroundColor(.white.opacity(0.6))
            
            TextField("e.g., Quitting Weed", text: $customText)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .font(AppTheme.Fonts.body(14))
                .foregroundColor(.white)
                .padding(.vertical, 8)
                .overlay(Rectangle().fill(Color.white.opacity(0.2)).frame(height: 1), alignment: .bottom)
            
            HStack(spacing: 10) {
                BrutalButton(title: "Add", style: .primary) {
                    let trimmed = customText.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty else { return }
                    let slug = trimmed.lowercased().replacingOccurrences(of: "\\s+", with: "_", options: .regularExpression)
                    toggle("custom_\(slug)")
                    customText = ""
                    showCustomInput = false
                }
                .disabled(customText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                
                BrutalButton(title: "Cancel", style: .secondary) {
                    customText = ""
                    showCustomInput = false
                }
            }
        }
        .padding(16)
        .background(Color.white.opacity(0.05))
        .overlay(Rectangle().stroke(AppTheme.accent.opacity(0.6), lineWidth: 2))
    }
}

private struct PillarTile: View {
    let pillar: PillarPreset
    let selected: Bool
    let disabled: Bool
    var isCustomAdd: Bool = false
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Text(isCustomAdd ? "＋" : pillar.icon)
                    .font(.system(size: 22, weight: .bold))
                
                Text(isCustomAdd ? "Custom" : pillar.label)
                    .font(AppTheme.Fonts.mono(12))
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(1)
                
                Text(isCustomAdd ? "Something else?" : pillar.description)
                    .font(AppTheme.Fonts.body(12))
                    .foregroundColor(.white.opacity(0.45))
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(selected ? AppTheme.accent.opacity(0.18) : Color.white.opacity(0.05))
            .overlay(
                Rectangle().stroke(
                    selected ? AppTheme.accent : Color.white.opacity(0.12),
                    lineWidth: 2
                )
            )
            .opacity(disabled ? 0.35 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(disabled)
    }
}

// MARK: - Pillar Primary (iOS)

private struct PillarPrimaryStep: View {
    let selectedPillars: [String]
    let onSelect: (String) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Which one matters MOST right now?")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            Text("Pick the one you'd fix first if you could only pick one.")
                .font(AppTheme.Fonts.mono(12))
                .foregroundColor(.white.opacity(0.4))
            
            VStack(spacing: 12) {
                ForEach(selectedPillars, id: \.self) { pillarId in
                    let preset = PillarPreset.all.first(where: { $0.id == pillarId })
                        ?? (pillarId.starts(with: "custom_") ? PillarPreset.createCustomPillar(id: pillarId) : nil)
                    let title = preset?.label ?? pillarId.replacingOccurrences(of: "_", with: " ")
                    BrutalChoice(title: title, selected: false) {
                        onSelect(pillarId)
                    }
                }
            }
        }
        .padding(.top, 8)
    }
}

// MARK: - Pillar Questions (iOS)

private struct PillarQuestionsView: View {
    let selectedPillars: [String]
    let onSave: (String, Any) -> Void
    let onFinish: () -> Void
    
    @State private var pillarIndex: Int = 0
    @State private var questionType: QuestionType = .current
    @State private var textInput: String = ""
    @State private var showTransition: Bool = false
    @State private var transitionText: String = ""
    @State private var showMilestone: Bool = false
    @State private var milestoneTitle: String = ""
    @State private var milestoneSubtitle: String = ""
    
    // For feedback/reaction
    @State private var selectedOptionIndex: Int? = nil
    @State private var showReaction: Bool = false
    @State private var reactionText: String = ""

    enum QuestionType {
        case current, goal, future
    }
    
    var currentPillarId: String {
        guard pillarIndex < selectedPillars.count else { return "" }
        return selectedPillars[pillarIndex]
    }
    
    var currentPillar: PillarPreset? {
        let id = currentPillarId
        if id.isEmpty { return nil }
        return PillarPreset.all.first(where: { $0.id == id }) 
            ?? (id.starts(with: "custom_") ? PillarPreset.createCustomPillar(id: id) : nil)
    }
    
    var body: some View {
        ZStack {
            if showMilestone {
                milestoneView
            } else if showTransition {
                transitionView
            } else if let pillar = currentPillar {
                contentView(pillar)
            } else {
                Text("Loading...")
            }
        }
        .animation(.easeInOut, value: questionType)
        .animation(.easeInOut, value: pillarIndex)
    }
    
    private func contentView(_ pillar: PillarPreset) -> some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Text(pillar.icon).font(.system(size: 24))
                    Text(pillar.label.uppercased())
                        .font(AppTheme.Fonts.mono(14))
                        .fontWeight(.bold)
                        .foregroundColor(.white.opacity(0.6))
                }
                Spacer()
                // Progress dots
                HStack(spacing: 4) {
                    ForEach(0..<3) { i in
                        Circle()
                            .fill(progressColor(for: i))
                            .frame(width: 6, height: 6)
                    }
                }
            }
            .padding(.bottom, 32)
            
            // Question Content
            switch questionType {
            case .current:
                currentQuestionView(pillar)
            case .goal:
                goalQuestionView(pillar)
            case .future:
                futureQuestionView(pillar)
            }
            
            Spacer()
        }
    }
    
    private func progressColor(for index: Int) -> Color {
        let current: Int
        switch questionType {
        case .current: current = 0
        case .goal: current = 1
        case .future: current = 2
        }
        
        if current == index { return AppTheme.accent }
        if current > index { return AppTheme.accent } // Completed
        return Color.white.opacity(0.2)
    }
    
    // MARK: - Question Views
    
    private func currentQuestionView(_ pillar: PillarPreset) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Where are you at with \(pillar.label)?")
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            Text("Be honest with yourself.")
                .font(AppTheme.Fonts.mono(14))
                .foregroundColor(.white.opacity(0.6))
            
            VStack(spacing: 12) {
                ForEach(0..<pillar.currentStateOptions.count, id: \.self) { idx in
                    let option = pillar.currentStateOptions[idx]
                    Button(action: {
                        handleCurrentSelection(option, index: idx)
                    }) {
                        HStack(spacing: 12) {
                            Text(emojiForIndex(idx))
                                .font(.system(size: 20))
                            Text(option)
                                .font(AppTheme.Fonts.mono(14))
                                .foregroundColor(selectedOptionIndex == idx ? .black : .white)
                                .multilineTextAlignment(.leading)
                            Spacer()
                        }
                        .padding(16)
                        .background(selectedOptionIndex == idx ? AppTheme.accent : Color.white.opacity(0.05))
                        .overlay(
                            Rectangle().stroke(
                                selectedOptionIndex == idx ? AppTheme.accent : Color.white.opacity(0.12),
                                lineWidth: 2
                            )
                        )
                    }
                    .buttonStyle(PlainButtonStyle())
                    .disabled(showReaction)
                }
            }
        }
    }
    
    private func goalQuestionView(_ pillar: PillarPreset) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(pillar.goalPrompt)
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            MegaInput(
                title: "",
                placeholder: "Be specific...",
                text: $textInput
            )
            
            BrutalButton(title: "Lock it in", style: .primary) {
                handleNext(value: textInput)
            }
            .disabled(textInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
    }
    
    private func futureQuestionView(_ pillar: PillarPreset) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(pillar.futurePrompt)
                .font(AppTheme.Fonts.heavy(28))
                .foregroundColor(.white)
            
            Text("Complete this statement:")
                .font(AppTheme.Fonts.mono(12))
                .foregroundColor(.white.opacity(0.4))
            
            VStack(alignment: .leading, spacing: 8) {
                Text("I am...")
                    .font(AppTheme.Fonts.heavy(24))
                    .foregroundColor(AppTheme.accent)
                
                TextField("someone who...", text: $textInput)
                    .font(AppTheme.Fonts.heavy(24))
                    .foregroundColor(.white)
                    .accentColor(AppTheme.accent)
                    .submitLabel(.done)
                
                Rectangle()
                    .fill(Color.white.opacity(0.2))
                    .frame(height: 2)
            }
            .padding(.vertical, 20)
            
            BrutalButton(title: pillarIndex == selectedPillars.count - 1 ? "Complete" : "Next Pillar", style: .primary) {
                handleNext(value: textInput)
            }
            .disabled(textInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
    }
    
    // MARK: - Logic
    
    private func handleCurrentSelection(_ option: String, index: Int) {
        selectedOptionIndex = index
        showReaction = true
        // In a real app, we'd play haptic/sound here
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            showReaction = false
            selectedOptionIndex = nil
            handleNext(value: option)
        }
    }
    
    private func handleNext(value: String) {
        let fieldName = "pillar_\(currentPillarId)_\(questionType)"
        onSave(fieldName, value)
        
        textInput = "" // Reset input
        
        switch questionType {
        case .current:
            questionType = .goal
        case .goal:
            questionType = .future
        case .future:
            // Move to next pillar or finish
            if pillarIndex < selectedPillars.count - 1 {
                // Show transition
                showPillarTransition()
            } else {
                // Finish
                showFinalMilestone()
            }
        }
    }
    
    private func showPillarTransition() {
        let completedCount = pillarIndex + 1
        
        // Setup transition text
        if completedCount == 1 {
            transitionText = "First one down. Just getting started."
        } else if completedCount == 2 {
            transitionText = "Momentum building."
        } else {
            transitionText = "Locked in."
        }
        
        showTransition = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            showTransition = false
            pillarIndex += 1
            questionType = .current
        }
    }
    
    private func showFinalMilestone() {
        milestoneTitle = "LOCKED IN"
        milestoneSubtitle = "Your future self just became real."
        showMilestone = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            onFinish()
        }
    }
    
    // MARK: - Transition Views
    
    private var transitionView: some View {
        VStack(spacing: 20) {
            Image("mascot_proud") // Placeholder, assume asset exists or text
                .resizable()
                .scaledToFit()
                .frame(width: 150, height: 150)
            
            Text(transitionText)
                .font(AppTheme.Fonts.heavy(24))
                .foregroundColor(AppTheme.accent)
                .multilineTextAlignment(.center)
        }
    }
    
    private var milestoneView: some View {
        VStack(spacing: 20) {
            Text(milestoneTitle)
                .font(AppTheme.Fonts.heavy(48))
                .foregroundColor(AppTheme.accent)
            
            Text(milestoneSubtitle)
                .font(AppTheme.Fonts.mono(16))
                .foregroundColor(.white.opacity(0.8))
                .multilineTextAlignment(.center)
        }
    }
    
    private func emojiForIndex(_ index: Int) -> String {
        switch index {
        case 0: return "😬"
        case 1: return "😐"
        case 2: return "🤔"
        default: return "💪"
        }
    }
}

// MARK: - Commitment Card (iOS)

private struct CommitmentCardView: View {
    let data: [String: Any]
    let onAccept: () -> Void
    
    @State private var agreed: Bool = false
    @State private var animateIn: Bool = false
    
    var name: String { (data["name"] as? String) ?? "You" }
    var coreIdentity: String { (data["core_identity"] as? String) ?? "Someone who shows up" }
    var primaryPillar: String { (data["primary_pillar"] as? String) ?? "" }
    
    var body: some View {
        VStack(spacing: 40) {
            // Header Section - Simplified
            VStack(spacing: 16) {
                // Simple icon with subtle shadow (USE SHADOWS FOR ELEVATION)
                Image(systemName: "shield.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [AppTheme.accent, AppTheme.accent.opacity(0.7)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .shadow(color: AppTheme.accent.opacity(0.3), radius: 16, x: 0, y: 8)
                
                VStack(spacing: 6) {
                    Text("Your Commitment")
                        .font(.system(size: 28, weight: .semibold)) // Lighter weight (IMPROVE FONT CHOICES)
                        .foregroundColor(.white)
                    
                    Text("This contract is binding.")
                        .font(.system(size: 15, weight: .regular))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
            .padding(.top, 32)
                    
                    // Identity Card - Clean & Elevated (USE SHADOWS FOR ELEVATION)
                    VStack(spacing: 12) {
                        Text("I AM BECOMING")
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.4))
                            .tracking(2.5)
                            .padding(.top, 24)
                        
                        Text(coreIdentity)
                            .font(.system(size: 26, weight: .medium)) // Lighter than .heavy
                            .foregroundColor(.white)
                            .multilineTextAlignment(.center)
                            .lineLimit(3)
                            .padding(.horizontal, 24)
                            .padding(.bottom, 24)
                    }
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(.white.opacity(0.04))
                            .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10) // Subtle elevation
                    )
                    
                    // Primary Focus - Simplified (KEEP IT SIMPLE)
                    if !primaryPillar.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("PRIMARY OBJECTIVE")
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .foregroundColor(.white.opacity(0.4))
                                .tracking(2.5)
                            
                            HStack(spacing: 14) {
                                let pillar = getPillar(primaryPillar)
                                
                                // Icon with subtle background
                                Text(pillar?.icon ?? "🎯")
                                    .font(.system(size: 32))
                                    .frame(width: 56, height: 56)
                                    .background(
                                        Circle()
                                            .fill(.white.opacity(0.06))
                                    )
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(pillar?.label ?? primaryPillar)
                                        .font(.system(size: 18, weight: .semibold))
                                        .foregroundColor(AppTheme.accent)
                                    
                                    if let identity = data["pillar_\(primaryPillar)_future"] as? String {
                                        Text(identity)
                                            .font(.system(size: 14, weight: .regular))
                                            .foregroundColor(.white.opacity(0.6))
                                            .lineLimit(2)
                                    }
                                }
                                
                                Spacer()
                            }
                            .padding(18)
                            .background(
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(.white.opacity(0.04))
                            )
                        }
                    }
                    
                    // The Code - Clean list (KEEP IT SIMPLE)
                    VStack(alignment: .leading, spacing: 12) {
                        Text("THE CODE")
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.4))
                            .tracking(2.5)
                        
                        VStack(spacing: 0) {
                            pledgeRow("I will show up every single day.")
                            pledgeRow("I will be radically honest with myself.")
                            pledgeRow("I will not negotiate with my weaker self.")
                        }
                        .background(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(.white.opacity(0.04))
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    
                    Spacer(minLength: 24)
                    
                    // Agreement + Button (REDUCE COGNITIVE LOAD)
                    VStack(spacing: 16) {
                        // Simple toggle
                        Button(action: {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                                agreed.toggle()
                            }
                        }) {
                            HStack(spacing: 14) {
                                // Clean checkmark indicator
                                ZStack {
                                    Circle()
                                        .strokeBorder(agreed ? AppTheme.accent : .white.opacity(0.25), lineWidth: 2)
                                        .frame(width: 24, height: 24)
                                    
                                    if agreed {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(AppTheme.accent)
                                            .transition(.scale.combined(with: .opacity))
                                    }
                                }
                                
                                Text("I accept full responsibility for my outcome.")
                                    .font(.system(size: 15, weight: .regular))
                                    .foregroundColor(agreed ? .white : .white.opacity(0.6))
                                    .multilineTextAlignment(.leading)
                            }
                            .padding(18)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(agreed ? AppTheme.accent.opacity(0.08) : .clear)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                                            .strokeBorder(agreed ? AppTheme.accent.opacity(0.25) : .white.opacity(0.08), lineWidth: 1)
                                    )
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                        
                        // Main CTA - Clean & focused
                        BrutalButton(title: "Sign Commitment", style: .primary) {
                            onAccept()
                        }
                        .disabled(!agreed)
                        .opacity(agreed ? 1 : 0.5)
                        .saturation(agreed ? 1 : 0)
                    }
                    .padding(.bottom, 24)
                }
                .padding(.horizontal, 20)
            .padding(.top, 32)
            .padding(.bottom, 20)
        .onAppear {
            withAnimation(.easeOut(duration: 0.7).delay(0.1)) {
                animateIn = true
            }
        }
    }
    
    private func pledgeRow(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 18))
                .foregroundStyle(
                    LinearGradient(
                        colors: [AppTheme.accent, AppTheme.accent.opacity(0.7)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            
            Text(text)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(.white.opacity(0.85))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 18)
        .background(
            Rectangle()
                .fill(.white.opacity(0.02))
                .frame(height: 1),
            alignment: .bottom
        )
    }
    
    private func getPillar(_ id: String) -> PillarPreset? {
        PillarPreset.all.first(where: { $0.id == id }) ?? (id.starts(with: "custom_") ? PillarPreset.createCustomPillar(id: id) : nil)
    }
}



