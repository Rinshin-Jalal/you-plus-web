import Foundation

// MARK: - Step Types

enum OnboardingStepType: String, Codable {
    case commentary
    case choice
    case input
    case slider
    case voice
    case time
    case pillarSelection = "pillar_selection"
    case pillarPrimary = "pillar_primary"
    case pillarQuestions = "pillar_questions"
    case voicePreference = "voice_preference"
    case voiceSelection = "voice_selection"
    case card
    case auth
}

// MARK: - Onboarding Step

struct OnboardingStep: Identifiable, Codable {
    let id: String
    let type: OnboardingStepType
    
    // Static content
    var lines: [String]?
    var label: String?
    var subtext: String?
    var placeholder: String?
    var choices: [String]?
    var min: Double?
    var max: Double?
    
    init(id: String, type: OnboardingStepType, lines: [String]? = nil, label: String? = nil, subtext: String? = nil, placeholder: String? = nil, choices: [String]? = nil, min: Double? = nil, max: Double? = nil) {
        self.id = id
        self.type = type
        self.lines = lines
        self.label = label
        self.subtext = subtext
        self.placeholder = placeholder
        self.choices = choices
        self.min = min
        self.max = max
    }
    
    init(id: Int, type: OnboardingStepType, lines: [String]? = nil, label: String? = nil, subtext: String? = nil, placeholder: String? = nil, choices: [String]? = nil, min: Double? = nil, max: Double? = nil) {
        self.id = String(id)
        self.type = type
        self.lines = lines
        self.label = label
        self.subtext = subtext
        self.placeholder = placeholder
        self.choices = choices
        self.min = min
        self.max = max
    }
}

// MARK: - Pillar Models

enum PillarCategory: String, Codable, CaseIterable {
    case body
    case mind
    case money
    case game
    case lifestyle
    
    var icon: String {
        switch self {
        case .body: return "💪"
        case .mind: return "🧠"
        case .money: return "💰"
        case .game: return "🎯"
        case .lifestyle: return "🌅"
        }
    }
    
    var title: String {
        return self.rawValue.capitalized
    }
}

struct PillarPreset: Identifiable, Codable, Hashable {
    let id: String
    let label: String
    let icon: String
    let description: String
    let category: PillarCategory
    let currentStateOptions: [String]
    let goalPrompt: String
    let futurePrompt: String
}

// MARK: - Custom Pillars (to match web onboarding)

extension PillarPreset {
    static let minPillars = 1
    static let maxPillars = 5
    
    static let genericCurrentStateOptions: [String] = [
        "It's cooked honestly",
        "Mid at best",
        "Not terrible but not good",
        "Decent, ready to level up"
    ]
    
    static let genericGoalPrompt = "What's the goal?"
    static let genericFuturePrompt = "When you've made it, what does it look like?"
    
    static func createCustomPillar(id: String) -> PillarPreset {
        let label = id
            .replacingOccurrences(of: "custom_", with: "")
            .replacingOccurrences(of: "_", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        
        let title = label.isEmpty ? "Custom" : label.prefix(1).uppercased() + label.dropFirst()
        
        return PillarPreset(
            id: id,
            label: title,
            icon: "🎯",
            description: "Your custom focus area",
            category: .lifestyle,
            currentStateOptions: genericCurrentStateOptions,
            goalPrompt: genericGoalPrompt,
            futurePrompt: genericFuturePrompt
        )
    }
}

// MARK: - Voice Models

enum VoiceGender: String, Codable {
    case male
    case female
    case neutral
}

struct PresetVoice: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let description: String
    let gender: VoiceGender
    let vibe: String
}

// MARK: - Static Data

