// ============================================================================
// XP Engine Service
// ============================================================================
// Core XP awarding logic with multiplier support
//
// Philosophy: "The mascot is a mirror. It shows them what they did."
// Mood is now calculated based on REAL pillar health, not just activity.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { XPReason, XPAwardResult, UserProgression, MascotMood } from '../types';
import { XP_VALUES, MASCOT_STAGES } from '../types';
import {
  calculateMood,
  getPillarHealth,
  getDaysAbsent,
  calculateEnergyDecay,
  calculateEnergyRestore,
  ENERGY_CONFIG,
} from './mood-calculator';

export interface AwardXPParams {
  userId: string;
  reason: XPReason;
  metadata?: Record<string, unknown>;
  baseAmount?: number; // Override default XP value
}

export class XPEngine {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Award XP to a user with multiplier applied
   * Uses the database award_xp function for atomicity
   */
  async awardXP(params: AwardXPParams): Promise<XPAwardResult> {
    const { userId, reason, metadata = {}, baseAmount } = params;

    // Get base XP amount
    const base = baseAmount ?? this.getBaseAmount(reason);

    // Call the database function for atomic XP award
    const { data, error } = await this.supabase.rpc('award_xp', {
      p_user_id: userId,
      p_base_amount: base,
      p_reason: reason,
      p_metadata: metadata,
    });

    if (error) {
      console.error('[XPEngine] Failed to award XP:', error);
      throw new Error(`Failed to award XP: ${error.message}`);
    }

    const result = data?.[0];
    if (!result) {
      throw new Error('No result from award_xp function');
    }

    // Check for achievements (async, don't await)
    this.checkAchievements(userId, reason, result).catch((err) => {
      console.error('[XPEngine] Achievement check failed:', err);
    });

    return {
      newTotalXp: result.new_total_xp,
      newLevel: result.new_level,
      xpAwarded: result.xp_awarded,
      leveledUp: result.leveled_up,
      newStage: result.new_stage,
      achievementsUnlocked: [], // Will be populated async
    };
  }

  /**
   * Get the base XP amount for a reason
   */
  private getBaseAmount(reason: XPReason): number {
    switch (reason) {
      case 'call_answered':
        return XP_VALUES.call_answered;
      case 'call_completed':
        return XP_VALUES.call_completed;
      case 'pillar_checkin':
        return XP_VALUES.pillar_checkin;
      case 'all_pillars_complete':
        return XP_VALUES.all_pillars_complete;
      case 'promise_kept':
        return XP_VALUES.promise_kept;
      case 'promise_broken':
        return XP_VALUES.promise_broken;
      case 'daily_challenge':
        return XP_VALUES.daily_challenge_base;
      case 'achievement_unlock':
        return 0; // Specified by the achievement
      case 'streak_bonus':
      case 'level_up_bonus':
      case 'admin_adjustment':
        return 0; // Specified explicitly
      default:
        return 0;
    }
  }

