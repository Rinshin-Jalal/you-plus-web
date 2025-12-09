// ============================================================================
// XP Engine Service
// ============================================================================
// Core XP awarding logic with multiplier support

import type { SupabaseClient } from '@supabase/supabase-js';
import type { XPReason, XPAwardResult, UserProgression } from '../types';
import { XP_VALUES, MASCOT_STAGES } from '../types';

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
   * Update mascot mood based on user state
   */
  async updateMascotMood(
    userId: string,
    context: {
      justLeveledUp?: boolean;
      streakDays?: number;
      trustScore?: number;
      energy?: number;
      streakBroken?: boolean;
    }
  ): Promise<void> {
    const { justLeveledUp, streakDays = 0, trustScore = 50, energy = 100, streakBroken } = context;

    // Priority order for mood determination
    let mood: string = 'neutral';

    if (justLeveledUp) {
      mood = 'celebrating';
    } else if (energy <= 0) {
      mood = 'sleeping';
    } else if (streakBroken) {
      mood = 'sad';
    } else if (streakDays >= 7 && trustScore >= 70) {
      mood = 'proud';
    } else if (streakDays >= 3 || trustScore >= 60) {
      mood = 'happy';
    } else if (trustScore < 40) {
      mood = 'concerned';
    } else if (streakDays === 0 && trustScore < 50) {
      mood = 'sad';
    }

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
   */
  async decayMascotEnergy(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('user_progression')
      .select('mascot_energy, last_energy_decay_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) return;

    // Check if already decayed today
    const today = new Date().toISOString().split('T')[0];
    if (data.last_energy_decay_at === today) return;

    const newEnergy = Math.max(0, data.mascot_energy - 15);

    const { error: updateError } = await this.supabase
      .from('user_progression')
      .update({
        mascot_energy: newEnergy,
        last_energy_decay_at: today,
        mascot_mood: newEnergy <= 0 ? 'sleeping' : undefined,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[XPEngine] Failed to decay mascot energy:', updateError);
    }
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
