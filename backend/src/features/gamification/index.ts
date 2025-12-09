// ============================================================================
// Gamification Feature Module
// ============================================================================
// Exports for the gamification feature

// Router
export { default as gamificationRouter } from './router';

// Services
export { createXPEngine, XPEngine } from './services/xp-engine';
export { createAchievementChecker, AchievementChecker } from './services/achievement-checker';
export * from './services/level-calculator';

// Types
export * from './types';