  /**
   * Get user's current progression
   */
  async getProgression(userId: string): Promise<UserProgression | null> {
    const { data, error } = await this.supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, initialize one
        return this.initializeProgression(userId);
      }
      console.error('[XPEngine] Failed to get progression:', error);
      return null;
    }

    return data;
  }

  /**
   * Initialize progression for a new user
   */
  async initializeProgression(userId: string): Promise<UserProgression | null> {
    const { data, error } = await this.supabase.rpc('initialize_user_gamification', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[XPEngine] Failed to initialize progression:', error);
      return null;
    }

    // Fetch the created record
    return this.getProgression(userId);
  }

  /**
   * Update streak multiplier based on current streak
   */
  async updateStreakMultiplier(userId: string, streakDays: number): Promise<void> {
    const { data: multiplier, error: multError } = await this.supabase.rpc(
      'get_streak_multiplier',
      { p_streak_days: streakDays }
    );

    if (multError) {
      console.error('[XPEngine] Failed to calculate multiplier:', multError);
      return;
    }

    const { error } = await this.supabase
      .from('user_progression')
      .update({ streak_multiplier: multiplier })
      .eq('user_id', userId);

    if (error) {
      console.error('[XPEngine] Failed to update streak multiplier:', error);
    }
  }

  /**
   * Use a streak shield to protect streak
   * Returns true if shield was used, false if none available
   */
  async useStreakShield(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_progression')
      .select('streak_shields')
      .eq('user_id', userId)
      .single();

    if (error || !data || data.streak_shields <= 0) {
      return false;
    }

    const { error: updateError } = await this.supabase
      .from('user_progression')
      .update({ streak_shields: data.streak_shields - 1 })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[XPEngine] Failed to use streak shield:', updateError);
      return false;
    }

    return true;
  }

  /**
   * Award a streak shield (earned every 30 days)
   * Max 3 shields
   */
  async awardStreakShield(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_progression')
      .select('streak_shields')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    if (data.streak_shields >= 3) {
      return false; // Already at max
    }

    const { error: updateError } = await this.supabase
      .from('user_progression')
      .update({ streak_shields: data.streak_shields + 1 })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[XPEngine] Failed to award streak shield:', updateError);
      return false;
    }

    return true;
  }

  /**
   * Update mascot mood based on pillar health + activity
   * 
   * The mascot reflects REAL life progress (pillar health), not just activity.
   * When users quit, they see the cost. When they show up, they earn joy.
   * 
   * Priority order:
   * 1. celebrating (just leveled up)
   * 2. sleeping (energy depleted - abandoned)
   * 3. sad (streak broken OR pillars very low)
   * 4. concerned (pillars declining OR returning after absence)
   * 5. proud (high pillars + strong streak)
   * 6. happy (good pillars + decent streak)
   * 7. neutral (default)
   */
  async updateMascotMood(
    userId: string,
    context: {
      justLeveledUp?: boolean;
      streakDays?: number;
      energy?: number;
      streakBroken?: boolean;
    }
  ): Promise<void> {
    // Get pillar health (the real measure of life progress)
    const pillarHealth = await getPillarHealth(this.supabase, userId);
    
    // Get days since last activity (for abandonment detection)
    const daysAbsent = await getDaysAbsent(this.supabase, userId);

    // Calculate mood using pillar-health-aware logic
    const mood = calculateMood({
      justLeveledUp: context.justLeveledUp,
      streakDays: context.streakDays ?? 0,
      energy: context.energy ?? 100,
      streakBroken: context.streakBroken,
      daysAbsent,
      pillarHealth,
    });

    const { error } = await this.supabase
      .from('user_progression')
      .update({ mascot_mood: mood })
      .eq('user_id', userId);

    if (error) {
      console.error('[XPEngine] Failed to update mascot mood:', error);
    }
  }

  /**
   * Decay mascot energy (called by nightly cron)
   * 
   * Uses ACCELERATED decay for absent users:
   * - Days 1-2: -15 energy/day (standard)
   * - Days 3+:  -25 energy/day (they're ghosting)
   * 
   * The mascot becomes dim, dusty, and eventually cobwebbed.
   * This creates visual shame that motivates return.
   */
  async decayMascotEnergy(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('user_progression')
      .select('mascot_energy, last_energy_decay_at, days_absent')
      .eq('user_id', userId)
      .single();

    if (error || !data) return;

    // Check if already decayed today
    const today = new Date().toISOString().split('T')[0];
    if (data.last_energy_decay_at === today) return;

    // Calculate days since last decay
    const lastDecay = data.last_energy_decay_at 
      ? new Date(data.last_energy_decay_at)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const daysSinceLastDecay = Math.floor(
      (Date.now() - lastDecay.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get current days absent
    const daysAbsent = await getDaysAbsent(this.supabase, userId);

    // Calculate new energy with accelerated decay
    const newEnergy = calculateEnergyDecay(
      data.mascot_energy,
      daysAbsent,
      daysSinceLastDecay
    );

    // Determine mood based on energy and absence
    let newMood: MascotMood | undefined;
    if (newEnergy <= 0) {
      newMood = 'sleeping';
    } else if (daysAbsent >= 3) {
      newMood = 'sad';
    }

    const { error: updateError } = await this.supabase
      .from('user_progression')
      .update({
        mascot_energy: newEnergy,
        last_energy_decay_at: today,
        days_absent: daysAbsent,
        ...(newMood ? { mascot_mood: newMood } : {}),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[XPEngine] Failed to decay mascot energy:', updateError);
    }
  }

  /**
   * Restore mascot energy when user takes action
   * 
   * Recovery rates:
   * - Complete a call: +25 energy
   * - Pillar check-in: +10 energy
   * 
   * Recovery is SLOWER than decay (asymmetric by design).
   * They have to earn back their happy mascot.
   */
  async restoreMascotEnergy(
    userId: string,
    action: 'call_completed' | 'call_answered' | 'pillar_checkin'
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from('user_progression')
      .select('mascot_energy')
      .eq('user_id', userId)
      .single();

    if (error || !data) return 0;

    const newEnergy = calculateEnergyRestore(data.mascot_energy, action);

    const { error: updateError } = await this.supabase
      .from('user_progression')
      .update({
        mascot_energy: newEnergy,
        days_absent: 0,  // Reset absence counter
        last_xp_earned_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[XPEngine] Failed to restore mascot energy:', updateError);
      return data.mascot_energy;
    }

    // Update mood now that they're back
    await this.updateMascotMood(userId, { energy: newEnergy });

    return newEnergy;
  }

  /**
   * Get XP transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit = 50
  ): Promise<Array<{ amount: number; reason: string; createdAt: string }>> {
    const { data, error } = await this.supabase
      .from('xp_transactions')
      .select('amount, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[XPEngine] Failed to get transaction history:', error);
      return [];
    }

    return (data || []).map((tx) => ({
      amount: tx.amount,
      reason: tx.reason,
      createdAt: tx.created_at,
    }));
  }

  /**
   * Check and unlock achievements after XP award (async)
   */
  private async checkAchievements(
    userId: string,
    reason: XPReason,
    xpResult: { new_level: number; leveled_up: boolean }
  ): Promise<void> {
    // This is a placeholder - will be implemented in achievement-checker service
    // For now, just check level-based achievements
    if (xpResult.leveled_up) {
      const levelMilestones = [10, 25, 50, 75, 100];
      if (levelMilestones.includes(xpResult.new_level)) {
        console.log(`[XPEngine] User ${userId} reached level milestone: ${xpResult.new_level}`);
        // Achievement checker will handle this
      }
    }
  }
}

/**
 * Create XP Engine instance
 */
export function createXPEngine(supabase: SupabaseClient): XPEngine {
  return new XPEngine(supabase);
}