extension PillarPreset {
    static let all: [PillarPreset] = [
        // BODY
        PillarPreset(
            id: "gym",
            label: "Gym",
            icon: "🏋️",
            description: "Get jacked, build muscle, look better",
            category: .body,
            currentStateOptions: [
                "Skinny fat or just skinny",
                "Used to lift, fell off hard",
                "Go sometimes but no real progress",
                "Consistent but want better results"
            ],
            goalPrompt: "What's the physique goal?",
            futurePrompt: "When you've built the body you want, how does life change?"
        ),
        PillarPreset(
            id: "fighting",
            label: "Fighting",
            icon: "🥊",
            description: "MMA, boxing, BJJ, martial arts",
            category: .body,
            currentStateOptions: [
                "Never trained, would get destroyed",
                "Did a few classes, didn't stick",
                "Train but inconsistent",
                "Training regularly, want to compete"
            ],
            goalPrompt: "What martial art or combat sport?",
            futurePrompt: "When you can handle yourself, what's different?"
        ),
        PillarPreset(
            id: "diet",
            label: "Diet",
            icon: "🍗",
            description: "Eat clean, hit macros, stop eating garbage",
            category: .body,
            currentStateOptions: [
                "Uber Eats and energy drinks",
                "Try to eat clean, last 2 days max",
                "Okay during the week, weekends wreck it",
                "Pretty dialed, want to optimize"
            ],
            goalPrompt: "What's the nutrition goal?",
            futurePrompt: "When your diet is locked in, how do you feel?"
        ),
        PillarPreset(
            id: "sleep",
            label: "Sleep",
            icon: "💤",
            description: "Stop doomscrolling at 3am, wake up early",
            category: .body,
            currentStateOptions: [
                "Phone till 4am, dead all day",
                "Sleep schedule is random as hell",
                "Get some sleep but always tired",
                "Decent, want to optimize for energy"
            ],
            goalPrompt: "What time you trying to wake up?",
            futurePrompt: "When you wake up with energy every day, what changes?"
        ),
        PillarPreset(
            id: "running",
            label: "Cardio",
            icon: "🏃",
            description: "Running, swimming, endurance, not dying after stairs",
            category: .body,
            currentStateOptions: [
                "Get winded walking upstairs",
                "Hate cardio, avoid it completely",
                "Do some but hate every second",
                "Cardio is decent, want to push it"
            ],
            goalPrompt: "What's the cardio goal?",
            futurePrompt: "When your endurance is elite, what can you do?"
        ),
        
        // MIND
        PillarPreset(
            id: "focus",
            label: "Focus",
            icon: "🎯",
            description: "Stop getting distracted, deep work, lock in",
            category: .mind,
            currentStateOptions: [
                "Can't focus for 5 minutes without checking phone",
                "Start tasks, get sidetracked instantly",
                "Focus in bursts but burn out",
                "Pretty focused, want laser mode"
            ],
            goalPrompt: "What do you need to focus on?",
            futurePrompt: "When you can lock in for hours, what do you build?"
        ),
        PillarPreset(
            id: "discipline",
            label: "Discipline",
            icon: "⚔️",
            description: "Do what you say, stop being soft",
            category: .mind,
            currentStateOptions: [
                "Zero discipline, always take the easy path",
                "Motivated for a day then back to old ways",
                "Disciplined sometimes, inconsistent",
                "Pretty disciplined, want to be unbreakable"
            ],
            goalPrompt: "What requires more discipline?",
            futurePrompt: "When discipline is automatic, who do you become?"
        ),
        PillarPreset(
            id: "confidence",
            label: "Confidence",
            icon: "👑",
            description: "Stop second-guessing, back yourself",
            category: .mind,
            currentStateOptions: [
                "Barely speak up, doubt everything I do",
                "Confident online, different irl",
                "Confident in some areas, not others",
                "Pretty confident, want unshakeable"
            ],
            goalPrompt: "Where do you want more confidence?",
            futurePrompt: "When you fully back yourself, how do you move?"
        ),
        PillarPreset(
            id: "anxiety",
            label: "Anxiety",
            icon: "🧠",
            description: "Stop overthinking, calm the mental noise",
            category: .mind,
            currentStateOptions: [
                "Anxious about everything, brain never stops",
                "Overthink every decision and conversation",
                "Manageable but still gets me sometimes",
                "Mostly good, want full control"
            ],
            goalPrompt: "What triggers the anxiety most?",
            futurePrompt: "When your mind is calm, how do you show up?"
        ),
        PillarPreset(
            id: "addiction",
            label: "Addiction",
            icon: "🔓",
            description: "Porn, gaming, social media, substances - break free",
            category: .mind,
            currentStateOptions: [
                "Addicted and it's ruining my life",
                "Know it's a problem, can't stop",
                "Trying to quit, keep relapsing",
                "Mostly clean, preventing relapse"
            ],
            goalPrompt: "What are you trying to quit?",
            futurePrompt: "When you're free from it, what do you get back?"
        ),
        
        // MONEY
        PillarPreset(
            id: "income",
            label: "Income",
            icon: "💵",
            description: "Make more money, level up earnings",
            category: .money,
            currentStateOptions: [
                "Broke or barely scraping by",
                "Make some but it's never enough",
                "Decent income, want way more",
                "Good money, want to scale"
            ],
            goalPrompt: "What's the income goal?",
            futurePrompt: "When you're making real money, what's life like?"
        ),
        PillarPreset(
            id: "business",
            label: "Business",
            icon: "🚀",
            description: "Start something, stop working for someone else",
            category: .money,
            currentStateOptions: [
                "Want to start but no idea where to begin",
                "Have ideas but never execute",
                "Side hustle but not making real money",
                "Business running, want to scale"
            ],
            goalPrompt: "What kind of business?",
            futurePrompt: "When your business is thriving, what does your day look like?"
        ),
        PillarPreset(
            id: "investing",
            label: "Investing",
            icon: "📈",
            description: "Stocks, crypto, real estate - make money work",
            category: .money,
            currentStateOptions: [
                "No investments, don't know where to start",
                "Threw money at stuff, lost it",
                "Some investments, no real strategy",
                "Investing regularly, want to optimize"
            ],
            goalPrompt: "What do you want to invest in?",
            futurePrompt: "When your portfolio is stacked, what's possible?"
        ),
        PillarPreset(
            id: "career",
            label: "Career",
            icon: "💼",
            description: "Get promoted, switch jobs, level up professionally",
            category: .money,
            currentStateOptions: [
                "Dead-end job or unemployed",
                "Job is mid, going nowhere",
                "Decent job, want something better",
                "Good position, want to climb faster"
            ],
            goalPrompt: "What's the career goal?",
            futurePrompt: "When you've made it professionally, where are you?"
        ),
        PillarPreset(
            id: "skills",
            label: "Skills",
            icon: "🛠️",
            description: "Coding, design, marketing - learn high-value skills",
            category: .money,
            currentStateOptions: [
                "No valuable skills honestly",
                "Started learning, never finished anything",
                "Know some stuff, not enough to monetize",
                "Have skills, want to master them"
            ],
            goalPrompt: "What skill do you want to learn?",
            futurePrompt: "When you've mastered this skill, what can you build?"
        ),
        
        // GAME
        PillarPreset(
            id: "dating",
            label: "Dating",
            icon: "💘",
            description: "Get better with women, stop being awkward",
            category: .game,
            currentStateOptions: [
                "No game, barely talk to girls",
                "Match on apps but convos go nowhere",
                "Get dates but can't close",
                "Doing okay, want to level up"
            ],
            goalPrompt: "What's the dating goal?",
            futurePrompt: "When your dating life is handled, how do you feel?"
        ),
        PillarPreset(
            id: "social",
            label: "Social Skills",
            icon: "🗣️",
            description: "Network, make friends, stop being awkward in groups",
            category: .game,
            currentStateOptions: [
                "Awkward af, hate social situations",
                "Fine 1-on-1, freeze in groups",
                "Can socialize but don't enjoy it",
                "Pretty social, want to be magnetic"
            ],
            goalPrompt: "What social situation do you want to master?",
            futurePrompt: "When you're naturally charismatic, what changes?"
        ),
        PillarPreset(
            id: "status",
            label: "Status",
            icon: "🔝",
            description: "Build reputation, become respected, be the guy",
            category: .game,
            currentStateOptions: [
                "Nobody knows who I am",
                "Known but not respected",
                "Respected in some circles, not others",
                "Got status, want more influence"
            ],
            goalPrompt: "What do you want to be known for?",
            futurePrompt: "When you've built your reputation, who looks up to you?"
        ),
        PillarPreset(
            id: "style",
            label: "Style",
            icon: "👔",
            description: "Dress better, grooming, first impressions",
            category: .game,
            currentStateOptions: [
                "Wear the same 3 outfits on repeat",
                "Know I dress bad, don't know what to do",
                "Okay style, nothing stands out",
                "Dress well, want to be iconic"
            ],
            goalPrompt: "What's the style you're going for?",
            futurePrompt: "When your style is dialed in, how do people see you?"
        ),
        
        // LIFESTYLE
        PillarPreset(
            id: "nofap",
            label: "NoFap",
            icon: "🔥",
            description: "Quit porn, retain energy, rewire your brain",
            category: .lifestyle,
            currentStateOptions: [
                "Daily habit, can't go a day without",
                "Try to quit, never make it past a week",
                "Some streaks but always relapse",
                "Long streak, want to make it permanent"
            ],
            goalPrompt: "What's your goal streak?",
            futurePrompt: "When you're fully rewired, what changes?"
        ),
        PillarPreset(
            id: "dopamine",
            label: "Dopamine Detox",
            icon: "📵",
            description: "Less phone, less gaming, less instant gratification",
            category: .lifestyle,
            currentStateOptions: [
                "Screen time is embarrassing",
                "Phone is first thing I check, last thing at night",
                "Cut back some, still too much",
                "Pretty controlled, want full control"
            ],
            goalPrompt: "What do you need to cut out?",
            futurePrompt: "When you're not a slave to screens, what do you do instead?"
        ),
        PillarPreset(
            id: "morning",
            label: "Morning Routine",
            icon: "🌅",
            description: "Stop waking up at noon, own your mornings",
            category: .lifestyle,
            currentStateOptions: [
                "Wake up, scroll, already behind",
                "No routine, every morning is chaos",
                "Have a routine, don't follow it",
                "Pretty good mornings, want them locked"
            ],
            goalPrompt: "What does your ideal morning look like?",
            futurePrompt: "When you win every morning, how does the day go?"
        ),
        PillarPreset(
            id: "reading",
            label: "Reading",
            icon: "📚",
            description: "Read more books, less Twitter threads",
            category: .lifestyle,
            currentStateOptions: [
                "Haven't finished a book in years",
                "Buy books, never read them",
                "Read sometimes, not consistently",
                "Read regularly, want to read more"
            ],
            goalPrompt: "How many books per month?",
            futurePrompt: "When reading is a habit, what knowledge do you have?"
        ),
        PillarPreset(
            id: "journaling",
            label: "Journaling",
            icon: "📝",
            description: "Get thoughts out of your head, think clearer",
            category: .lifestyle,
            currentStateOptions: [
                "Never journaled in my life",
                "Tried it, felt weird, stopped",
                "Journal sometimes when stressed",
                "Journal regularly, want to go deeper"
            ],
            goalPrompt: "What do you want journaling to do for you?",
            futurePrompt: "When journaling is automatic, how clear is your mind?"
        ),
        PillarPreset(
            id: "meditation",
            label: "Meditation",
            icon: "🧘",
            description: "Calm mind, less reactive, more present",
            category: .lifestyle,
            currentStateOptions: [
                "Can't sit still for 30 seconds",
                "Tried apps, never stuck with it",
                "Meditate sometimes, hard to be consistent",
                "Regular practice, want to go deeper"
            ],
            goalPrompt: "What do you want meditation to give you?",
            futurePrompt: "When you can control your mind, what's different?"
        ),
        PillarPreset(
            id: "cold_showers",
            label: "Cold Showers",
            icon: "🥶",
            description: "Build mental toughness, start hard",
            category: .lifestyle,
            currentStateOptions: [
                "Never, sounds terrible",
                "Tried once, never again",
                "Sometimes, when I remember",
                "Regular, want to make it daily"
            ],
            goalPrompt: "How long can you go?",
            futurePrompt: "When cold doesn't faze you, what else becomes easy?"
        )
    ]
}

