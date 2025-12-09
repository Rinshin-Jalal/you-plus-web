// ============================================================================
// Gamification Router
// ============================================================================
// Hono router for gamification API endpoints

import { Hono } from 'hono';
import type { Env } from '@/index';
import { requireAuth } from '@/middleware/auth';
import { createSupabaseClient } from '@/features/core/utils/database';
import { createXPEngine } from './services/xp-engine';
import { createAchievementChecker } from './services/achievement-checker';
import { getMascotStageName, getStreakMultiplier } from './services/level-calculator';
import type {
  ProgressionResponse,
  AchievementResponse,
  AccessoryResponse,
  ChallengeResponse,
  LeaderboardEntry,
} from './types';

const gamification = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

// ============================================================================
// PROGRESSION ENDPOINTS
// ============================================================================

/**
 * GET /api/gamification/progression
 * Get user's current progression (XP, level, streak, mascot state)
 */
gamification.get('/progression', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);
    const xpEngine = createXPEngine(supabase);

    const progression = await xpEngine.getProgression(userId);

    if (!progression) {
      // Initialize if not exists
      const newProgression = await xpEngine.initializeProgression(userId);
      if (!newProgression) {
        return c.json({ error: 'Failed to initialize progression' }, 500);
      }
      return c.json(formatProgressionResponse(newProgression));
    }

    return c.json(formatProgressionResponse(progression));
  } catch (error) {
    console.error('[gamification/progression] Error:', error);
    return c.json({ error: 'Failed to fetch progression' }, 500);
  }
});

/**
 * GET /api/gamification/transactions
 * Get user's XP transaction history
 */
gamification.get('/transactions', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;
  const limit = parseInt(c.req.query('limit') || '50');

  try {
    const supabase = createSupabaseClient(env);
    const xpEngine = createXPEngine(supabase);

    const transactions = await xpEngine.getTransactionHistory(userId, limit);

    return c.json({ transactions });
  } catch (error) {
    console.error('[gamification/transactions] Error:', error);
    return c.json({ error: 'Failed to fetch transactions' }, 500);
  }
});

// ============================================================================
// ACHIEVEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/gamification/achievements
 * Get all achievements with user's unlock status
 */
gamification.get('/achievements', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);
    const achievementChecker = createAchievementChecker(supabase);

    const achievements = await achievementChecker.getAllAchievements(userId);

    const response: AchievementResponse[] = achievements.map((a) => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xp_reward,
      rarity: a.rarity,
      category: a.category,
      unlocked: a.unlocked,
      unlockedAt: a.unlocked_at,
      accessoryUnlock: a.accessory_unlock,
    }));

    return c.json({ achievements: response });
  } catch (error) {
    console.error('[gamification/achievements] Error:', error);
    return c.json({ error: 'Failed to fetch achievements' }, 500);
  }
});

/**
 * GET /api/gamification/achievements/notifications
 * Get pending achievement notifications
 */
gamification.get('/achievements/notifications', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);
    const achievementChecker = createAchievementChecker(supabase);

    const pending = await achievementChecker.getPendingNotifications(userId);

    return c.json({
      notifications: pending.map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        description: a.description,
        xpReward: a.xp_reward,
        rarity: a.rarity,
      })),
    });
  } catch (error) {
    console.error('[gamification/achievements/notifications] Error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

/**
 * POST /api/gamification/achievements/mark-notified
 * Mark achievements as seen
 */
gamification.post('/achievements/mark-notified', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { achievementIds } = body;

    if (!Array.isArray(achievementIds)) {
      return c.json({ error: 'achievementIds must be an array' }, 400);
    }

    const supabase = createSupabaseClient(env);
    const achievementChecker = createAchievementChecker(supabase);

    await achievementChecker.markNotified(userId, achievementIds);

    return c.json({ success: true });
  } catch (error) {
    console.error('[gamification/achievements/mark-notified] Error:', error);
    return c.json({ error: 'Failed to mark notifications' }, 500);
  }
});

// ============================================================================
// MASCOT & ACCESSORY ENDPOINTS
// ============================================================================

/**
 * GET /api/gamification/mascot
 * Get mascot state (stage, mood, energy, equipped accessories)
 */
