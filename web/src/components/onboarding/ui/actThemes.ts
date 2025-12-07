// ============================================================================
// ACT THEMES - Color schemes and XP values for each act
// ============================================================================

export interface ActTheme {
  id: number;
  name: string;
  // Background gradient
  bgGradient: string;
  // Primary accent color
  accent: string;
  // Text colors
  textPrimary: string;
  textSecondary: string;
  // Button styles
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
  // Border color
  border: string;
  // Progress ring color
  progressColor: string;
  // XP reward for completing this act
  xpReward: number;
  // Celebration emoji
  emoji: string;
  // Level up message
  levelUpMessage: string;
}

export const ACT_THEMES: Record<number, ActTheme> = {
  1: {
    id: 1,
    name: "Wake Up",
    bgGradient: "bg-gradient-to-br from-gray-950 via-black to-gray-900",
    accent: "text-white",
    textPrimary: "text-white",
    textSecondary: "text-white/60",
    buttonBg: "bg-white",
    buttonText: "text-black",
    buttonHover: "hover:bg-white/90",
    border: "border-white/20",
    progressColor: "#ffffff",
    xpReward: 100,
    emoji: "⚡",
    levelUpMessage: "You're awake. Let's go deeper.",
  },
  2: {
    id: 2,
    name: "Future You",
    bgGradient: "bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900",
    accent: "text-blue-400",
    textPrimary: "text-white",
    textSecondary: "text-blue-200/60",
    buttonBg: "bg-blue-500",
    buttonText: "text-white",
    buttonHover: "hover:bg-blue-400",
    border: "border-blue-500/30",
    progressColor: "#60a5fa",
    xpReward: 150,
    emoji: "🔮",
    levelUpMessage: "Your future self is taking shape.",
  },
  3: {
    id: 3,
    name: "Your Focus",
    bgGradient: "bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950",
    accent: "text-emerald-400",
    textPrimary: "text-white",
    textSecondary: "text-emerald-200/60",
    buttonBg: "bg-emerald-500",
    buttonText: "text-white",
    buttonHover: "hover:bg-emerald-400",
    border: "border-emerald-500/30",
    progressColor: "#34d399",
    xpReward: 200,
    emoji: "🎯",
    levelUpMessage: "Focus locked. You know what matters.",
  },
  4: {
    id: 4,
    name: "Your Why",
    bgGradient: "bg-gradient-to-br from-amber-950 via-orange-950 to-yellow-950",
    accent: "text-amber-400",
    textPrimary: "text-white",
    textSecondary: "text-amber-200/60",
    buttonBg: "bg-amber-500",
    buttonText: "text-black",
    buttonHover: "hover:bg-amber-400",
    border: "border-amber-500/30",
    progressColor: "#fbbf24",
    xpReward: 175,
    emoji: "🔥",
    levelUpMessage: "Your fire is lit. Nothing can stop you.",
  },
  5: {
    id: 5,
    name: "Main Focus",
    bgGradient: "bg-gradient-to-br from-purple-950 via-violet-950 to-fuchsia-950",
    accent: "text-purple-400",
    textPrimary: "text-white",
    textSecondary: "text-purple-200/60",
    buttonBg: "bg-purple-500",
    buttonText: "text-white",
    buttonHover: "hover:bg-purple-400",
    border: "border-purple-500/30",
    progressColor: "#a855f7",
    xpReward: 150,
    emoji: "💎",
    levelUpMessage: "Crystal clear. One focus to rule them all.",
  },
  6: {
    id: 6,
    name: "Your Patterns",
    bgGradient: "bg-gradient-to-br from-red-950 via-rose-950 to-pink-950",
    accent: "text-red-400",
    textPrimary: "text-white",
    textSecondary: "text-red-200/60",
    buttonBg: "bg-red-500",
    buttonText: "text-white",
    buttonHover: "hover:bg-red-400",
    border: "border-red-500/30",
    progressColor: "#f87171",
    xpReward: 200,
    emoji: "👁️",
    levelUpMessage: "You see your demons now. They can't hide.",
  },
  7: {
    id: 7,
    name: "Lock It In",
    bgGradient: "bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900",
    accent: "text-yellow-300",
    textPrimary: "text-white",
    textSecondary: "text-yellow-200/70",
    buttonBg: "bg-gradient-to-r from-yellow-400 to-amber-500",
    buttonText: "text-black font-bold",
    buttonHover: "hover:from-yellow-300 hover:to-amber-400",
    border: "border-yellow-500/40",
    progressColor: "#facc15",
    xpReward: 300,
    emoji: "👑",
    levelUpMessage: "LOCKED IN. You're ready.",
  },
};

// XP thresholds for levels
export const XP_LEVELS = [
  { level: 1, minXp: 0, title: "Beginner", icon: "🌱" },
  { level: 2, minXp: 100, title: "Awakened", icon: "⚡" },
  { level: 3, minXp: 250, title: "Focused", icon: "🎯" },
  { level: 4, minXp: 450, title: "Driven", icon: "🔥" },
  { level: 5, minXp: 650, title: "Unstoppable", icon: "💪" },
  { level: 6, minXp: 850, title: "Transformed", icon: "🦋" },
  { level: 7, minXp: 1075, title: "Legendary", icon: "👑" },
];

export const getLevel = (xp: number) => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXp) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0];
};

export const getNextLevel = (xp: number) => {
  const currentLevel = getLevel(xp);
  const nextIndex = XP_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  return nextIndex < XP_LEVELS.length ? XP_LEVELS[nextIndex] : null;
};

export const getXpProgress = (xp: number) => {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const xpInLevel = xp - current.minXp;
  const xpNeeded = next.minXp - current.minXp;
  return Math.round((xpInLevel / xpNeeded) * 100);
};

// Get theme for current step
export const getThemeForStep = (step: { act?: number }): ActTheme => {
  const actId = step.act || 1;
  return ACT_THEMES[actId] || ACT_THEMES[1];
};

// XP rewards for different actions
export const XP_ACTIONS = {
  COMPLETE_STEP: 15,
  COMPLETE_INPUT: 20,
  COMPLETE_VOICE: 50,
  COMPLETE_CHOICE: 15,
  COMPLETE_PILLAR: 30,
  FAST_ANSWER: 10, // Bonus for answering within 5 seconds
  STREAK_BONUS: 5, // Per step in streak
};
