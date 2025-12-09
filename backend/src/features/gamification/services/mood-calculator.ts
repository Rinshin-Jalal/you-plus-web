// ============================================================================
// Mood Calculator Service
// ============================================================================
// Calculates mascot mood based on pillar health + activity metrics
// 
// Philosophy: "The mascot is a mirror. It shows them what they did."
// 
// This answers Christensen's question:
// "Does this make the user a better version of themselves?"
//
// The mascot reflects REAL life progress (pillar health), not just activity.
// When users quit, they see the cost. When they show up, they earn joy.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MascotMood } from '../types';

// ============================================================================
// Configurable Thresholds
// ============================================================================
// Tune these based on user feedback. Asymmetric by design:
// - Degradation is FASTER than improvement
// - This creates healthy shame and prevents the quitting cycle
// ============================================================================

export const MOOD_THRESHOLDS = {
  // Pillar health thresholds (0-100 scale)
  PILLAR_PROUD: 70,        // avg >= 70 can be proud
  PILLAR_HAPPY: 55,        // avg >= 55 can be happy
  PILLAR_CONCERNED: 40,    // avg < 40 = concerned
  PILLAR_SAD: 30,          // avg < 30 = sad
  LOWEST_PILLAR_ALERT: 30, // any pillar < 30 triggers concern
  
  // Activity thresholds
  STREAK_PROUD: 7,         // days for proud
  STREAK_HAPPY: 3,         // days for happy
  
  // Abandonment detection
  DAYS_DUST: 5,            // days until dust particles appear
  DAYS_COBWEBS: 7,         // days until cobwebs appear
} as const;

export const ENERGY_CONFIG = {
  // Decay rates (energy lost per day)
  DECAY_STANDARD: 15,      // days 1-2 of absence
  DECAY_ACCELERATED: 25,   // days 3+ of absence (ghosting)
  
  // Recovery rates (energy gained per action)
  RESTORE_CALL: 25,        // completing a call
  RESTORE_PILLAR: 10,      // pillar check-in
  
  // Limits
  MAX_ENERGY: 100,
  MIN_ENERGY: 0,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface PillarHealth {
  avgTrust: number;
  lowestTrust: number;
  pillarCount: number;
}

export interface MoodContext {
  justLeveledUp?: boolean;
  streakDays?: number;
  energy?: number;
  streakBroken?: boolean;
  daysAbsent?: number;
  pillarHealth: PillarHealth;
}

export interface AbandonmentState {
  daysAbsent: number;
  showDust: boolean;      // 5+ days
  showCobwebs: boolean;   // 7+ days
  saturation: number;     // 0.3 to 1.0 (lower = more faded)
  opacity: number;        // 0.7 to 1.0 (lower = more ghostly)
}

// ============================================================================
// Core Mood Calculation
// ============================================================================

/**
 * Calculate mascot mood based on pillar health and activity
 * 
 * Priority order ensures the most important states take precedence:
 * 1. celebrating (just leveled up - reward achievement)
 * 2. sleeping (energy depleted - they abandoned the mascot)
 * 3. sad (streak broken OR pillars very low)
 * 4. concerned (pillars declining OR one pillar neglected)
 * 5. proud (high pillars + strong streak)
 * 6. happy (good pillars + decent streak)
 * 7. neutral (default)
 */
export function calculateMood(context: MoodContext): MascotMood {
  const {
    justLeveledUp = false,
    streakDays = 0,
    energy = 100,
    streakBroken = false,
    daysAbsent = 0,
    pillarHealth,
  } = context;

  const { avgTrust, lowestTrust, pillarCount } = pillarHealth;
  const T = MOOD_THRESHOLDS;

  // Priority 1: Celebration (just leveled up)
  if (justLeveledUp) {
    return 'celebrating';
  }

  // Priority 2: Sleeping (no energy - abandoned)
  if (energy <= 0) {
    return 'sleeping';
  }

  // Priority 3: Sad (streak just broken)
  if (streakBroken) {
    return 'sad';
  }

  // Priority 4: No pillars set up yet - be encouraging to new users
  if (pillarCount === 0) {
    return 'happy';
  }

  // Priority 5: Very low pillar health (life is struggling)
  if (avgTrust < T.PILLAR_SAD) {
    return 'sad';
  }

  // Priority 6: Low pillar health OR one pillar severely neglected
  if (avgTrust < T.PILLAR_CONCERNED || lowestTrust < T.LOWEST_PILLAR_ALERT) {
    return 'concerned';
  }

  // Priority 7: Returning after absence - start sad, earn happiness
  // (even if pillars are okay, they need to prove they're back)
  if (daysAbsent >= 3) {
    return 'concerned';
  }

  // Priority 8: Proud - high pillar health AND strong streak
  if (avgTrust >= T.PILLAR_PROUD && streakDays >= T.STREAK_PROUD) {
    return 'proud';
  }

  // Priority 9: Happy - good pillar health AND decent streak
  if (avgTrust >= T.PILLAR_HAPPY && streakDays >= T.STREAK_HAPPY) {
    return 'happy';
  }

  // Default: Neutral
  return 'neutral';
}

// ============================================================================
// Abandonment Visual State
// ============================================================================

/**
 * Calculate the visual abandonment state for the mascot
 * 
 * As days absent increase, the mascot becomes:
 * - Dimmer (reduced saturation)
 * - More transparent (reduced opacity)
 * - Dusty (particles appear at 5+ days)
 * - Cobwebbed (at 7+ days)
 * 
 * This creates visual shame - they see what they did to their mascot.
 */
export function calculateAbandonmentState(daysAbsent: number): AbandonmentState {
  const T = MOOD_THRESHOLDS;
  
  // Saturation decreases with absence (min 0.3)
  // Days 0-2: 1.0 (full color)
  // Days 3+: decreases by 0.1 per day, min 0.3
  const saturation = daysAbsent <= 2 
    ? 1.0 
    : Math.max(0.3, 1.0 - (daysAbsent - 2) * 0.1);
  
  // Opacity decreases at 5+ days (min 0.7)
  const opacity = daysAbsent >= 5 ? 0.7 : 1.0;
  
  return {
    daysAbsent,
    showDust: daysAbsent >= T.DAYS_DUST,
    showCobwebs: daysAbsent >= T.DAYS_COBWEBS,
    saturation,
    opacity,
  };
}

// ============================================================================
// Database Helpers
// ============================================================================

/**
 * Fetch pillar health metrics for a user
 */
export async function getPillarHealth(
  supabase: SupabaseClient,
  userId: string
): Promise<PillarHealth> {
  const { data: pillars, error } = await supabase
    .from('future_self_pillars')
    .select('trust_score')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error || !pillars || pillars.length === 0) {
    return { avgTrust: 50, lowestTrust: 50, pillarCount: 0 };
  }

  const scores = pillars.map((p) => p.trust_score ?? 50);
  
  return {
    avgTrust: scores.reduce((a, b) => a + b, 0) / scores.length,
    lowestTrust: Math.min(...scores),
    pillarCount: scores.length,
  };
}

