/**
 * Call Event Handlers
 *
 * Processes call-related events:
 * - call.completed: Save analytics, update streak, emit secondary events
 * - call.started: Log call initiation
 * - call.missed: Handle missed calls
 */

import type { EventBus, EventHandler } from '@/events/bus';
import type { EventByType } from '@/events/types';
import { createSupabaseClient } from '@/features/core/utils/database';
import { eventBus } from '@/events';

/**
 * Register all call-related event handlers
 */
export function registerCallEventHandlers(bus: EventBus): void {
  bus.on('call.completed', handleCallCompleted);
  bus.on('call.started', handleCallStarted);
  bus.on('call.missed', handleCallMissed);

  console.log('[Core] Call event handlers registered');
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

const handleCallCompleted: EventHandler<EventByType<'call.completed'>> = async (
  event,
  ctx
) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(
    `[Core] Processing call.completed for user ${event.userId}, call ${event.callId}`
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Save call analytics
  // ─────────────────────────────────────────────────────────────────────────
  const { error: analyticsError } = await supabase.from('call_analytics').insert({
    user_id: event.userId,
    conversation_id: event.callId,
    call_duration_seconds: event.summary.callDurationSeconds,
    promise_kept: event.summary.promiseKept,
    tomorrow_commitment: event.summary.tomorrowCommitment,
    commitment_time: event.summary.commitmentTime,
    commitment_is_specific: event.summary.commitmentIsSpecific,
    sentiment_trajectory: event.summary.sentimentTrajectory.map((s, i) => ({
      timestamp: new Date(Date.now() - (event.summary.sentimentTrajectory.length - i) * 10000).toISOString(),
      sentiment: s,
      score: 0.5,
    })),
    excuses_detected: event.summary.excusesDetected.map((e) => ({
      excuse: e,
      pattern: 'general',
      confidence: 0.8,
    })),
    quotes_captured: event.summary.quotesCaptured.map((q) => ({
      quote: q,
      context: 'call',
    })),
    call_type: event.summary.callType,
    mood: event.summary.mood,
    call_quality_score: event.summary.callQualityScore,
    is_retry: false,
    retry_attempt_number: 0,
    acknowledged: false,
    call_successful: 'success',
  });

  if (analyticsError) {
    console.error('[Core] Failed to save call analytics:', analyticsError);
    // Don't throw - we want other processing to continue
  } else {
    console.log(`[Core] Call analytics saved for ${event.callId}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Update user status (streak, call count, last_call_at)
  // ─────────────────────────────────────────────────────────────────────────
  const { data: status, error: statusFetchError } = await supabase
    .from('status')
    .select('current_streak_days, longest_streak_days, total_calls_completed')
    .eq('user_id', event.userId)
    .maybeSingle();

  if (statusFetchError && statusFetchError.code !== 'PGRST116') {
    console.error('[Core] Failed to fetch status:', statusFetchError);
  }

  const currentStreak = status?.current_streak_days || 0;
  const newStreak = currentStreak + 1;
  const longestStreak = Math.max(status?.longest_streak_days || 0, newStreak);
  const totalCalls = (status?.total_calls_completed || 0) + 1;

  const { error: statusError } = await supabase.from('status').upsert(
    {
      user_id: event.userId,
      current_streak_days: newStreak,
      longest_streak_days: longestStreak,
      total_calls_completed: totalCalls,
      last_call_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (statusError) {
    console.error('[Core] Failed to update status:', statusError);
  } else {
    console.log(
      `[Core] Status updated: streak ${currentStreak} → ${newStreak}, total calls: ${totalCalls}`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Update call memory with latest commitment
  // ─────────────────────────────────────────────────────────────────────────
  if (event.summary.tomorrowCommitment) {
    const { error: memoryError } = await supabase.from('call_memory').upsert(
      {
        user_id: event.userId,
        last_call_type: event.summary.callType,
        last_mood: event.summary.mood,
        last_commitment: event.summary.tomorrowCommitment,
        last_commitment_time: event.summary.commitmentTime,
        last_commitment_specific: event.summary.commitmentIsSpecific,
      },
      { onConflict: 'user_id' }
    );

    if (memoryError) {
      console.error('[Core] Failed to update call memory:', memoryError);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Emit secondary events based on call outcome
  // ─────────────────────────────────────────────────────────────────────────

  // Promise kept/broken events
  if (event.summary.promiseKept === true) {
    await eventBus.emit(
      {
        type: 'promise.kept',
        userId: event.userId,
        commitment: event.summary.tomorrowCommitment || '',
      },
      ctx.env
    );
  } else if (event.summary.promiseKept === false) {
    const excuse = event.summary.excusesDetected[0];
    await eventBus.emit(
      {
        type: 'promise.broken',
        userId: event.userId,
        ...(excuse ? { excuse } : {}),
      },
      ctx.env
    );
  }

  // Streak update event
  await eventBus.emit(
    {
      type: 'streak.updated',
      userId: event.userId,
      newStreak,
      previousStreak: currentStreak,
    },
    ctx.env
  );

  console.log(`[Core] call.completed processing finished for ${event.userId}`);
};

const handleCallStarted: EventHandler<EventByType<'call.started'>> = async (
  event,
  ctx
) => {
  console.log(
    `[Core] Call started for user ${event.userId}, call ${event.callId}`
  );
  // Just logging for now - could be expanded to track call initiation
};

const handleCallMissed: EventHandler<EventByType<'call.missed'>> = async (
  event,
  ctx
) => {
  const supabase = createSupabaseClient(ctx.env);

  console.log(`[Core] Call missed for user ${event.userId}`);

  // Get current streak to check if we need to break it
  const { data: status } = await supabase
    .from('status')
    .select('current_streak_days')
    .eq('user_id', event.userId)
    .maybeSingle();

  const currentStreak = status?.current_streak_days || 0;

  // If they had a streak, emit streak.broken event
  // Note: In real implementation, you'd want to check if the missed call
  // was today's call and if they had a streak going
  if (currentStreak > 0) {
    console.log(
      `[Core] User ${event.userId} had ${currentStreak} day streak - may be broken`
    );
    // We don't automatically break the streak on missed call
    // The scheduled job handles streak resets based on last_call_at
  }
};