gamification.get('/mascot', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

    // Get progression for mascot state
    const { data: progression, error: progressionError } = await supabase
      .from('user_progression')
      .select('mascot_stage, mascot_mood, mascot_energy')
      .eq('user_id', userId)
      .single();

    if (progressionError) {
      return c.json({ error: 'Failed to fetch mascot state' }, 500);
    }

    // Get equipped accessories
    const { data: equipped, error: equippedError } = await supabase
      .from('user_accessories')
      .select('accessory_id, mascot_accessories(*)')
      .eq('user_id', userId)
      .eq('equipped', true);

    if (equippedError) {
      console.error('[gamification/mascot] Error fetching accessories:', equippedError);
    }

    return c.json({
      stage: progression?.mascot_stage || 1,
      stageName: getMascotStageName(progression?.mascot_stage || 1),
      mood: progression?.mascot_mood || 'neutral',
      energy: progression?.mascot_energy || 100,
      equippedAccessories: (equipped || []).map((e) => {
        const acc = e.mascot_accessories as unknown as Record<string, unknown>;
        return {
          key: acc?.key,
          category: acc?.category,
          assetKey: acc?.asset_key,
          zIndex: acc?.z_index,
        };
      }),
    });
  } catch (error) {
    console.error('[gamification/mascot] Error:', error);
    return c.json({ error: 'Failed to fetch mascot' }, 500);
  }
});

/**
 * GET /api/gamification/accessories
 * Get all accessories with unlock status
 */
gamification.get('/accessories', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

    // Get all accessories
    const { data: accessories, error: accessoriesError } = await supabase
      .from('mascot_accessories')
      .select('*')
      .order('category')
      .order('sort_order');

    if (accessoriesError) {
      return c.json({ error: 'Failed to fetch accessories' }, 500);
    }

    // Get user's unlocked accessories
    const { data: userAccessories, error: userError } = await supabase
      .from('user_accessories')
      .select('accessory_id, equipped')
      .eq('user_id', userId);

    if (userError) {
      console.error('[gamification/accessories] Error:', userError);
    }

    const userMap = new Map(
      (userAccessories || []).map((ua) => [ua.accessory_id, ua.equipped])
    );

    const response: AccessoryResponse[] = (accessories || []).map((a) => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      category: a.category,
      rarity: a.rarity,
      assetKey: a.asset_key,
      zIndex: a.z_index,
      unlocked: userMap.has(a.id),
      equipped: userMap.get(a.id) || false,
      unlockMethod: a.unlock_method,
      unlockRequirement: a.unlock_requirement,
    }));

    return c.json({ accessories: response });
  } catch (error) {
    console.error('[gamification/accessories] Error:', error);
    return c.json({ error: 'Failed to fetch accessories' }, 500);
  }
});

/**
 * POST /api/gamification/accessories/equip
 * Equip an accessory
 */