extension PresetVoice {
    static let all: [PresetVoice] = [
        PresetVoice(
            id: "a0e99841-438c-4a64-b679-ae501e7d6091",
            name: "Marcus",
            description: "Calm and confident. Like a wise mentor who's seen it all.",
            gender: .male,
            vibe: "Wise Mentor"
        ),
        PresetVoice(
            id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
            name: "Sarah",
            description: "Warm and encouraging. The supportive coach in your corner.",
            gender: .female,
            vibe: "Supportive Coach"
        ),
        PresetVoice(
            id: "98a34ef2-2140-4c28-9c71-663dc4dd7022",
            name: "Alex",
            description: "Direct and intense. No-nonsense accountability partner.",
            gender: .male,
            vibe: "Drill Sergeant"
        ),
        PresetVoice(
            id: "41534e16-2966-4c6b-9670-111411def906",
            name: "Maya",
            description: "Fierce and motivating. The warrior who pushes you forward.",
            gender: .female,
            vibe: "Fierce Warrior"
        ),
        PresetVoice(
            id: "bf991597-6c13-47e4-8411-91ec2de5c466",
            name: "Jordan",
            description: "Thoughtful and measured. The philosopher who sees the bigger picture.",
            gender: .neutral,
            vibe: "Wise Guide"
        ),
        PresetVoice(
            id: "f9836c6e-a0bd-460e-9d3c-f7299fa60f94",
            name: "Chris",
            description: "Energetic and upbeat. High-energy motivation when you need it.",
            gender: .male,
            vibe: "Energy Coach"
        )
    ]
    
    static let defaultVoiceId = "a0e99841-438c-4a64-b679-ae501e7d6091"
}
