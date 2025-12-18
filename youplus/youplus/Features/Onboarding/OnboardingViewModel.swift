import Foundation
import Combine

class OnboardingViewModel: ObservableObject {
    // MARK: - Published State
    
    @Published var currentStepIndex: Int = 30  // START AT COMMITMENT CARD (Index 30 - assuming 0-based and total 31 steps in loadSteps)
    @Published var answers: [String: Any] = [:]
    @Published var selectedPillars: Set<String> = []
    @Published var didCompleteOnboarding: Bool = false
    
    // MARK: - Steps Management
    
    private var allSteps: [OnboardingStep] = []
    
    @Published var steps: [OnboardingStep] = []
    
    var currentStep: OnboardingStep? {
        guard currentStepIndex >= 0 && currentStepIndex < steps.count else { return nil }
        return steps[currentStepIndex]
    }
    
    var progress: Double {
        guard !steps.isEmpty else { return 0 }
        return Double(currentStepIndex + 1) / Double(steps.count)
    }
    
    // MARK: - Initialization
    
    init() {
        self.allSteps = loadSteps()
        self.steps = allSteps // Initially load all base steps
        // loadPersistedAnswers() // Commented out for testing
        setupMockData() // Inject mock data for testing
        
        // If we need to inject dynamic steps (like pillar questions), we'll do it as we progress
        // or pre-calculate them if possible. 
        // For this implementation, we will follow the web logic:
        // ACT 4: PILLAR QUESTIONS (Dynamic - inserted after step 9)
    }
    
    private func setupMockData() {
        answers = [
            "name": "Alex",
            "core_identity": "The Architect",
            "primary_pillar": "gym",
            "selected_pillars": ["gym", "focus", "business"],
            "pillar_gym_future": "I am built like a spartan warrior.",
            "pillar_focus_future": "I have laser vision for my goals.",
            "pillar_business_future": "I run an empire.",
            "belief_score": 8,
            "call_time": "07:00"
        ]
        selectedPillars = ["gym", "focus", "business"]
    }
    
    // MARK: - Navigation
    
    func nextStep() {
        if currentStepIndex < steps.count - 1 {
            // Check if we need to insert dynamic steps before moving forward
            // if let currentStep = currentStep, currentStep.type == .pillarPrimary {
            //    generatePillarQuestions()
            // }

            // Web parity: if user chose to clone voice, skip the preset voice selection step
            if let currentStep = currentStep, currentStep.type == .voicePreference {
                let voicePreference = (answers["voice_preference"] as? String) ?? ""
                if voicePreference == "clone" {
                    // If the next step is voice selection, skip it
                    if currentStepIndex + 1 < steps.count, steps[currentStepIndex + 1].type == .voiceSelection {
                        currentStepIndex += 2
                        return
                    }
                }
            }
            
            currentStepIndex += 1
        } else {
            // Onboarding Complete
            completeOnboarding()
        }
    }
    
    func previousStep() {
        if currentStepIndex > 0 {
            currentStepIndex -= 1
        }
    }
    
    // MARK: - Data Handling
    
    func saveAnswer(for stepId: String, value: Any) {
        let fieldName = getFieldName(stepId: stepId)
        answers[fieldName] = value
        persistAnswer(key: fieldName, value: value)
        
        // Special handling for pillar selection to update the set
        if stepId == "8", let pillars = value as? [String] {
            selectedPillars = Set(pillars)
        }
    }
    
    // MARK: - Dynamic Logic
    
