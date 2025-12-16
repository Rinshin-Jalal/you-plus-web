// ============================================================================
// ONBOARDING STEPS - 31 base steps + dynamic pillar questions
// ============================================================================
// 
// Step Types:
// - commentary: Text lines with dynamic content support
// - choice: Multiple choice selection
// - input: Text input field
// - slider: Numeric slider
// - voice: Voice recording
// - time: Time picker
// - pillar_selection: Pillar selection component
// - pillar_primary: Choose primary pillar from selected
// - pillar_questions: Dynamic pillar questions (3 per pillar)
// - card: Commitment card display
// - auth: Sign up / Sign in
//
// ============================================================================

const isDev = process.env.NODE_ENV === 'development';

export type StepType =
  | 'commentary'
  | 'choice'
  | 'input'
  | 'slider'
  | 'voice'
  | 'time'
  | 'pillar_selection'
  | 'pillar_primary'
  | 'pillar_questions'
  | 'voice_preference'
  | 'voice_selection'
  | 'card'
  | 'auth';

export interface OnboardingStep {
  id: string | number;
  type: StepType;
  // Static content
  lines?: string[];
  label?: string;
  subtext?: string;
  placeholder?: string;
  choices?: string[];
  min?: number;
  max?: number;
  // Dynamic content - function that returns lines based on user data
  dynamicLines?: (data: Record<string, string | number | string[]>) => string[];
}

// ============================================================================
// DYNAMIC COMMENTARY HELPERS
// ============================================================================

/**
 * Format pillars list for display
 * e.g., ["health", "finances"] -> "health and finances"
 * e.g., ["health", "finances", "career"] -> "health, finances, and career"
 */
function formatPillars(pillars: string[] = []): string {
  if (pillars.length === 0) return 'your goals';
  if (pillars.length === 1) return pillars[0].replace(/_/g, ' ');
  if (pillars.length === 2) return `${pillars[0].replace(/_/g, ' ')} and ${pillars[1].replace(/_/g, ' ')}`;
  const last = pillars[pillars.length - 1].replace(/_/g, ' ');
  const rest = pillars.slice(0, -1).map(p => p.replace(/_/g, ' ')).join(', ');
  return `${rest}, and ${last}`;
}

/**
 * Get commentary based on change attempts
 */
function getHookResponse(attempts: string): string[] {
  switch (attempts) {
    case '1-2':
      return ["Just getting started.", "Good. Less baggage to carry."];
    case '3-5':
      return ["A few tries.", "Most people stop there. You didn't."];
    case '6-10':
      return ["You keep coming back.", "That's not weakness. That's hunger."];
    case 'I lost count':
      return ["Yeah. I figured.", "But you're still here. That says something."];
    default:
      return ["Interesting.", "Let's make this time different."];
  }
}

/**
 * Get commentary based on belief score
 */
function getBeliefResponse(score: number, name: string): string[] {
  if (score <= 3) {
    return [
      `${name}, your belief is at ${score}.`,
      "That's brutally honest.",
      "Belief grows with action. One day at a time."
    ];
  } else if (score <= 5) {
    return [
      `Belief at ${score}.`,
      "Not fully sold on yourself yet.",
      "That's okay. We'll build it together."
    ];
  } else if (score <= 7) {
    return [
      `${score} out of 10.`,
      "You see a path.",
      "Now let's walk it."
    ];
  } else {
    return [
      `Belief at ${score}. Strong.`,
      "Now prove it wasn't just talk."
    ];
  }
}

// ============================================================================
// STEPS DEFINITION
// ============================================================================

