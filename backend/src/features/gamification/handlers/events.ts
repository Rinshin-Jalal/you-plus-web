/**
 * Gamification Event Handlers
 *
 * Awards XP and unlocks achievements based on domain events.
 * This is the heart of the gamification system - it reacts to
 * events from other features without those features knowing about gamification.
 *
 * XP Multipliers based on streak:
 * - 3+ days: 1.1x
 * - 7+ days: 1.25x
 * - 14+ days: 1.5x
 * - 30+ days: 2.0x
 */

import type { EventBus, EventHandler } from '@/events/bus';
import type { EventByType } from '@/events/types';
import type { Env } from '@/types/environment';
import { createSupabaseClient } from '@/features/core/utils/database';

// ═══════════════════════════════════════════════════════════════════════════
// XP CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const XP_AWARDS = {
  SUBSCRIPTION_CREATED: 100,
  ONBOARDING_COMPLETED: 50,
  VOICE_CLONED_BONUS: 25,
  CALL_COMPLETED_BASE: 25,
  CALL_COMPLETED_LONG: 30, // 60+ seconds
  HIGH_QUALITY_CALL_BONUS: 15,
  PROMISE_KEPT: 20,
  PROMISE_BROKEN_PENALTY: -10,
} as const;

const STREAK_ACHIEVEMENTS: Record<number, string> = {
  7: 'week_warrior',
  14: 'fortnight_fighter',
  30: 'monthly_master',
  60: 'two_month_titan',
  90: 'quarter_champion',
  180: 'half_year_hero',
  365: 'year_legend',
};

const CALL_ACHIEVEMENTS: Record<number, string> = {
  1: 'first_call',
  10: 'ten_calls',
  50: 'fifty_calls',
  100: 'hundred_calls',
  500: 'five_hundred_calls',
};

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Register all gamification-related event handlers
 */
export function registerGamificationEventHandlers(bus: EventBus): void {
  // XP Awards
  bus.on('subscription.created', handleSubscriptionCreatedXP);
  bus.on('onboarding.completed', handleOnboardingCompletedXP);
  bus.on('call.completed', handleCallCompletedXP);
  bus.on('promise.kept', handlePromiseKeptXP);
  bus.on('promise.broken', handlePromiseBrokenXP);

  // Achievement Checks
  bus.on('streak.updated', handleStreakAchievements);
  bus.on('call.completed', handleCallAchievements);

  console.log('[Gamification] Event handlers registered');
}

// ═══════════════════════════════════════════════════════════════════════════
// XP AWARD HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

const handleSubscriptionCreatedXP: EventHandler<
  EventByType<'subscription.created'>
> = async (event, ctx) => {
  await awardXP(
    ctx.env,
    event.userId,
    XP_AWARDS.SUBSCRIPTION_CREATED,
    'first_subscription'
  );
};

const handleOnboardingCompletedXP: EventHandler<
  EventByType<'onboarding.completed'>
> = async (event, ctx) => {
  // Base XP for completing onboarding
  await awardXP(
    ctx.env,
    event.userId,
    XP_AWARDS.ONBOARDING_COMPLETED,
    'onboarding_complete'
  );

  // Bonus XP for voice cloning
  if (event.voiceCloned) {
    await awardXP(
      ctx.env,
      event.userId,
      XP_AWARDS.VOICE_CLONED_BONUS,
      'voice_cloned'
    );
  }
};

const handleCallCompletedXP: EventHandler<EventByType<'call.completed'>> = async (
  event,
  ctx
) => {
  // Base XP based on call duration
  const baseXP =
    event.summary.callDurationSeconds >= 60
      ? XP_AWARDS.CALL_COMPLETED_LONG
      : XP_AWARDS.CALL_COMPLETED_BASE;

  await awardXP(ctx.env, event.userId, baseXP, 'call_completed');

  // Bonus for high quality call
  if (event.summary.callQualityScore >= 0.8) {
    await awardXP(
      ctx.env,
      event.userId,
      XP_AWARDS.HIGH_QUALITY_CALL_BONUS,
      'high_quality_call'
    );
  }
};