    private func generatePillarQuestions() {
        // Find where to insert pillar questions (after step 9 / type .pillarPrimary)
        guard let insertIndex = steps.firstIndex(where: { $0.type == .pillarQuestions }) else { return }
        
        // Remove the placeholder
        steps.remove(at: insertIndex)
        
        // Generate new steps based on selected pillars
        var newSteps: [OnboardingStep] = []
        
        let pillars = orderedSelectedPillars()
        
        for pillarId in pillars {
            let preset: PillarPreset?
            if let found = PillarPreset.all.first(where: { $0.id == pillarId }) {
                preset = found
            } else if pillarId.starts(with: "custom_") {
                preset = PillarPreset.createCustomPillar(id: pillarId)
            } else {
                preset = nil
            }

            if let preset {
                // Question 1: Current State
                newSteps.append(OnboardingStep(
                    id: "pillar_\(pillarId)_current",
                    type: .choice,
                    label: "Where are you at with \(preset.label)?",
                    choices: preset.currentStateOptions
                ))
                
                // Question 2: Goal (Input)
                newSteps.append(OnboardingStep(
                    id: "pillar_\(pillarId)_goal",
                    type: .input,
                    label: preset.goalPrompt,
                    placeholder: "Be specific"
                ))
                
                // Question 3: Future Visualization (Input)
                newSteps.append(OnboardingStep(
                    id: "pillar_\(pillarId)_future",
                    type: .input,
                    label: preset.futurePrompt,
                    placeholder: "Describe it"
                ))
            }
        }
        
        // Insert new steps
        steps.insert(contentsOf: newSteps, at: insertIndex)
        
        // Adjust current index if needed (though we are usually sitting on the step BEFORE insertion when nextStep is called)
        // Actually, nextStep is called AFTER this function. So we are at step 9 (index X). 
        // We insert at X+1. Next step will be X+1, which is the first new question. Correct.
    }
    
    private func completeOnboarding() {
        print("Onboarding Complete: \(answers)")
        didCompleteOnboarding = true
    }
    
    // MARK: - Helpers
    
    // Replicating STEP_FIELD_MAP from web/src/data/onboardingSteps.ts
    private func getFieldName(stepId: String) -> String {
        let map: [String: String] = [
            "2": "change_attempts",
            "4": "name",
            "5": "age",
            "6": "gender",
            "8": "selected_pillars",
            "9": "primary_pillar",
            "11": "failure_pattern",
            "12": "previous_attempts",
            "13": "quit_pattern",
            "14": "favorite_excuse",
            "16": "who_disappointed",
            "17": "primary_fear",
            "18": "hidden_fear",
            "19": "dark_future",
            "20": "core_identity",
            "22": "why_recording",
            "23": "call_time",
            "24": "allow_interruptions",
            "25": "strikes_allowed",
            "26": "belief_score",
            "28": "pledge_recording",
            "29": "voice_preference",
            "30": "preset_voice_id"
        ]
        return map[stepId] ?? stepId
    }

    // MARK: - Web Parity: Dynamic Commentary
    
    func commentaryLines(for step: OnboardingStep) -> [String] {
        // Static lines win
        if let lines = step.lines, !lines.isEmpty {
            return lines
        }
        
        switch step.id {
        case "3":
            return hookResponse(attempts: stringAnswer("change_attempts"))
        case "7":
            let name = (stringAnswer("name").isEmpty ? "friend" : stringAnswer("name"))
            return [
                "Good to meet you, \(name).",
                "Life isn't one battle.",
                "It's many.",
                "Pick yours."
            ]
        case "10":
            let pillars = stringArrayAnswer("selected_pillars")
            return [
                "So you want to fix your \(formatPillars(pillars)).",
                "Let's see why it hasn't worked before."
            ]
        case "15":
            let name = stringAnswer("name")
            let quitPattern = stringAnswer("quit_pattern").isEmpty ? "early" : stringAnswer("quit_pattern")
            let excuse = stringAnswer("favorite_excuse").isEmpty ? "excuses" : stringAnswer("favorite_excuse")
            return [
                "You quit at \"\(quitPattern)\".",
                "Your excuse is always \"\(excuse)\".",
                name.isEmpty ? "I see you." : "I see you, \(name)."
            ]
        case "21":
            let identity = stringAnswer("core_identity").isEmpty ? "someone new" : stringAnswer("core_identity")
            return [
                "\"\(identity)\"",
                "That's who you're becoming.",
                "Now tell me why."
            ]
        case "27":
            let score = intAnswer("belief_score") ?? 5
            let name = stringAnswer("name")
            return beliefResponse(score: score, name: name)
        default:
            return []
        }
    }
    