export const STEPS: OnboardingStep[] = [
  // ==========================================================================
  // ACT 1: THE HOOK (Steps 1-3)
  // ==========================================================================
  {
    id: 1,
    type: 'commentary',
    lines: [
      "Hey.",
      "It's me.",
      "You.",
      "From the future."
    ]
  },
  {
    id: 2,
    type: 'choice',
    label: "How many times have you tried to change something about yourself?",
    choices: ["1-2", "3-5", "6-10", "I lost count"]
  },
  {
    id: 3,
    type: 'commentary',
    dynamicLines: (data) => getHookResponse(String(data['change_attempts'] || ''))
  },

  // ==========================================================================
  // ACT 2: IDENTITY (Steps 4-6)
  // ==========================================================================
  {
    id: 4,
    type: 'input',
    label: "What's your name?",
    placeholder: "Your name"
  },
  {
    id: 5,
    type: 'slider',
    label: "How old are you?",
    min: 16,
    max: 99
  },
  {
    id: 6,
    type: 'choice',
    label: "Gender?",
    choices: ["Male", "Female", "Don't specify"]
  },

  // ==========================================================================
  // ACT 3: THE PILLARS (Steps 7-9)
  // ==========================================================================
  {
    id: 7,
    type: 'commentary',
    dynamicLines: (data) => {
      const name = String(data['name'] || 'friend');
      return [
        `Good to meet you, ${name}.`,
        "Life isn't one battle.",
        "It's many.",
        "Pick yours."
      ];
    }
  },
  {
    id: 8,
    type: 'pillar_selection'
  },
  {
    id: 9,
    type: 'pillar_primary',
    label: "Which one matters MOST right now?"
  },

  // ==========================================================================
  // ACT 4: PILLAR QUESTIONS (Dynamic - inserted after step 9)
  // This is a placeholder - actual questions are generated dynamically
  // ==========================================================================
  {
    id: 'pillar_questions',
    type: 'pillar_questions'
  },

  // ==========================================================================
  // ACT 5: THE PATTERN (Steps 10-15)
  // ==========================================================================
  {
    id: 10,
    type: 'commentary',
    dynamicLines: (data) => {
      const pillars = (Array.isArray(data['selected_pillars']) ? data['selected_pillars'] : []) as string[];
      return [
        `So you want to fix your ${formatPillars(pillars)}.`,
        "Let's see why it hasn't worked before."
      ];
    }
  },
  {
    id: 11,
    type: 'choice',
    label: "What usually happens when you try to change?",
    choices: [
      "I slowly drift away",
      "I crash and burn",
      "I just stop one day",
      "I never really start"
    ]
  },
  {
    id: 12,
    type: 'slider',
    label: "How many times have you tried this exact thing before?",
    min: 0,
    max: 20
  },
  {
    id: 13,
    type: 'choice',
    label: "When do you usually give up?",
    choices: [
      "Day 1-3",
      "First week",
      "First month",
      "Right before I win"
    ]
  },
  {
    id: 14,
    type: 'choice',
    label: "What's your go-to excuse?",
    choices: [
      "I'll start tomorrow",
      "Too tired today",
      "Not ready yet",
      "Something came up"
    ]
  },
  {
    id: 15,
    type: 'commentary',
    dynamicLines: (data) => {
      const name = String(data['name'] || '');
      const quitPattern = String(data['quit_pattern'] || 'early');
      const excuse = String(data['favorite_excuse'] || 'excuses');
      return [
        `You quit at "${quitPattern}".`,
        `Your excuse is always "${excuse}".`,
        name ? `I see you, ${name}.` : "I see you."
      ];
    }
  },

  // ==========================================================================
  // ACT 6: THE STAKES (Steps 16-19)
  // ==========================================================================
  {
    id: 16,
    type: 'choice',
    label: "When you failed before, who did you let down?",
    choices: [
      "Myself",
      "My family",
      "My partner",
      "Everyone who believed in me"
    ]
  },
  {
    id: 17,
    type: 'choice',
    label: "What scares you more?",
    choices: [
      "Failing publicly",
      "Actually succeeding",
      "Dying with regret",
      "Staying exactly the same"
    ]
  },
  {
    id: 18,
    type: 'input',
    label: "What's a fear you don't talk about?",
    placeholder: "Be honest with yourself"
  },
  {
    id: 19,
    type: 'input',
    label: "If nothing changes, where will you be in 5 years?",
    placeholder: "Paint the dark picture"
  },

  // ==========================================================================
  // ACT 7: THE WHY (Steps 20-22)
  // ==========================================================================
  {
    id: 20,
    type: 'input',
    label: "Complete this: I am becoming...",
    placeholder: "I am becoming..."
  },
  {
    id: 21,
    type: 'commentary',
    dynamicLines: (data) => {
      const identity = String(data['core_identity'] || 'someone new');
      return [
        `"${identity}"`,
        "That's who you're becoming.",
        "Now tell me why."
      ];
    }
  },
  {
    id: 22,
    type: 'voice',
    label: "Why does this matter to you?",
    subtext: "Speak from your heart. I'm listening."
  },

  // ==========================================================================
  // ACT 8: THE SYSTEM (Steps 23-25)
  // ==========================================================================
  {
    id: 23,
    type: 'time',
    label: "What time should I check in with you?"
  },
  {
    id: 24,
    type: 'choice',
    label: "Can I interrupt your day to hold you accountable?",
    choices: [
      "Yes, hold me accountable",
      "No, I'll check in myself"
    ]
  },
  {
    id: 25,
    type: 'slider',
    label: "How many strikes before I get ruthless?",
    min: 1,
    max: 5
  },

  // ==========================================================================
  // ACT 9: THE PLEDGE (Steps 26-28)
  // ==========================================================================
  {
    id: 26,
    type: 'slider',
    label: "Right now, how much do you believe you can do this?",
    min: 1,
    max: 10
  },
  {
    id: 27,
    type: 'commentary',
    dynamicLines: (data) => {
      const score = data['belief_score'] || 5;
      const name = String(data['name'] || '');
      return getBeliefResponse(Number(score), name);
    }
  },
  {
    id: 28,
    type: 'voice',
    label: "Make your pledge.",
    subtext: "Promise yourself. Out loud. I'm recording this."
  },

  // ==========================================================================
  // ACT 10: VOICE PREFERENCE (Steps 29-30)
  // After all recordings are done, ask how they want their Future Self to sound
  // ==========================================================================
  {
    id: 29,
    type: 'voice_preference',
    label: "Your Future Self's Voice",
    subtext: "I'll be calling you as your Future Self. How should I sound?"
  },
  // Step 30: Voice Selection (shown ONLY if user chooses "Choose a Voice")
  // If user chose "Use My Voice", this step is skipped and voice is cloned from recordings
  {
    id: 30,
    type: 'voice_selection',
    label: "Choose Your Future Self's Voice",
    subtext: "Select the voice that resonates with you"
  },

  // ==========================================================================
  // ACT 11: SEAL THE DEAL (Steps 31-32)
  // ==========================================================================
  {
    id: 31,
    type: 'card',
    label: "Your Commitment"
  },
  {
    id: 32,
    type: 'auth',
    label: "Lock it in"
  }
];

