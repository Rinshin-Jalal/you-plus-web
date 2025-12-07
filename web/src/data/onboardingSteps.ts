// ============================================================================
// FUTURE-SELF ONBOARDING - 7 ACTS (~15 minutes)
// ============================================================================
// Less text, more choices. Keep it moving. Language for 16-30 year olds.
// Dynamic pillars - user picks what matters to THEM.
// ============================================================================

export type StepType = 'act_header' | 'commentary' | 'input' | 'voice' | 'choice' | 'multiselect' | 'slider' | 'stepper' | 'time' | 'date' | 'card' | 'finalLoader' | 'pillar_selection' | 'pillar_questions';

export interface Step {
    id: number;
    type: StepType;
    act?: number;
    actTitle?: string;
    actSubtitle?: string;
    lines?: string[];
    label?: string;
    placeholder?: string;
    field?: string;
    subtext?: string;
    choices?: string[];
    min?: number;
    max?: number;
    // For dynamic pillar questions
    pillarId?: string;
    pillarIndex?: number;
}

export const STEPS: Step[] = [
    // ========================================================================
    // ACT 1: HOOK
    // ========================================================================
    { id: 1, type: 'act_header', act: 1, actTitle: "Wake Up", actSubtitle: "Time to stop the cycle" },
    
    { id: 2, type: 'commentary', lines: [
        "Yo. It's me.",
        "You. From the future."
    ]},
    { id: 3, type: 'input', label: "What's your name?", placeholder: "Your name", field: "name" },
    { id: 4, type: 'stepper', label: "How many times have you tried to change?", field: "times_tried", min: 0, max: 50 },

    // ========================================================================
    // ACT 2: IDENTITY
    // ========================================================================
    { id: 5, type: 'act_header', act: 2, actTitle: "Future You", actSubtitle: "Who do you want to be?" },
    
    { id: 6, type: 'commentary', lines: [
        "2 years from now.",
        "You made it. Who ARE you?"
    ]},
    { id: 7, type: 'input', label: "Describe the future you in one line.", placeholder: "I'm the type of person who...", field: "core_identity" },
    { id: 8, type: 'voice', label: "Now say it out loud.", subtext: "Speak clearly - we'll use this to create your future self's voice.", field: "future_self_intro_recording" },

    // ========================================================================
    // ACT 3: PICK YOUR PILLARS (Dynamic!)
    // ========================================================================
    { id: 9, type: 'act_header', act: 3, actTitle: "Your Focus", actSubtitle: "What matters to YOU?" },

    { id: 10, type: 'commentary', lines: [
        "Everyone's different.",
        "Pick what YOU want to change."
    ]},
    
    // This step shows the pillar selection grid
    { id: 11, type: 'pillar_selection', field: 'selected_pillars' },
    
    // This is a placeholder - actual pillar questions are generated dynamically
    // based on what user selected in the previous step
    // Note: No field here - PillarQuestions saves data directly via onUpdate
    { id: 12, type: 'pillar_questions' },

    // ========================================================================
    // ACT 4: THE WHY
    // ========================================================================
    { id: 30, type: 'act_header', act: 4, actTitle: "Your Why", actSubtitle: "What's driving you?" },
    
    { id: 31, type: 'input', label: "Why do you actually want to change?", placeholder: "Because...", field: "the_why" },
    { id: 32, type: 'voice', label: "Tell me your why.", subtext: "Speak clearly - I'll play this back when you're slipping.", field: "why_recording" },

    // ========================================================================
    // ACT 5: PRIORITY
    // ========================================================================
    { id: 33, type: 'act_header', act: 5, actTitle: "Main Focus", actSubtitle: "If you could only fix one" },
    
    // This will be dynamically updated based on selected pillars
    { id: 34, type: 'choice', label: "Which one would change everything else?", field: "primary_pillar", choices: [] },

    // ========================================================================
    // ACT 6: PATTERNS
    // ========================================================================
    { id: 35, type: 'act_header', act: 6, actTitle: "Your Patterns", actSubtitle: "Know your enemy" },
    
    { id: 36, type: 'choice', label: "When do you usually give up?", field: "quit_pattern", choices: [
        "Day 1-3 - never really start",
        "First week - excitement wears off",
        "First month - life gets busy",
        "Right before I actually make it"
    ]},
    { id: 37, type: 'choice', label: "What excuse do you always use?", field: "favorite_excuse", choices: [
        "I'm too tired",
        "I don't have time",
        "I'll start tomorrow",
        "Something came up",
        "I'm not ready yet"
    ]},
    { id: 38, type: 'multiselect', label: "Who have you let down by quitting?", field: "who_disappointed", choices: [
        "Myself",
        "My family",
        "My partner",
        "My friends",
        "Everyone who believed in me"
    ]},
    { id: 39, type: 'input', label: "If you don't change, where will you be in 5 years?", placeholder: "Be real with yourself...", field: "dark_future" },

    // ========================================================================
    // ACT 7: COMMITMENT
    // ========================================================================
    { id: 40, type: 'act_header', act: 7, actTitle: "Lock It In", actSubtitle: "No going back" },
    
    { id: 41, type: 'commentary', lines: [
        "I'm gonna call you every day.",
        "Not to nag. To remind you who you're becoming."
    ]},
    { id: 42, type: 'time', label: "What time works best?", subtext: "When are you most real with yourself?", field: "call_time" },
    { id: 43, type: 'voice', label: "Make your promise.", subtext: "Speak clearly - this is what you'll hear when you want to quit.", field: "pledge_recording" },

    // ========================================================================
    // FINAL
    // ========================================================================
    { id: 44, type: 'commentary', lines: [
        "Got everything I need.",
        "Let's do this."
    ]},
    { id: 45, type: 'card', label: "Your Commitment" },
    { id: 46, type: 'finalLoader' }
];

// ============================================================================
// FIELD MAPPING - Maps onboarding fields to database columns
// ============================================================================
export const FIELD_MAPPING = {
    // User
    name: 'users.name',
    
    // Future Self core
    times_tried: 'NOT_STORED', // Collected but not saved to DB
    core_identity: 'future_self.core_identity',
    primary_pillar: 'future_self.primary_pillar',
    the_why: 'future_self.the_why',
    dark_future: 'future_self.dark_future',
    quit_pattern: 'future_self.quit_pattern',
    favorite_excuse: 'future_self.favorite_excuse',
    who_disappointed: 'future_self.who_disappointed',
    
    // Voice recordings
    future_self_intro_recording: 'future_self.future_self_intro_url',
    why_recording: 'future_self.why_recording_url',
    pledge_recording: 'future_self.pledge_recording_url',
    
    // Call settings
    call_time: 'users.call_time',
    
    // Dynamic pillars - stored as array of pillar IDs
    selected_pillars: 'future_self.selected_pillars',
    
    // Pillar data is stored dynamically based on selected pillars
    // Each pillar gets: {pillar_id}_current, {pillar_id}_goal, {pillar_id}_future, {pillar_id}_identity
    // These map to: future_self_pillars.{pillar}.current_state, non_negotiable, future_state, identity_statement
};

// ============================================================================
// ACTS - For progress indicator
// ============================================================================
export const ACTS = [
    { id: 1, title: "Wake Up" },
    { id: 2, title: "Future You" },
    { id: 3, title: "Your Focus" },
    { id: 4, title: "Your Why" },
    { id: 5, title: "Main Focus" },
    { id: 6, title: "Patterns" },
    { id: 7, title: "Lock It In" },
];
