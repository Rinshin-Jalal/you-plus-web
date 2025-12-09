// ============================================================================
// ACT THEMES - Simple black/white theme for onboarding
// ============================================================================

export interface ActTheme {
  id: number;
  name: string;
  bgGradient: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
  border: string;
  progressColor: string;
}

// Single black/white theme used across all acts
const DEFAULT_THEME: ActTheme = {
  id: 1,
  name: "Default",
  bgGradient: "bg-white",
  accent: "text-black",
  textPrimary: "text-black",
  textSecondary: "text-black/40",
  buttonBg: "bg-black",
  buttonText: "text-white",
  buttonHover: "hover:bg-black/80",
  border: "border-black/10",
  progressColor: "#000000",
};

export const ACT_THEMES: Record<number, ActTheme> = {
  1: DEFAULT_THEME,
  2: DEFAULT_THEME,
  3: DEFAULT_THEME,
  4: DEFAULT_THEME,
  5: DEFAULT_THEME,
  6: DEFAULT_THEME,
  7: DEFAULT_THEME,
};

// Get theme for current step (always returns default black/white)
export const getThemeForStep = (_step: { act?: number }): ActTheme => {
  return DEFAULT_THEME;
};
