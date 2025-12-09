// ============================================================================
// Achievement Checker Service
// ============================================================================
// Checks and unlocks achievements based on user actions

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Achievement, UserAchievement, AchievementRarity } from '../types';

export interface AchievementUnlock {
  achievement: Achievement;
  xpAwarded: number;
  accessoryUnlocked: string | null;
}

export class AchievementChecker {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check all applicable achievements for a user after an action
   */
  async checkAchievements(
    userId: string,
    context: {
      currentStreak?: number;
      callsCompleted?: number;
      pillarCheckins?: Record<string, number>;
      trustScore?: number;
      currentLevel?: number;
      promisesKept?: number;
      promisesBroken?: number;
    }
  ): Promise<AchievementUnlock[]> {
    // Get all achievements
    const { data: achievements, error: achievementsError } = await this.supabase
      .from('achievements')
      .select('*')
      .order('sort_order');

    if (achievementsError || !achievements) {
      console.error('[AchievementChecker] Failed to fetch achievements:', achievementsError);
      return [];
    }

    // Get user's already unlocked achievements
    const { data: userAchievements, error: userAchievementsError } = await this.supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (userAchievementsError) {
      console.error('[AchievementChecker] Failed to fetch user achievements:', userAchievementsError);
      return [];
    }

    const unlockedIds = new Set((userAchievements || []).map((ua) => ua.achievement_id));
    const unlocks: AchievementUnlock[] = [];

    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedIds.has(achievement.id)) continue;