    private func formatPillars(_ pillars: [String]) -> String {
        guard !pillars.isEmpty else { return "your goals" }
        let cleaned = pillars.map { $0.replacingOccurrences(of: "_", with: " ") }
        if cleaned.count == 1 { return cleaned[0] }
        if cleaned.count == 2 { return "\(cleaned[0]) and \(cleaned[1])" }
        let last = cleaned.last ?? ""
        let rest = cleaned.dropLast().joined(separator: ", ")
        return "\(rest), and \(last)"
    }
    
    private func hookResponse(attempts: String) -> [String] {
        switch attempts {
        case "1-2":
            return ["Just getting started.", "Good. Less baggage to carry."]
        case "3-5":
            return ["A few tries.", "Most people stop there. You didn't."]
        case "6-10":
            return ["You keep coming back.", "That's not weakness. That's hunger."]
        case "I lost count":
            return ["Yeah. I figured.", "But you're still here. That says something."]
        default:
            return ["Interesting.", "Let's make this time different."]
        }
    }
    
    private func beliefResponse(score: Int, name: String) -> [String] {
        if score <= 3 {
            return [
                "\(name.isEmpty ? "Your" : "\(name), your") belief is at \(score).",
                "That's brutally honest.",
                "Belief grows with action. One day at a time."
            ]
        } else if score <= 5 {
            return [
                "Belief at \(score).",
                "Not fully sold on yourself yet.",
                "That's okay. We'll build it together."
            ]
        } else if score <= 7 {
            return [
                "\(score) out of 10.",
                "You see a path.",
                "Now let's walk it."
            ]
        } else {
            return [
                "Belief at \(score). Strong.",
                "Now prove it wasn't just talk."
            ]
        }
    }
    
    // MARK: - Answer Helpers
    
    func stringAnswer(_ key: String) -> String {
        return (answers[key] as? String) ?? ""
    }
    
    func intAnswer(_ key: String) -> Int? {
        if let i = answers[key] as? Int { return i }
        if let d = answers[key] as? Double { return Int(d) }
        if let s = answers[key] as? String, let i = Int(s) { return i }
        return nil
    }
    
    func boolAnswer(_ key: String) -> Bool? {
        if let b = answers[key] as? Bool { return b }
        if let s = answers[key] as? String {
            if s == "true" { return true }
            if s == "false" { return false }
        }
        return nil
    }
    
    func stringArrayAnswer(_ key: String) -> [String] {
        return (answers[key] as? [String]) ?? []
    }
    
    private func orderedSelectedPillars() -> [String] {
        let pillars = Array(selectedPillars)
        let primary = (answers["primary_pillar"] as? String) ?? ""
        guard !primary.isEmpty else { return pillars }
        return [primary] + pillars.filter { $0 != primary }
    }
    
    // MARK: - Completion Check (matches web `isOnboardingComplete`)
    
    func isOnboardingComplete() -> Bool {
        let required: [String] = [
            "change_attempts",
            "name",
            "age",
            "gender",
            "selected_pillars",
            "primary_pillar",
            "failure_pattern",
            "previous_attempts",
            "quit_pattern",
            "favorite_excuse",
            "who_disappointed",
            "primary_fear",
            "hidden_fear",
            "dark_future",
            "core_identity",
            "why_recording",
            "call_time",
            "allow_interruptions",
            "strikes_allowed",
            "belief_score",
            "pledge_recording",
            "voice_preference"
        ]
        
        for key in required {
            let val = answers[key]
            if val == nil { return false }
            if let s = val as? String, s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { return false }
            if let arr = val as? [String], arr.isEmpty { return false }
        }
        
        // Conditional voice selection
        if (answers["voice_preference"] as? String) == "preset" {
            let presetId = (answers["preset_voice_id"] as? String) ?? ""
            if presetId.isEmpty { return false }
        }
        
        return true
    }
    
    // MARK: - Persistence (simple UserDefaults backing for resume)
    
    private let storagePrefix = "onboarding.answers."
    
