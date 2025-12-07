// ============================================================================
// DYNAMIC PILLAR PRESETS
// ============================================================================
// Users select 2-5 pillars that matter to THEM.
// No more one-size-fits-all Body/Mission/Stack/Tribe.
// ============================================================================

export interface PillarPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  // Dynamic current state options for this pillar
  currentStateOptions: string[];
  // Question prompts (only 2 now - goal and future)
  goalPrompt: string;
  futurePrompt: string;
}

// ============================================================================
// PRESET PILLARS - Covering students, professionals, parents, creators, etc.
// ============================================================================
export const PILLAR_PRESETS: PillarPreset[] = [
  // --- HEALTH & BODY ---
  {
    id: 'health',
    label: 'Health & Fitness',
    icon: '💪',
    description: 'Body, energy, sleep, nutrition',
    currentStateOptions: [
      "Honestly pretty bad",
      "Up and down, not consistent",
      "Okay but could be better",
      "Pretty good, just need to keep it up"
    ],
    goalPrompt: "What's your health goal?",
    futurePrompt: "When you win, what does your body look like?",
  },
  {
    id: 'mental_health',
    label: 'Mental Health',
    icon: '🧠',
    description: 'Stress, anxiety, peace of mind',
    currentStateOptions: [
      "Struggling - anxiety/stress is high",
      "Up and down - good days and bad days",
      "Managing okay but want more peace",
      "Pretty stable, just maintaining"
    ],
    goalPrompt: "What does mental peace look like for you?",
    futurePrompt: "When you win, how does your mind feel?",
  },

  // --- CAREER & WORK ---
  {
    id: 'career',
    label: 'Career & Work',
    icon: '💼',
    description: 'Job, promotions, professional growth',
    currentStateOptions: [
      "Lost - no idea what I'm doing",
      "Stuck - know what to do but not doing it",
      "Making progress but could be faster",
      "Going well, just need accountability"
    ],
    goalPrompt: "What's your career goal?",
    futurePrompt: "When you win, what does your career look like?",
  },
  {
    id: 'business',
    label: 'Business',
    icon: '🚀',
    description: 'Starting, growing, or scaling',
    currentStateOptions: [
      "Just an idea - haven't started",
      "Started but struggling to grow",
      "Growing but hitting plateaus",
      "Scaling - need to stay focused"
    ],
    goalPrompt: "What's your business goal?",
    futurePrompt: "When you win, what does your business look like?",
  },
  {
    id: 'side_project',
    label: 'Side Project',
    icon: '🛠️',
    description: 'Building something on the side',
    currentStateOptions: [
      "Haven't started yet",
      "Started but keep abandoning it",
      "Working on it but slowly",
      "Making progress, need consistency"
    ],
    goalPrompt: "What do you want to build?",
    futurePrompt: "When you win, what have you shipped?",
  },

  // --- EDUCATION & LEARNING ---
  {
    id: 'academics',
    label: 'Academics',
    icon: '📚',
    description: 'School, exams, GPA',
    currentStateOptions: [
      "Failing or close to it",
      "Passing but underperforming",
      "Doing okay, want to do better",
      "Doing well, want to stay on top"
    ],
    goalPrompt: "What's your academic goal?",
    futurePrompt: "When you win, what do your grades look like?",
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: '🎓',
    description: 'New skills, courses, self-education',
    currentStateOptions: [
      "Not learning anything new",
      "Starting courses but never finishing",
      "Learning but not applying",
      "Learning consistently, want more depth"
    ],
    goalPrompt: "What skill do you want to master?",
    futurePrompt: "When you win, what can you do?",
  },

  // --- MONEY & FINANCES ---
  {
    id: 'finances',
    label: 'Finances',
    icon: '💰',
    description: 'Savings, debt, investments',
    currentStateOptions: [
      "Broke - always stressed about money",
      "Getting by - bills paid but nothing saved",
      "Building - starting to save",
      "Solid - just need to stay on track"
    ],
    goalPrompt: "What's your financial goal?",
    futurePrompt: "When you win, what do your finances look like?",
  },

  // --- RELATIONSHIPS ---
  {
    id: 'relationships',
    label: 'Relationships',
    icon: '❤️',
    description: 'Partner, dating, love life',
    currentStateOptions: [
      "Single and struggling",
      "Dating but nothing serious",
      "In a relationship but it needs work",
      "Good relationship, want to deepen it"
    ],
    goalPrompt: "What do you want in your love life?",
    futurePrompt: "When you win, what does your relationship look like?",
  },
  {
    id: 'family',
    label: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Parents, kids, siblings',
    currentStateOptions: [
      "Distant - barely talk",
      "Strained - tension and conflict",
      "Okay but could be closer",
      "Good, want to stay present"
    ],
    goalPrompt: "What do you want with your family?",
    futurePrompt: "When you win, what does your family life look like?",
  },
  {
    id: 'social',
    label: 'Social',
    icon: '👥',
    description: 'Friendships, social life',
    currentStateOptions: [
      "Isolated - no real friends",
      "Have friends but feel disconnected",
      "Decent social life, want more depth",
      "Good circle, want to maintain it"
    ],
    goalPrompt: "What do you want in your friendships?",
    futurePrompt: "When you win, what does your social life look like?",
  },

  // --- CREATIVITY & EXPRESSION ---
  {
    id: 'creativity',
    label: 'Creativity',
    icon: '🎨',
    description: 'Art, music, writing',
    currentStateOptions: [
      "Not creating anything",
      "Want to create but never start",
      "Creating sometimes, not consistent",
      "Creating regularly, want to level up"
    ],
    goalPrompt: "What do you want to create?",
    futurePrompt: "When you win, what have you made?",
  },
  {
    id: 'content',
    label: 'Content Creation',
    icon: '📱',
    description: 'YouTube, TikTok, podcasts',
    currentStateOptions: [
      "Haven't posted anything",
      "Posted a few times, gave up",
      "Posting but not growing",
      "Growing, need to stay consistent"
    ],
    goalPrompt: "What's your content goal?",
    futurePrompt: "When you win, what does your platform look like?",
  },

  // --- HABITS & LIFESTYLE ---
  {
    id: 'habits',
    label: 'Habits',
    icon: '⏰',
    description: 'Daily routines, consistency',
    currentStateOptions: [
      "No routine - chaos every day",
      "Try routines but always break them",
      "Some habits, not fully consistent",
      "Good habits, want to optimize"
    ],
    goalPrompt: "What habit do you want to build?",
    futurePrompt: "When you win, what does your daily routine look like?",
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: '🎯',
    description: 'Getting things done, focus',
    currentStateOptions: [
      "Constantly distracted",
      "Productive in bursts, then crash",
      "Getting things done but slowly",
      "Productive, want peak performance"
    ],
    goalPrompt: "What does peak productivity look like?",
    futurePrompt: "When you win, how do you spend your days?",
  },
  {
    id: 'addiction',
    label: 'Beating Addiction',
    icon: '🚫',
    description: 'Quitting bad habits',
    currentStateOptions: [
      "Deep in it - can't stop",
      "Trying to quit, keep relapsing",
      "Making progress, still struggling",
      "Mostly free, need to stay clean"
    ],
    goalPrompt: "What does freedom look like?",
    futurePrompt: "When you win, how do you feel?",
  },

  // --- SPIRITUALITY & PURPOSE ---
  {
    id: 'spirituality',
    label: 'Spirituality',
    icon: '🙏',
    description: 'Religion, meditation, inner peace',
    currentStateOptions: [
      "Disconnected - no practice",
      "Interested but not practicing",
      "Practicing sometimes",
      "Regular practice, want to go deeper"
    ],
    goalPrompt: "What do you want spiritually?",
    futurePrompt: "When you win, what does your spiritual life look like?",
  },
  {
    id: 'purpose',
    label: 'Life Purpose',
    icon: '✨',
    description: 'Finding meaning, mission',
    currentStateOptions: [
      "No idea what my purpose is",
      "Have ideas but not clear",
      "Know my purpose, not living it",
      "Living it, want to go deeper"
    ],
    goalPrompt: "What do you want to figure out?",
    futurePrompt: "When you win, what is your purpose?",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getPillarById = (id: string): PillarPreset | undefined => {
  return PILLAR_PRESETS.find(p => p.id === id);
};

export const getPillarsByIds = (ids: string[]): PillarPreset[] => {
  return ids.map(id => getPillarById(id)).filter(Boolean) as PillarPreset[];
};

// Min/max pillars user can select
export const MIN_PILLARS = 2;
export const MAX_PILLARS = 5;