// ============================================================================
// STEP ID TO FIELD NAME MAPPING
// Maps step IDs to database field names for saving
// ============================================================================

export const STEP_FIELD_MAP: Record<string | number, string> = {
  2: 'change_attempts',
  4: 'name',
  5: 'age',
  6: 'gender',
  8: 'selected_pillars',
  9: 'primary_pillar',
  11: 'failure_pattern',
  12: 'previous_attempts',
  13: 'quit_pattern',
  14: 'favorite_excuse',
  16: 'who_disappointed',
  17: 'primary_fear',
  18: 'hidden_fear',
  19: 'dark_future',
  20: 'core_identity',
  22: 'why_recording',  // Voice: why this matters (transcribed to the_why)
  23: 'call_time',
  24: 'allow_interruptions',
  25: 'strikes_allowed',
  26: 'belief_score',
  28: 'pledge_recording',  // Voice: the pledge
  29: 'voice_preference',  // Choice: "Use My Voice" or "Choose a Voice" (after all recordings)
  30: 'preset_voice_id',  // Selected preset voice ID - only if user chose "Choose a Voice"
};

/**
 * Get the field name for a step ID
 */
export function getFieldName(stepId: string | number): string {
  return STEP_FIELD_MAP[stepId] || String(stepId);
}

/**
 * Get base steps (excluding pillar_questions placeholder)
 */
export function getBaseSteps(): OnboardingStep[] {
  return STEPS.filter(s => s.type !== 'pillar_questions');
}

/**
 * Get steps before pillar questions
 */
export function getStepsBeforePillars(): OnboardingStep[] {
  const idx = STEPS.findIndex(s => s.type === 'pillar_questions');
  return STEPS.slice(0, idx);
}

/**
 * Get steps after pillar questions
 */
export function getStepsAfterPillars(): OnboardingStep[] {
  const idx = STEPS.findIndex(s => s.type === 'pillar_questions');
  return STEPS.slice(idx + 1);
}

/**
 * Check if onboarding is complete (all fields present)
 * Handles conditional fields based on voice_preference choice
 */
export function isOnboardingComplete(data: Record<string, unknown>): boolean {
  // Core required fields (always required)
  const coreRequiredFields = [
    'change_attempts',
    'name',
    'age',
    'gender',
    'selected_pillars',
    'primary_pillar',
    'failure_pattern',
    'previous_attempts',
    'quit_pattern',
    'favorite_excuse',
    'who_disappointed',
    'primary_fear',
    'hidden_fear',
    'dark_future',
    'core_identity',
    'why_recording',
    'call_time',
    'allow_interruptions',
    'strikes_allowed',
    'belief_score',
    'pledge_recording',
    'voice_preference',  // This determines which voice source is used
  ];

  // Check core required fields
  const missingCoreFields = coreRequiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingCoreFields.length > 0) {
    if (isDev) console.log('[OnboardingCheck] Missing core fields:', missingCoreFields);
    return false;
  }

  // Check conditional voice fields based on voice_preference
  const voicePreference = data['voice_preference'];
  
  // If user chose preset voice, they must have selected one
  if (voicePreference === 'preset') {
    if (!data['preset_voice_id']) {
      if (isDev) console.log('[OnboardingCheck] Missing preset_voice_id for preset voice selection');
      return false;
    }
  }
  // If user chose 'clone', we use the existing recordings (why_recording/pledge_recording)
  // No additional fields needed

  return true;
}
