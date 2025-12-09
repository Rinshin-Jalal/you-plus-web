// ============================================================================
// PILLAR PRESETS - Dynamic pillar selection system
// ============================================================================
// Target audience: Males 16-30
// Language: Direct, no-BS, slightly edgy but not cringe
// Focus: What young men actually struggle with and want to improve
// ============================================================================

export const MIN_PILLARS = 1;
export const MAX_PILLARS = 5;

export interface PillarPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: 'body' | 'mind' | 'money' | 'game' | 'lifestyle';
  currentStateOptions: string[];
  goalPrompt: string;
  futurePrompt: string;
}

// Generic options for custom pillars
export const GENERIC_CURRENT_STATE_OPTIONS = [
  "It's cooked honestly",
  "Mid at best",
  "Not terrible but not good",
  "Decent, ready to level up"
];

export const GENERIC_GOAL_PROMPT = "What's the goal?";
export const GENERIC_FUTURE_PROMPT = "When you've made it, what does it look like?";

/**
 * Available pillar presets that users can choose from during onboarding
 * Written to appeal to males 16-30
 */
export const PILLAR_PRESETS: PillarPreset[] = [
  // ============================================================================
  // BODY - Physical transformation
  // ============================================================================
  {
    id: 'gym',
    label: 'Gym',
    icon: '🏋️',
    description: 'Get jacked, build muscle, look better',
    category: 'body',
    currentStateOptions: [
      "Skinny fat or just skinny",
      "Used to lift, fell off hard",
      "Go sometimes but no real progress",
      "Consistent but want better results"
    ],
    goalPrompt: "What's the physique goal?",
    futurePrompt: "When you've built the body you want, how does life change?"
  },
  {
    id: 'fighting',
    label: 'Fighting',
    icon: '🥊',
    description: 'MMA, boxing, BJJ, martial arts',
    category: 'body',
    currentStateOptions: [
      "Never trained, would get destroyed",
      "Did a few classes, didn't stick",
      "Train but inconsistent",
      "Training regularly, want to compete"
    ],
    goalPrompt: "What martial art or combat sport?",
    futurePrompt: "When you can handle yourself, what's different?"
  },
  {
    id: 'diet',
    label: 'Diet',
    icon: '🍗',
    description: 'Eat clean, hit macros, stop eating garbage',
    category: 'body',
    currentStateOptions: [
      "Uber Eats and energy drinks",
      "Try to eat clean, last 2 days max",
      "Okay during the week, weekends wreck it",
      "Pretty dialed, want to optimize"
    ],
    goalPrompt: "What's the nutrition goal?",
    futurePrompt: "When your diet is locked in, how do you feel?"
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: '💤',
    description: 'Stop doomscrolling at 3am, wake up early',
    category: 'body',
    currentStateOptions: [
      "Phone till 4am, dead all day",
      "Sleep schedule is random as hell",
      "Get some sleep but always tired",
      "Decent, want to optimize for energy"
    ],
    goalPrompt: "What time you trying to wake up?",
    futurePrompt: "When you wake up with energy every day, what changes?"
  },
  {
    id: 'running',
    label: 'Cardio',
    icon: '🏃',
    description: 'Running, swimming, endurance, not dying after stairs',
    category: 'body',
    currentStateOptions: [
      "Get winded walking upstairs",
      "Hate cardio, avoid it completely",
      "Do some but hate every second",
      "Cardio is decent, want to push it"
    ],
    goalPrompt: "What's the cardio goal?",
    futurePrompt: "When your endurance is elite, what can you do?"
  },

  // ============================================================================
  // MIND - Mental game
  // ============================================================================
  {
    id: 'focus',
    label: 'Focus',
    icon: '🎯',
    description: 'Stop getting distracted, deep work, lock in',
    category: 'mind',
    currentStateOptions: [
      "Can't focus for 5 minutes without checking phone",
      "Start tasks, get sidetracked instantly",
      "Focus in bursts but burn out",
      "Pretty focused, want laser mode"
    ],
    goalPrompt: "What do you need to focus on?",
    futurePrompt: "When you can lock in for hours, what do you build?"
  },
  {
    id: 'discipline',
    label: 'Discipline',
    icon: '⚔️',
    description: 'Do what you say, stop being soft',
    category: 'mind',
    currentStateOptions: [
      "Zero discipline, always take the easy path",
      "Motivated for a day then back to old ways",
      "Disciplined sometimes, inconsistent",
      "Pretty disciplined, want to be unbreakable"
    ],
    goalPrompt: "What requires more discipline?",
    futurePrompt: "When discipline is automatic, who do you become?"
  },
  {
    id: 'confidence',
    label: 'Confidence',
    icon: '👑',
    description: 'Stop second-guessing, back yourself',
    category: 'mind',
    currentStateOptions: [
      "Barely speak up, doubt everything I do",
      "Confident online, different irl",
      "Confident in some areas, not others",
      "Pretty confident, want unshakeable"
    ],
    goalPrompt: "Where do you want more confidence?",
    futurePrompt: "When you fully back yourself, how do you move?"
  },
  {
    id: 'anxiety',
    label: 'Anxiety',
    icon: '🧠',
    description: 'Stop overthinking, calm the mental noise',
    category: 'mind',
    currentStateOptions: [
      "Anxious about everything, brain never stops",
      "Overthink every decision and conversation",
      "Manageable but still gets me sometimes",
      "Mostly good, want full control"
    ],
    goalPrompt: "What triggers the anxiety most?",
    futurePrompt: "When your mind is calm, how do you show up?"
  },
  {
    id: 'addiction',
    label: 'Addiction',
    icon: '🔓',
    description: 'Porn, gaming, social media, substances - break free',
    category: 'mind',
    currentStateOptions: [
      "Addicted and it's ruining my life",
      "Know it's a problem, can't stop",
      "Trying to quit, keep relapsing",
      "Mostly clean, preventing relapse"
    ],
    goalPrompt: "What are you trying to quit?",
    futurePrompt: "When you're free from it, what do you get back?"
  },

  // ============================================================================
  // MONEY - Financial game
  // ============================================================================
  {
    id: 'income',
    label: 'Income',
    icon: '💵',
    description: 'Make more money, level up earnings',
    category: 'money',
    currentStateOptions: [
      "Broke or barely scraping by",
      "Make some but it's never enough",
      "Decent income, want way more",
      "Good money, want to scale"
    ],
    goalPrompt: "What's the income goal?",
    futurePrompt: "When you're making real money, what's life like?"
  },
  {
    id: 'business',
    label: 'Business',
    icon: '🚀',
    description: 'Start something, stop working for someone else',
    category: 'money',
    currentStateOptions: [
      "Want to start but no idea where to begin",
      "Have ideas but never execute",
      "Side hustle but not making real money",
      "Business running, want to scale"
    ],
    goalPrompt: "What kind of business?",
    futurePrompt: "When your business is thriving, what does your day look like?"
  },
  {
    id: 'investing',
    label: 'Investing',
    icon: '📈',
    description: 'Stocks, crypto, real estate - make money work',
    category: 'money',
    currentStateOptions: [
      "No investments, don't know where to start",
      "Threw money at stuff, lost it",
      "Some investments, no real strategy",
      "Investing regularly, want to optimize"
    ],
    goalPrompt: "What do you want to invest in?",
    futurePrompt: "When your portfolio is stacked, what's possible?"
  },
  {
    id: 'career',
    label: 'Career',
    icon: '💼',
    description: 'Get promoted, switch jobs, level up professionally',
    category: 'money',
    currentStateOptions: [
      "Dead-end job or unemployed",
      "Job is mid, going nowhere",
      "Decent job, want something better",
      "Good position, want to climb faster"
    ],
    goalPrompt: "What's the career goal?",
    futurePrompt: "When you've made it professionally, where are you?"
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: '🛠️',
    description: 'Coding, design, marketing - learn high-value skills',
    category: 'money',
    currentStateOptions: [
      "No valuable skills honestly",
      "Started learning, never finished anything",
      "Know some stuff, not enough to monetize",
      "Have skills, want to master them"
    ],
    goalPrompt: "What skill do you want to learn?",
    futurePrompt: "When you've mastered this skill, what can you build?"
  },

  // ============================================================================
  // GAME - Social & dating
  // ============================================================================
  {
    id: 'dating',
    label: 'Dating',
    icon: '💘',
    description: 'Get better with women, stop being awkward',
    category: 'game',
    currentStateOptions: [
      "No game, barely talk to girls",
      "Match on apps but convos go nowhere",
      "Get dates but can't close",
      "Doing okay, want to level up"
    ],
    goalPrompt: "What's the dating goal?",
    futurePrompt: "When your dating life is handled, how do you feel?"
  },
  {
    id: 'social',
    label: 'Social Skills',
    icon: '🗣️',
    description: 'Network, make friends, stop being awkward in groups',
    category: 'game',
    currentStateOptions: [
      "Awkward af, hate social situations",
      "Fine 1-on-1, freeze in groups",
      "Can socialize but don't enjoy it",
      "Pretty social, want to be magnetic"
    ],
    goalPrompt: "What social situation do you want to master?",
    futurePrompt: "When you're naturally charismatic, what changes?"
  },
  {
    id: 'status',
    label: 'Status',
    icon: '🔝',
    description: 'Build reputation, become respected, be the guy',
    category: 'game',
    currentStateOptions: [
      "Nobody knows who I am",
      "Known but not respected",
      "Respected in some circles, not others",
      "Got status, want more influence"
    ],
    goalPrompt: "What do you want to be known for?",
    futurePrompt: "When you've built your reputation, who looks up to you?"
  },
  {
    id: 'style',
    label: 'Style',
    icon: '👔',
    description: 'Dress better, grooming, first impressions',
    category: 'game',
    currentStateOptions: [
      "Wear the same 3 outfits on repeat",
      "Know I dress bad, don't know what to do",
      "Okay style, nothing stands out",
      "Dress well, want to be iconic"
    ],
    goalPrompt: "What's the style you're going for?",
    futurePrompt: "When your style is dialed in, how do people see you?"
  },

  // ============================================================================
  // LIFESTYLE - How you live
  // ============================================================================
  {
    id: 'nofap',
    label: 'NoFap',
    icon: '🔥',
    description: 'Quit porn, retain energy, rewire your brain',
    category: 'lifestyle',
    currentStateOptions: [
      "Daily habit, can't go a day without",
      "Try to quit, never make it past a week",
      "Some streaks but always relapse",
      "Long streak, want to make it permanent"
    ],
    goalPrompt: "What's your goal streak?",
    futurePrompt: "When you're fully rewired, what changes?"
  },
  {
    id: 'dopamine',
    label: 'Dopamine Detox',
    icon: '📵',
    description: 'Less phone, less gaming, less instant gratification',
    category: 'lifestyle',
    currentStateOptions: [
      "Screen time is embarrassing",
      "Phone is first thing I check, last thing at night",
      "Cut back some, still too much",
      "Pretty controlled, want full control"
    ],
    goalPrompt: "What do you need to cut out?",
    futurePrompt: "When you're not a slave to screens, what do you do instead?"
  },
  {
    id: 'morning',
    label: 'Morning Routine',
    icon: '🌅',
    description: 'Stop waking up at noon, own your mornings',
    category: 'lifestyle',
    currentStateOptions: [
      "Wake up, scroll, already behind",
      "No routine, every morning is chaos",
      "Have a routine, don't follow it",
      "Pretty good mornings, want them locked"
    ],
    goalPrompt: "What does your ideal morning look like?",
    futurePrompt: "When you win every morning, how does the day go?"
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: '📚',
    description: 'Read more books, less Twitter threads',
    category: 'lifestyle',
    currentStateOptions: [
      "Haven't finished a book in years",
      "Buy books, never read them",
      "Read sometimes, not consistently",
      "Read regularly, want to read more"
    ],
    goalPrompt: "How many books per month?",
    futurePrompt: "When reading is a habit, what knowledge do you have?"
  },
  {
    id: 'journaling',
    label: 'Journaling',
    icon: '📝',
    description: 'Get thoughts out of your head, think clearer',
    category: 'lifestyle',
    currentStateOptions: [
      "Never journaled in my life",
      "Tried it, felt weird, stopped",
      "Journal sometimes when stressed",
      "Journal regularly, want to go deeper"
    ],
    goalPrompt: "What do you want journaling to do for you?",
    futurePrompt: "When journaling is automatic, how clear is your mind?"
  },
  {
    id: 'meditation',
    label: 'Meditation',
    icon: '🧘',
    description: 'Calm mind, less reactive, more present',
    category: 'lifestyle',
    currentStateOptions: [
      "Can't sit still for 30 seconds",
      "Tried apps, never stuck with it",
      "Meditate sometimes, hard to be consistent",
      "Regular practice, want to go deeper"
    ],
    goalPrompt: "What do you want meditation to give you?",
    futurePrompt: "When you can control your mind, what's different?"
  },
  {
    id: 'cold_showers',
    label: 'Cold Showers',
    icon: '🥶',
    description: 'Build mental toughness, start hard',
    category: 'lifestyle',
    currentStateOptions: [
      "Never, sounds terrible",
      "Tried once, never again",
      "Sometimes, when I remember",
      "Regular, want to make it daily"
    ],
    goalPrompt: "How long can you go?",
    futurePrompt: "When cold doesn't faze you, what else becomes easy?"
  },
];

/**
 * Get a pillar preset by its ID
 */
export function getPillarById(id: string): PillarPreset | undefined {
  return PILLAR_PRESETS.find((preset) => preset.id === id);
}

/**
 * Get all presets in a specific category
 */
export function getPillarsByCategory(category: PillarPreset['category']): PillarPreset[] {
  return PILLAR_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): PillarPreset['category'][] {
  return ['body', 'mind', 'money', 'game', 'lifestyle'];
}

/**
 * Create a custom pillar with generic options
 */
export function createCustomPillar(customId: string): PillarPreset {
  const label = customId.replace('custom_', '').replace(/_/g, ' ');
  return {
    id: customId,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    icon: '🎯',
    description: 'Your custom focus area',
    category: 'lifestyle',
    currentStateOptions: GENERIC_CURRENT_STATE_OPTIONS,
    goalPrompt: GENERIC_GOAL_PROMPT,
    futurePrompt: GENERIC_FUTURE_PROMPT,
  };
}