const handlePromiseKeptXP: EventHandler<EventByType<'promise.kept'>> = async (
  event,
  ctx
) => {
  await awardXP(ctx.env, event.userId, XP_AWARDS.PROMISE_KEPT, 'promise_kept');
};

const handlePromiseBrokenXP: EventHandler<EventByType<'promise.broken'>> = async (
  event,
  ctx
) => {
  // Penalty - no multiplier applied
  await awardXP(
    ctx.env,
    event.userId,
    XP_AWARDS.PROMISE_BROKEN_PENALTY,
    'promise_broken',
    false
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

const handleStreakAchievements: EventHandler<
  EventByType<'streak.updated'>
> = async (event, ctx) => {
  const achievementId = STREAK_ACHIEVEMENTS[event.newStreak];
  if (achievementId) {
    await unlockAchievement(ctx.env, event.userId, achievementId);
  }
};

const handleCallAchievements: EventHandler<EventByType<'call.completed'>> = async (
  event,
  ctx
) => {
  const supabase = createSupabaseClient(ctx.env);

  const { data: status } = await supabase
    .from('status')
    .select('total_calls_completed')
    .eq('user_id', event.userId)
    .maybeSingle();

  const totalCalls = status?.total_calls_completed || 0;
  const achievementId = CALL_ACHIEVEMENTS[totalCalls];

  if (achievementId) {
    await unlockAchievement(ctx.env, event.userId, achievementId);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get streak multiplier based on current streak days
 */
function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

/**
 * Award XP to a user with optional streak multiplier
 */
async function awardXP(
  env: Env,
  userId: string,
  baseAmount: number,
  reason: string,
  applyMultiplier: boolean = true
): Promise<void> {
  const supabase = createSupabaseClient(env);

  // Get current streak for multiplier
  let multiplier = 1.0;
  if (applyMultiplier && baseAmount > 0) {
    const { data: status } = await supabase
      .from('status')
      .select('current_streak_days')
      .eq('user_id', userId)
      .maybeSingle();

    multiplier = getStreakMultiplier(status?.current_streak_days || 0);
  }

  const finalAmount = Math.floor(baseAmount * multiplier);

  // Log the XP award (in future, this would write to xp_transactions table)
  console.log(
    `[Gamification] Awarded ${finalAmount} XP to ${userId} for ${reason} (${multiplier}x multiplier)`
  );

  // TODO: When xp_transactions and user_progression tables exist, save to DB:
  // await supabase.from('xp_transactions').insert({
  //   user_id: userId,
  //   amount: finalAmount,
  //   reason,
  //   multiplier_applied: multiplier,
  //   base_amount: baseAmount,
  // });
  //
  // await supabase.rpc('add_user_xp', {
  //   p_user_id: userId,
  //   p_amount: finalAmount,
  // });
}

/**
 * Unlock an achievement for a user
 */
async function unlockAchievement(
  env: Env,
  userId: string,
  achievementId: string
): Promise<void> {
  // Log the achievement (in future, this would write to user_achievements table)
  console.log(
    `[Gamification] Achievement unlocked for ${userId}: ${achievementId}`
  );

  // TODO: When achievements and user_achievements tables exist:
  // const supabase = createSupabaseClient(env);
  //
  // // Check if already unlocked
  // const { data: existing } = await supabase
  //   .from('user_achievements')
  //   .select('id')
  //   .eq('user_id', userId)
  //   .eq('achievement_id', achievementId)
  //   .maybeSingle();
  //
  // if (existing) {
  //   return; // Already unlocked
  // }
  //
  // // Get achievement definition for XP bonus
  // const { data: achievement } = await supabase
  //   .from('achievements')
  //   .select('xp_bonus')
  //   .eq('id', achievementId)
  //   .single();
  //
  // // Unlock achievement
  // await supabase.from('user_achievements').insert({
  //   user_id: userId,
  //   achievement_id: achievementId,
  //   unlocked_at: new Date().toISOString(),
  // });
  //
  // // Award XP bonus
  // if (achievement?.xp_bonus) {
  //   await awardXP(env, userId, achievement.xp_bonus, `achievement_${achievementId}`, false);
  // }
}