gamification.post('/accessories/equip', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { accessoryId } = body;

    if (!accessoryId) {
      return c.json({ error: 'accessoryId is required' }, 400);
    }

    const supabase = createSupabaseClient(env);

    // Check if user has unlocked this accessory
    const { data: userAccessory, error: checkError } = await supabase
      .from('user_accessories')
      .select('id, accessory_id')
      .eq('user_id', userId)
      .eq('accessory_id', accessoryId)
      .single();

    if (checkError || !userAccessory) {
      return c.json({ error: 'Accessory not unlocked' }, 400);
    }

    // Get accessory category
    const { data: accessory, error: accessoryError } = await supabase
      .from('mascot_accessories')
      .select('category')
      .eq('id', accessoryId)
      .single();

    if (accessoryError || !accessory) {
      return c.json({ error: 'Accessory not found' }, 404);
    }

    // Unequip any other accessory in the same category
    // Get all accessories in this category first
    const { data: categoryAccessories } = await supabase
      .from('mascot_accessories')
      .select('id')
      .eq('category', accessory.category);

    if (categoryAccessories && categoryAccessories.length > 0) {
      await supabase
        .from('user_accessories')
        .update({ equipped: false })
        .eq('user_id', userId)
        .in('accessory_id', categoryAccessories.map((a) => a.id));
    }

    // Equip the new accessory
    const { error: equipError } = await supabase
      .from('user_accessories')
      .update({ equipped: true })
      .eq('user_id', userId)
      .eq('accessory_id', accessoryId);

    if (equipError) {
      return c.json({ error: 'Failed to equip accessory' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[gamification/accessories/equip] Error:', error);
    return c.json({ error: 'Failed to equip accessory' }, 500);
  }
});

/**
 * POST /api/gamification/accessories/unequip
 * Unequip an accessory
 */
gamification.post('/accessories/unequip', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { accessoryId } = body;

    if (!accessoryId) {
      return c.json({ error: 'accessoryId is required' }, 400);
    }

    const supabase = createSupabaseClient(env);

    const { error } = await supabase
      .from('user_accessories')
      .update({ equipped: false })
      .eq('user_id', userId)
      .eq('accessory_id', accessoryId);

    if (error) {
      return c.json({ error: 'Failed to unequip accessory' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[gamification/accessories/unequip] Error:', error);
    return c.json({ error: 'Failed to unequip accessory' }, 500);
  }
});

// ============================================================================
// DAILY CHALLENGE ENDPOINTS
// ============================================================================

/**
 * GET /api/gamification/challenge
 * Get today's daily challenge
 */
gamification.get('/challenge', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);
    const today = new Date().toISOString().split('T')[0];

    const { data: challenge, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No challenge for today - will be generated by cron
        return c.json({ challenge: null });
      }
      return c.json({ error: 'Failed to fetch challenge' }, 500);
    }

    const response: ChallengeResponse = {
      id: challenge.id,
      challengeType: challenge.challenge_type,
      description: challenge.description,
      xpReward: challenge.xp_reward,
      completed: challenge.completed,
      completedAt: challenge.completed_at,
      expiresAt: challenge.expires_at,
    };

    return c.json({ challenge: response });
  } catch (error) {
    console.error('[gamification/challenge] Error:', error);
    return c.json({ error: 'Failed to fetch challenge' }, 500);
  }
});

// ============================================================================
// LEADERBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/gamification/leaderboard
 * Get weekly leaderboard
 */
gamification.get('/leaderboard', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const supabase = createSupabaseClient(env);

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];

    // Get top entries for this week
    const { data: entries, error } = await supabase
      .from('weekly_leaderboard')
      .select('*')
      .eq('week_start', weekStart)
      .order('xp_earned', { ascending: false })
      .limit(limit);

    if (error) {
      return c.json({ error: 'Failed to fetch leaderboard' }, 500);
    }

    // Get user's rank
    const { data: userEntry } = await supabase
      .from('weekly_leaderboard')
      .select('*')
      .eq('week_start', weekStart)
      .eq('user_id', userId)
      .single();

    const leaderboard: LeaderboardEntry[] = (entries || []).map((e, idx) => ({
      rank: e.rank || idx + 1,
      xpEarned: e.xp_earned,
      mascotStage: e.mascot_stage,
      currentLevel: e.current_level,
      isCurrentUser: e.user_id === userId,
    }));

    return c.json({
      leaderboard,
      userRank: userEntry?.rank || null,
      userXp: userEntry?.xp_earned || 0,
      weekStart,
    });
  } catch (error) {
    console.error('[gamification/leaderboard] Error:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatProgressionResponse(progression: {
  total_xp: number;
  current_level: number;
  xp_in_current_level: number;
  xp_to_next_level: number;
  streak_multiplier: number;
  streak_shields: number;
  mascot_stage: number;
  mascot_mood: string;
  mascot_energy: number;
}): ProgressionResponse {
  return {
    totalXp: progression.total_xp,
    currentLevel: progression.current_level,
    xpInCurrentLevel: progression.xp_in_current_level,
    xpToNextLevel: progression.xp_to_next_level,
    streakMultiplier: progression.streak_multiplier,
    streakShields: progression.streak_shields,
    mascotStage: progression.mascot_stage,
    mascotStageName: getMascotStageName(progression.mascot_stage),
    mascotMood: progression.mascot_mood as ProgressionResponse['mascotMood'],
    mascotEnergy: progression.mascot_energy,
  };
}

export default gamification;
