/**
 * Call Webhook Handler
 *
 * Receives call completion data from the Python agent and emits domain events.
 * The Python agent calls this endpoint after each call to report:
 * - Call duration and quality
 * - Promise kept/broken status
 * - Commitments made for tomorrow
 * - Sentiment analysis
 * - Excuses detected
 * - Memorable quotes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '@/index';
import { eventBus } from '@/events';
import { zodJson } from '@/middleware/zod';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const CallCompletedSchema = z.object({
  user_id: z.string().uuid(),
  call_id: z.string(),
  call_duration_seconds: z.number().min(0),
  promise_kept: z.boolean().nullable(),
  tomorrow_commitment: z.string().nullable(),
  commitment_time: z.string().nullable(),
  commitment_is_specific: z.boolean().default(false),
  sentiment_trajectory: z.array(z.string()).default([]),
  excuses_detected: z.array(z.string()).default([]),
  quotes_captured: z.array(z.string()).default([]),
  call_type: z.string().default('audit'),
  mood: z.string().default('warm_direct'),
  call_quality_score: z.number().min(0).max(1).default(0.5),
});

const CallStartedSchema = z.object({
  user_id: z.string().uuid(),
  call_id: z.string(),
});

const CallMissedSchema = z.object({
  user_id: z.string().uuid(),
  scheduled_for: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

const callWebhook = new Hono<{ Bindings: Env }>();

/**
 * POST /webhook/call/completed
 *
 * Called by Python agent when a call completes successfully.
 * Emits call.completed event which triggers:
 * - Analytics storage
 * - Streak updates
 * - XP awards
 * - Achievement checks
 */
callWebhook.post('/completed', zodJson(CallCompletedSchema, { errorMessage: "Invalid payload" }), async (c) => {
  try {
    const data = c.get("validatedJson") as z.infer<typeof CallCompletedSchema>;
    console.log(
      `[CallWebhook] Call completed for user ${data.user_id}, call ${data.call_id}`
    );

    // Emit the call.completed event
    await eventBus.emit(
      {
        type: 'call.completed',
        userId: data.user_id,
        callId: data.call_id,
        summary: {
          callDurationSeconds: data.call_duration_seconds,
          promiseKept: data.promise_kept,
          tomorrowCommitment: data.tomorrow_commitment,
          commitmentTime: data.commitment_time,
          commitmentIsSpecific: data.commitment_is_specific,
          sentimentTrajectory: data.sentiment_trajectory,
          excusesDetected: data.excuses_detected,
          quotesCaptured: data.quotes_captured,
          callType: data.call_type,
          mood: data.mood,
          callQualityScore: data.call_quality_score,
        },
      },
      c.env
    );

    return c.json({ received: true, eventType: 'call.completed' });
  } catch (error) {
    console.error('[CallWebhook] Error processing call.completed:', error);
    return c.json({ error: 'Processing failed' }, 500);
  }
});

/**
 * POST /webhook/call/started
 *
 * Called by Python agent when a call starts.
 * Useful for tracking call initiation.
 */
callWebhook.post('/started', zodJson(CallStartedSchema, { errorMessage: "Invalid payload" }), async (c) => {
  try {
    const data = c.get("validatedJson") as z.infer<typeof CallStartedSchema>;
    console.log(
      `[CallWebhook] Call started for user ${data.user_id}, call ${data.call_id}`
    );

    await eventBus.emit(
      {
        type: 'call.started',
        userId: data.user_id,
        callId: data.call_id,
      },
      c.env
    );

    return c.json({ received: true, eventType: 'call.started' });
  } catch (error) {
    console.error('[CallWebhook] Error processing call.started:', error);
    return c.json({ error: 'Processing failed' }, 500);
  }
});

/**
 * POST /webhook/call/missed
 *
 * Called when a scheduled call was missed (user didn't answer, timeout, etc.)
 */
callWebhook.post('/missed', zodJson(CallMissedSchema, { errorMessage: "Invalid payload" }), async (c) => {
  try {
    const data = c.get("validatedJson") as z.infer<typeof CallMissedSchema>;
    console.log(`[CallWebhook] Call missed for user ${data.user_id}`);

    await eventBus.emit(
      {
        type: 'call.missed',
        userId: data.user_id,
        ...(data.scheduled_for ? { scheduledFor: data.scheduled_for } : {}),
      },
      c.env
    );

    return c.json({ received: true, eventType: 'call.missed' });
  } catch (error) {
    console.error('[CallWebhook] Error processing call.missed:', error);
    return c.json({ error: 'Processing failed' }, 500);
  }
});

export default callWebhook;





