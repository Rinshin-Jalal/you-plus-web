/**
 * Gamification Event Handlers
 *
 * Awards XP and unlocks achievements based on domain events.
 * Dispatches to Cloudflare Queue for async processing and DB persistence.
 *
 * XP Multipliers based on streak:
 * - 3+ days: 1.1x
 * - 7+ days: 1.25x
 * - 14+ days: 1.5x
 * - 30+ days: 2.0x
 */

import type { EventBus, EventHandler } from "@/events/bus";
import type { EventByType } from "@/events/types";
import type { Env } from "@/types/environment";
import type { GamificationPayload } from "@/queues/gamification";

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Register all gamification-related event handlers
 */
export function registerGamificationEventHandlers(bus: EventBus): void {
  // XP Awards - queue for async processing
  bus.on("subscription.created", handleSubscriptionCreatedXP);
  bus.on("onboarding.completed", handleOnboardingCompletedXP);
  bus.on("call.completed", handleCallCompletedXP);
  bus.on("promise.kept", handlePromiseKeptXP);
  bus.on("promise.broken", handlePromiseBrokenXP);

  // Achievement Checks - queue for async processing
  bus.on("streak.updated", handleStreakAchievements);
  bus.on("call.completed", handleCallAchievements);

  console.log("[Gamification] Event handlers registered");
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS (Queue dispatch)
// ═══════════════════════════════════════════════════════════════════════════

const handleSubscriptionCreatedXP: EventHandler<
  EventByType<"subscription.created">
> = async (event, ctx) => {
  await ctx.env.GAMIFICATION_QUEUE.send({
    eventType: "subscription.created",
    userId: event.userId,
  });
};

const handleOnboardingCompletedXP: EventHandler<
  EventByType<"onboarding.completed">
> = async (event, ctx) => {
  const payload: GamificationPayload = {
    eventType: "onboarding.completed",
    userId: event.userId,
  };
  if (event.voiceCloned) {
    payload.voiceCloned = event.voiceCloned;
  }
  await ctx.env.GAMIFICATION_QUEUE.send(payload);
};

const handleCallCompletedXP: EventHandler<EventByType<"call.completed">> = async (
  event,
  ctx
) => {
  const payload: GamificationPayload = {
    eventType: "call.completed",
    userId: event.userId,
    callDurationSeconds: event.summary.callDurationSeconds,
    callQualityScore: event.summary.callQualityScore,
  };
  if (event.summary.totalCallsCompleted !== undefined) {
    payload.totalCallsCompleted = event.summary.totalCallsCompleted;
  }
  await ctx.env.GAMIFICATION_QUEUE.send(payload);
};

const handlePromiseKeptXP: EventHandler<EventByType<"promise.kept">> = async (
  event,
  ctx
) => {
  await ctx.env.GAMIFICATION_QUEUE.send({
    eventType: "promise.kept",
    userId: event.userId,
    commitment: event.commitment,
  });
};

const handlePromiseBrokenXP: EventHandler<EventByType<"promise.broken">> = async (
  event,
  ctx
) => {
  const payload: GamificationPayload = {
    eventType: "promise.broken",
    userId: event.userId,
  };
  if (event.excuse !== undefined) {
    payload.excuse = event.excuse;
  }
  await ctx.env.GAMIFICATION_QUEUE.send(payload);
};

const handleStreakAchievements: EventHandler<
  EventByType<"streak.updated">
> = async (event, ctx) => {
  await ctx.env.GAMIFICATION_QUEUE.send({
    eventType: "streak.updated",
    userId: event.userId,
    newStreak: event.newStreak,
    previousStreak: event.previousStreak,
  });
};

const handleCallAchievements: EventHandler<EventByType<"call.completed">> = async (
  event,
  ctx
) => {
  // Call achievements are handled in the queue based on totalCallsCompleted
  // This handler can be used for any call-specific achievement logic
};