/**
 * Calculate days since last XP activity
 */
export async function getDaysAbsent(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('user_progression')
    .select('last_xp_earned_at, days_absent')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return 0;
  }

  // If we have a cached days_absent, use it
  if (data.days_absent !== undefined && data.days_absent !== null) {
    return data.days_absent;
  }

  // Otherwise calculate from last_xp_earned_at
  if (!data.last_xp_earned_at) {
    return 0;
  }

  const lastActivity = new Date(data.last_xp_earned_at);
  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate energy decay for a user who has been absent
 * Uses accelerated decay: -15/day for days 1-2, -25/day for days 3+
 */
export function calculateEnergyDecay(
  currentEnergy: number,
  daysAbsent: number,
  daysSinceLastDecay: number
): number {
  if (daysSinceLastDecay <= 0) {
    return currentEnergy;
  }

  let totalDecay = 0;
  const E = ENERGY_CONFIG;

  for (let i = 1; i <= daysSinceLastDecay; i++) {
    const dayOfAbsence = daysAbsent - daysSinceLastDecay + i;
    
    if (dayOfAbsence <= 2) {
      totalDecay += E.DECAY_STANDARD;
    } else {
      totalDecay += E.DECAY_ACCELERATED;
    }
  }

  return Math.max(E.MIN_ENERGY, currentEnergy - totalDecay);
}

/**
 * Calculate energy restoration for an action
 */
export function calculateEnergyRestore(
  currentEnergy: number,
  action: 'call_completed' | 'call_answered' | 'pillar_checkin'
): number {
  const E = ENERGY_CONFIG;
  
  const restoreAmount = action === 'pillar_checkin' 
    ? E.RESTORE_PILLAR 
    : E.RESTORE_CALL;
  
  return Math.min(E.MAX_ENERGY, currentEnergy + restoreAmount);
}
