// ============================================================================
// Gamification Services Index
// ============================================================================

export { XPEngine, createXPEngine } from './xp-engine';
export type { AwardXPParams } from './xp-engine';

export { AchievementChecker, createAchievementChecker } from './achievement-checker';
export type { AchievementUnlock } from './achievement-checker';

export * from './level-calculator';

// Mood calculation with pillar health and abandonment logic
export {
  calculateMood,
  calculateAbandonmentState,
  getPillarHealth,
  getDaysAbsent,
  calculateEnergyDecay,
  calculateEnergyRestore,
  MOOD_THRESHOLDS,
  ENERGY_CONFIG,
} from './mood-calculator';
export type { PillarHealth, MoodContext, AbandonmentState } from './mood-calculator';