    private func persistAnswer(key: String, value: Any) {
        // Must be property-list compatible: String, Int/Double, Bool, [String], etc.
        UserDefaults.standard.set(value, forKey: storagePrefix + key)
    }
    
    private func loadPersistedAnswers() {
        // Restore the known field names (web STEP_FIELD_MAP) and also selected pillars
        let keysToLoad: [String] = [
            "change_attempts",
            "name",
            "age",
            "gender",
            "selected_pillars",
            "primary_pillar",
            "failure_pattern",
            "previous_attempts",
            "quit_pattern",
            "favorite_excuse",
            "who_disappointed",
            "primary_fear",
            "hidden_fear",
            "dark_future",
            "core_identity",
            "why_recording",
            "call_time",
            "allow_interruptions",
            "strikes_allowed",
            "belief_score",
            "pledge_recording",
            "voice_preference",
            "preset_voice_id"
        ]
        
        var loaded: [String: Any] = [:]
        for key in keysToLoad {
            let storageKey = storagePrefix + key
            if let value = UserDefaults.standard.object(forKey: storageKey) {
                loaded[key] = value
            }
        }
        
        if !loaded.isEmpty {
            answers.merge(loaded) { _, new in new }
            if let pillars = loaded["selected_pillars"] as? [String] {
                selectedPillars = Set(pillars)
            }
        }
    }
    
    // Loading the static steps definitions (translated from onboardingSteps.ts)
    private func loadSteps() -> [OnboardingStep] {
        return [
            // ACT 1: THE HOOK
            OnboardingStep(id: 1, type: .commentary, lines: [
                "Hey.",
                "It's me.",
                "You.",
                "From the future."
            ]),
            OnboardingStep(id: 2, type: .choice, label: "How many times have you tried to change something about yourself?", choices: ["1-2", "3-5", "6-10", "I lost count"]),
            OnboardingStep(id: 3, type: .commentary), // Dynamic content handled by View based on ID
            
            // ACT 2: IDENTITY
            OnboardingStep(id: 4, type: .input, label: "What's your name?", placeholder: "Your name"),
            OnboardingStep(id: 5, type: .slider, label: "How old are you?", min: 16, max: 99),
            OnboardingStep(id: 6, type: .choice, label: "Gender?", choices: ["Male", "Female", "Don't specify"]),
            
            // ACT 3: THE PILLARS
            OnboardingStep(id: 7, type: .commentary), // Dynamic: "Good to meet you, {name}..."
            OnboardingStep(id: 8, type: .pillarSelection),
            OnboardingStep(id: 9, type: .pillarPrimary, label: "Which one matters MOST right now?"),
            
            // ACT 4: PILLAR QUESTIONS PLACEHOLDER
            OnboardingStep(id: "pillar_questions", type: .pillarQuestions),
            
            // ACT 5: THE PATTERN
            OnboardingStep(id: 10, type: .commentary), // Dynamic: "So you want to fix your {pillars}..."
            OnboardingStep(id: 11, type: .choice, label: "What usually happens when you try to change?", choices: [
                "I slowly drift away",
                "I crash and burn",
                "I just stop one day",
                "I never really start"
            ]),
            OnboardingStep(id: 12, type: .slider, label: "How many times have you tried this exact thing before?", min: 0, max: 20),
            OnboardingStep(id: 13, type: .choice, label: "When do you usually give up?", choices: [
                "Day 1-3",
                "First week",
                "First month",
                "Right before I win"
            ]),
            OnboardingStep(id: 14, type: .choice, label: "What's your go-to excuse?", choices: [
                "I'll start tomorrow",
                "Too tired today",
                "Not ready yet",
                "Something came up"
            ]),
            OnboardingStep(id: 15, type: .commentary), // Dynamic: "You quit at {quit_pattern}..."
            
            // ACT 6: THE STAKES
            OnboardingStep(id: 16, type: .choice, label: "When you failed before, who did you let down?", choices: [
                "Myself",
                "My family",
                "My partner",
                "Everyone who believed in me"
            ]),
            OnboardingStep(id: 17, type: .choice, label: "What scares you more?", choices: [
                "Failing publicly",
                "Actually succeeding",
                "Dying with regret",
                "Staying exactly the same"
            ]),
            OnboardingStep(id: 18, type: .input, label: "What's a fear you don't talk about?", placeholder: "Be honest with yourself"),
            OnboardingStep(id: 19, type: .input, label: "If nothing changes, where will you be in 5 years?", placeholder: "Paint the dark picture"),
            
            // ACT 7: THE WHY
            OnboardingStep(id: 20, type: .input, label: "Complete this: I am becoming...", placeholder: "I am becoming..."),
            OnboardingStep(id: 21, type: .commentary), // Dynamic: "{identity}. That's who you're becoming..."
            OnboardingStep(id: 22, type: .voice, label: "Why does this matter to you?", subtext: "Speak from your heart. I'm listening."),
            
            // ACT 8: THE SYSTEM
            OnboardingStep(id: 23, type: .time, label: "What time should I check in with you?"),
            OnboardingStep(id: 24, type: .choice, label: "Can I interrupt your day to hold you accountable?", choices: [
                "Yes, hold me accountable",
                "No, I'll check in myself"
            ]),
            OnboardingStep(id: 25, type: .slider, label: "How many strikes before I get ruthless?", min: 1, max: 5),
            
            // ACT 9: THE PLEDGE
            OnboardingStep(id: 26, type: .slider, label: "Right now, how much do you believe you can do this?", min: 1, max: 10),
            OnboardingStep(id: 27, type: .commentary), // Dynamic: Belief response
            OnboardingStep(id: 28, type: .voice, label: "Make your pledge.", subtext: "Promise yourself. Out loud. I'm recording this."),
            
            // ACT 10: VOICE PREFERENCE
            OnboardingStep(id: 29, type: .voicePreference, label: "Your Future Self's Voice", subtext: "I'll be calling you as your Future Self. How should I sound?"),
            OnboardingStep(id: 30, type: .voiceSelection, label: "Choose Your Future Self's Voice", subtext: "Select the voice that resonates with you"),
            
            // ACT 11: SEAL THE DEAL
            // iOS: keep onboarding frictionless; auth/subscription happens AFTER onboarding
            OnboardingStep(id: 31, type: .card, label: "Your Commitment")
        ]
    }
    
