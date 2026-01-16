/**
 * Call Event Handlers
 *
 * Processes call-related events by dispatching to Cloudflare Queues:
 * - call.completed: Queue analytics processing, status updates, and secondary events
 * - call.started: Log call initiation
 * - call.missed: Handle missed calls
 */

import type { EventBus, EventHandler } from "@/events/bus";
import type { EventByType } from "@/events/types";
import type { Env } from "@/types/environment";
import type { CallAnalyticsPayload } from "@/queues/call-analytics";

/**
 * Register all call-related event handlers
 */
export function registerCallEventHandlers(bus: EventBus): void {
  bus.on("call.completed", handleCallCompleted);
  bus.on("call.started", handleCallStarted);
  bus.on("call.missed", handleCallMissed);

  console.log("[Core] Call event handlers registered");
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

const handleCallCompleted: EventHandler<EventByType<"call.completed">> = async (
  event,
  ctx
) => {
  console.log(
    `[Core] Queueing call.completed for user ${event.userId}, call ${event.callId}`
  );

  // Dispatch to Cloudflare Queue for async processing
  // This handles: analytics insert, status update, and secondary events
  const payload: CallAnalyticsPayload = {
    userId: event.userId,
    callId: event.callId,
    callDurationSeconds: event.summary.callDurationSeconds,
    promiseKept: event.summary.promiseKept,
    tomorrowCommitment: event.summary.tomorrowCommitment,
    commitmentTime: event.summary.commitmentTime,
    commitmentIsSpecific: event.summary.commitmentIsSpecific,
    sentimentTrajectory: event.summary.sentimentTrajectory,
    excusesDetected: event.summary.excusesDetected,
    quotesCaptured: event.summary.quotesCaptured,
    callType: event.summary.callType,
    mood: event.summary.mood,
    callQualityScore: event.summary.callQualityScore,
  };

  // Send to queue for async processing
  await ctx.env.CALL_ANALYTICS_QUEUE.send(payload);
};

const handleCallStarted: EventHandler<EventByType<"call.started">> = async (
  event,
  ctx
) => {
  console.log(
    `[Core] Call started for user ${event.userId}, call ${event.callId}`
  );
  // Just logging for now - could be expanded to track call initiation
};

const handleCallMissed: EventHandler<EventByType<"call.missed">> = async (
  event,
  ctx
) => {
  console.log(`[Core] Call missed for user ${event.userId}`);

  // Note: Streak resets are now handled by nightly maintenance queue
  // The queue checks last_call_at against current date and resets streaks
  // This approach is more reliable than handling missed calls individually
};