      // Check if achievement requirements are met
      if (this.isAchievementMet(achievement, context)) {
        const unlock = await this.unlockAchievement(userId, achievement);
        if (unlock) {
          unlocks.push(unlock);
        }
      }
    }

    return unlocks;
  }

  /**
   * Check if a specific achievement's requirements are met
   */
  private isAchievementMet(
    achievement: Achievement,
    context: {
      currentStreak?: number;
      callsCompleted?: number;
      pillarCheckins?: Record<string, number>;
      trustScore?: number;
      currentLevel?: number;
      promisesKept?: number;
      promisesBroken?: number;
    }
  ): boolean {
    const { requirement_type, requirement_value, requirement_config } = achievement;
    const config = requirement_config as Record<string, unknown>;

    switch (requirement_type) {
      case 'streak':
        return (context.currentStreak ?? 0) >= (requirement_value ?? 0);

      case 'milestone':
        // For streaks or levels
        if (achievement.category === 'streaks') {
          return (context.currentStreak ?? 0) >= (requirement_value ?? 0);
        }
        if (achievement.category === 'levels') {
          return (context.currentLevel ?? 1) >= (requirement_value ?? 0);
        }
        return false;

      case 'count':
        // Check count-based achievements
        if (config.type === 'calls_completed') {
          return (context.callsCompleted ?? 0) >= (requirement_value ?? 0);
        }
        if (config.pillar && context.pillarCheckins) {
          const pillarKey = config.pillar as string;
          return (context.pillarCheckins[pillarKey] ?? 0) >= (requirement_value ?? 0);
        }
        if (config.type === 'promises_broken_admitted') {
          return (context.promisesBroken ?? 0) >= (requirement_value ?? 0);
        }
        if (config.type === 'consecutive_promises_kept') {
          return (context.promisesKept ?? 0) >= (requirement_value ?? 0);
        }
        return false;

      case 'threshold':
        // Trust score thresholds
        if (achievement.category === 'trust') {
          return (context.trustScore ?? 0) >= (requirement_value ?? 0);
        }
        return false;

      case 'special':
        // Special achievements require specific event triggers
        // These are checked at the time of the event, not in batch
        return false;

      default:
        return false;
    }
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(
    userId: string,
    achievement: Achievement
  ): Promise<AchievementUnlock | null> {
    // Insert user_achievement record
    const { error: insertError } = await this.supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievement.id,
      unlocked_at: new Date().toISOString(),
      notified: false,
    });

    if (insertError) {
      // Likely duplicate - achievement already unlocked
      if (insertError.code === '23505') {
        console.log('[AchievementChecker] Achievement already unlocked:', achievement.key);
        return null;
      }
      console.error('[AchievementChecker] Failed to unlock achievement:', insertError);
      return null;
    }

    // Update progression with last achievement timestamp
    await this.supabase
      .from('user_progression')
      .update({ last_achievement_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Award XP for achievement (if any)
    if (achievement.xp_reward > 0) {
      await this.supabase.rpc('award_xp', {
        p_user_id: userId,
        p_base_amount: achievement.xp_reward,
        p_reason: 'achievement_unlock',
        p_metadata: { achievement_key: achievement.key },
      });
    }

    // Unlock accessory if applicable
    let accessoryUnlocked: string | null = null;
    if (achievement.accessory_unlock) {
      accessoryUnlocked = await this.unlockAccessory(userId, achievement.accessory_unlock);
    }

    console.log(`[AchievementChecker] Unlocked achievement: ${achievement.key} for user ${userId}`);

    return {
      achievement,
      xpAwarded: achievement.xp_reward,
      accessoryUnlocked,
    };
  }

  /**
   * Unlock a specific achievement by key (for special achievements)
   */
  async unlockByKey(userId: string, achievementKey: string): Promise<AchievementUnlock | null> {
    const { data: achievement, error } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('key', achievementKey)
      .single();

    if (error || !achievement) {
      console.error('[AchievementChecker] Achievement not found:', achievementKey);
      return null;
    }

    return this.unlockAchievement(userId, achievement);
  }

  /**
   * Unlock an accessory for a user
   */
  private async unlockAccessory(userId: string, accessoryKey: string): Promise<string | null> {
    // Get accessory by key
    const { data: accessory, error: accessoryError } = await this.supabase
      .from('mascot_accessories')
      .select('id, key')
      .eq('key', accessoryKey)
      .single();

    if (accessoryError || !accessory) {
      console.error('[AchievementChecker] Accessory not found:', accessoryKey);
      return null;
    }

    // Insert user_accessory record
    const { error: insertError } = await this.supabase.from('user_accessories').insert({
      user_id: userId,
      accessory_id: accessory.id,
      equipped: false,
      unlocked_at: new Date().toISOString(),
    });

    if (insertError && insertError.code !== '23505') {
      console.error('[AchievementChecker] Failed to unlock accessory:', insertError);
      return null;
    }

    return accessory.key;
  }

  /**
   * Get all achievements with user's unlock status
   */
  async getAllAchievements(
    userId: string
  ): Promise<Array<Achievement & { unlocked: boolean; unlocked_at: string | null }>> {
    // Get all achievements
    const { data: achievements, error: achievementsError } = await this.supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (achievementsError || !achievements) {
      console.error('[AchievementChecker] Failed to fetch achievements:', achievementsError);
      return [];
    }

    // Get user's unlocked achievements
    const { data: userAchievements, error: userAchievementsError } = await this.supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId);

    if (userAchievementsError) {
      console.error('[AchievementChecker] Failed to fetch user achievements:', userAchievementsError);
    }

    const unlockedMap = new Map(
      (userAchievements || []).map((ua) => [ua.achievement_id, ua.unlocked_at])
    );

    return achievements.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id) ?? null,
    }));
  }

  /**
   * Get user's unlocked achievements only
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('achievement_id, achievements(*)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('[AchievementChecker] Failed to fetch user achievements:', error);
      return [];
    }

    return (data || []).map((ua) => ua.achievements as unknown as Achievement);
  }

  /**
   * Get pending achievement notifications
   */
  async getPendingNotifications(userId: string): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('achievement_id, achievements(*)')
      .eq('user_id', userId)
      .eq('notified', false);

    if (error) {
      console.error('[AchievementChecker] Failed to fetch pending notifications:', error);
      return [];
    }

    return (data || []).map((ua) => ua.achievements as unknown as Achievement);
  }

  /**
   * Mark achievements as notified
   */
  async markNotified(userId: string, achievementIds: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('user_achievements')
      .update({ notified: true })
      .eq('user_id', userId)
      .in('achievement_id', achievementIds);

    if (error) {
      console.error('[AchievementChecker] Failed to mark notified:', error);
    }
  }
}

/**
 * Create Achievement Checker instance
 */
export function createAchievementChecker(supabase: SupabaseClient): AchievementChecker {
  return new AchievementChecker(supabase);
}
