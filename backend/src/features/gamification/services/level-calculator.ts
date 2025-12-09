// ============================================================================
// Level Calculator Service
// ============================================================================
// Pure functions for level calculation

/**
 * Calculate XP required for a specific level
 * Formula: floor(100 * 1.15^(level-1))
 */
export function getXPForLevel(level: number): number {
  if (level < 1) return 0;
  if (level > 100) level = 100;
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * Calculate cumulative XP required to reach a level
 */
export function getCumulativeXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  xpInLevel: number;
  xpToNext: number;
} {
  let level = 1;
  let cumulative = 0;
  let required = getXPForLevel(1);

  while (level < 100) {
    required = getXPForLevel(level);
    if (cumulative + required > totalXP) {
      break;
    }
    cumulative += required;
    level++;
  }

  return {
    level,
    xpInLevel: totalXP - cumulative,
    xpToNext: required,
  };
}

/**
 * Get mascot stage from level
 * - Stage 1 (Spark): Levels 1-10
 * - Stage 2 (Ember): Levels 11-25
 * - Stage 3 (Flame): Levels 26-50
 * - Stage 4 (Blaze): Levels 51-75
 * - Stage 5 (Inferno): Levels 76-100
 */
export function getMascotStage(level: number): number {
  if (level >= 76) return 5;
  if (level >= 51) return 4;
  if (level >= 26) return 3;
  if (level >= 11) return 2;
  return 1;
}

/**
 * Get mascot stage name
 */
export function getMascotStageName(stage: number): string {
  const names: Record<number, string> = {
    1: 'Spark',
    2: 'Ember',
    3: 'Flame',
    4: 'Blaze',
    5: 'Inferno',
  };
  return names[stage] || 'Spark';
}

/**
 * Get streak multiplier from streak days
 * - 0-2 days: 1.0x
 * - 3-6 days: 1.1x
 * - 7-13 days: 1.25x
 * - 14-29 days: 1.5x
 * - 30+ days: 2.0x
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

/**
 * Calculate XP with multiplier
 */
export function calculateXPWithMultiplier(baseXP: number, multiplier: number): number {
  if (baseXP < 0) {
    // No multiplier on negative XP (penalties)
    return baseXP;
  }
  return Math.floor(baseXP * multiplier);
}

/**
 * Estimate days to reach a target level
 * Assumes average daily XP based on engagement level
 */
export function estimateDaysToLevel(
  currentXP: number,
  targetLevel: number,
  dailyXPEstimate: number = 300
): number {
  const targetXP = getCumulativeXPForLevel(targetLevel);
  const xpNeeded = targetXP - currentXP;
  if (xpNeeded <= 0) return 0;
  return Math.ceil(xpNeeded / dailyXPEstimate);
}

/**
 * Get level thresholds for mascot evolution
 */
export function getEvolutionLevels(): number[] {
  return [11, 26, 51, 76]; // Levels where mascot evolves
}

/**
 * Check if level triggers evolution
 */
export function isEvolutionLevel(level: number): boolean {
  return getEvolutionLevels().includes(level);
}

/**
 * Get next evolution level
 */
export function getNextEvolutionLevel(currentLevel: number): number | null {
  const levels = getEvolutionLevels();
  for (const level of levels) {
    if (level > currentLevel) return level;
  }
  return null; // Already at max stage
}

/**
 * Get level milestones for achievements
 */
export function getLevelMilestones(): number[] {
  return [10, 25, 50, 75, 100];
}