    // MARK: - Payload Builder (for pushing to backend)
    
    func buildConversionPayload() -> OnboardingConversionPayload {
        // Map iOS answers to backend schema
        let selectedPillars = (answers["selected_pillars"] as? [String]) ?? []
        
        // Collect dynamic pillar fields (pillarId_current, pillarId_goal, pillarId_future)
        var dynamicFields: [String: String] = [:]
        for pillarId in selectedPillars {
            for suffix in ["current", "goal", "future"] {
                let key = "pillar_\(pillarId)_\(suffix)"
                if let value = answers[key] as? String {
                    dynamicFields["\(pillarId)_\(suffix)"] = value
                }
            }
        }
        
        let payload = OnboardingConversionPayload(
            name: answers["name"] as? String,
            times_tried: answers["change_attempts"] as? Int,
            core_identity: (answers["core_identity"] as? String) ?? "",
            primary_pillar: answers["primary_pillar"] as? String,
            dark_future: answers["dark_future"] as? String,
            quit_pattern: answers["quit_pattern"] as? String,
            favorite_excuse: answers["favorite_excuse"] as? String,
            who_disappointed: answers["who_disappointed"] as? [String],
            selected_pillars: selectedPillars,
            future_self_intro_recording: answers["future_self_intro_recording"] as? String ?? "",
            why_recording: answers["why_recording"] as? String ?? "",
            pledge_recording: answers["pledge_recording"] as? String ?? "",
            merged_voice_recording: answers["merged_voice_recording"] as? String,
            call_time: answers["call_time"] as? String,
            timezone: answers["timezone"] as? String,
            future_self_statement: answers["core_identity"] as? String,
            favorite_excuse_context: answers["favorite_excuse_context"] as? String,
            dynamicPillarFields: dynamicFields
        )
        
        return payload
    }
}
