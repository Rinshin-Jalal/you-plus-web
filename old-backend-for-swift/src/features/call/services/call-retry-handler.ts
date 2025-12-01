/**
 * Call Retry Handler Service
 *
 * This module manages to retry logic for missed, declined, or failed accountability calls.
 * It implements an intelligent escalation system that increases urgency and messaging
 * intensity based on user behavior patterns and retry attempt number.
 *
 * Key Features:
 * - Tracks missed calls with database storage (Supabase)
 * - Implements escalating urgency (high → critical → emergency)
 * - Uses behavioral intelligence to personalize retry messages
 * - Prevents spam with maximum retry limits
 * - Schedules retries with configurable delays
 *
 * Retry Flow:
 * 1. User misses/declines call
 * 2. System tracks miss and schedules retry
 * 3. Retry executes with escalated urgency
 * 4. If still missed, escalates further
 * 5. Clears tracking when user successfully answers
 */

import { CallType } from "@/types/database";
import { getUserContext } from "@/features/core/utils/database";
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";

/**
 * Track when a user misses/declines a call and schedule retry
 *
 * This function is called when a user doesn't answer a call. It:
 * - Creates or updates a retry record in database
 * - Calculates escalating urgency based on attempt number
 * - Analyzes user behavior patterns for intelligent escalation
 * - Schedules retry with appropriate delay
 *
 * @param userId The user ID who missed call
 * @param callType The type of call that was missed
 * @param callUUID The original call UUID
 * @param reason Why call was missed (missed/declined/failed)
 * @param env Environment variables for database access
 */
export async function handleMissedCall(
  userId: string,
  callType: CallType,
  callUUID: string,
  reason: "missed" | "declined" | "failed",
  env: Env,
): Promise<void> {
  const supabase = createSupabaseClient(env);

  console.log(`📞 Handling missed call for user ${userId}, reason: ${reason}`);

  // Check if we already have retry tracking for this user/call type
  const { data: existingRetry } = await supabase
    .from("calls")
    .select("*")
    .eq("user_id", userId)
    .eq("call_type", callType)
    .eq("is_retry", true)
    .is("acknowledged", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let retryAttemptNumber = 1;
  let urgency: "high" | "critical" | "emergency" = "high";

  if (existingRetry) {
    retryAttemptNumber = (existingRetry.retry_attempt_number || 0) + 1;
    urgency = getEscalatedUrgency(retryAttemptNumber);

    // Don't exceed max retries
    if (retryAttemptNumber > 3) {
      console.log(`🚫 Max retries reached for user ${userId}`);
      return;
    }
  }

  // Create retry call record
  const retryCallUUID = generateCallUUID(callType);
  const timeoutAt = new Date(Date.now() + getRetryDelay(retryAttemptNumber));

  const { error } = await supabase
    .from("calls")
    .insert({
      user_id: userId,
      call_type: callType,
      conversation_id: retryCallUUID, // Store retry UUID for acknowledgment
      audio_url: "", // Will be set when call completes
      duration_sec: 0, // Will be set when call completes
      status: "scheduled",
      call_successful: "unknown",
      source: "elevenlabs",

      // Retry tracking fields
      is_retry: true,
      retry_attempt_number: retryAttemptNumber,
      original_call_uuid: callUUID,
      retry_reason: reason,
      urgency,
      acknowledged: false,
      timeout_at: timeoutAt.toISOString(),
    });

  if (error) {
    console.error("Failed to create retry call record:", error);
    throw error;
  }

  // Get user context for intelligent consequence escalation
  const userContext = await getUserContext(env, userId);
  const recentFailures = userContext.recentStreakPattern?.filter((p) =>
    p.status === "broken"
  );

  console.log("userContext", userContext);

  // Send to retry call
  await sendVoipPushNotification(
    userContext.user.push_token || "",
    {
      userId,
      callType,
      type: "accountability_call_retry",
      callUUID: retryCallUUID,
      urgency,
      attemptNumber: retryAttemptNumber,
      retryReason: reason,
      message: getEscalatedMessage(retryAttemptNumber, userContext),
    },
    {
      IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
      IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
      IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
    },
  );

  console.log(
    `⏰ Retry ${retryAttemptNumber} scheduled for ${timeoutAt.toISOString()}`,
  );
}

/**
 * Execute a retry call with escalated intensity
 *
 * This function is called by scheduled timeout and:
 * - Fetches fresh user data to ensure push token is still valid
 * - Sends an escalated VoIP push notification
 * - Handles push failures with additional retry logic
 * - Logs all outcomes for monitoring
 *
 * @param retryRecord The complete retry record for this user/callType
 * @param retryAttempt The specific attempt being executed
 * @param env Environment variables for database and API access
 */
export async function clearCallRetries(
  userId: string,
  callType: CallType,
  env: Env,
): Promise<void> {
  const supabase = createSupabaseClient(env);

  // Mark all pending retries as acknowledged
  await supabase
    .from("calls")
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("call_type", callType)
    .eq("is_retry", true)
    .eq("acknowledged", false);

  console.log(`✅ Cleared retry tracking for ${userId} - ${callType}`);
}

/**
 * Get retry status for debugging
 */
export async function getRetryStatus(
  userId: string,
  callType: CallType,
  env: Env,
): Promise<any> {
  const supabase = createSupabaseClient(env);

  const { data } = await supabase
    .from("calls")
    .select("*")
    .eq("user_id", userId)
    .eq("call_type", callType)
    .eq("is_retry", true)
    .order("created_at", { ascending: false });

  return data;
}

/**
 * Get escalated urgency based on attempt number
 *
 * Urgency increases with each retry attempt:
 * - Attempt 1: High urgency
 * - Attempt 2: Critical urgency
 * - Attempt 3+: Emergency urgency
 *
 * @param attemptNumber The current retry attempt number (1-based)
 * @returns The urgency level for this attempt
 */
function getEscalatedUrgency(
  attemptNumber: number,
): "high" | "critical" | "emergency" {
  if (attemptNumber === 1) return "high";
  if (attemptNumber === 2) return "critical";
  return "emergency";
}

/**
 * Generate escalating message based on attempt number and user context
 */
function getEscalatedMessage(attemptNumber: number, userContext?: any): string {
  const baseMessages = {
    1: "You missed your accountability call. This is your first warning.",
    2: "You've missed multiple calls. This is getting serious.",
    3: "Final warning: You're ignoring your commitments.",
  };

  return baseMessages[attemptNumber as keyof typeof baseMessages] ||
    baseMessages[3];
}

/**
 * Calculate retry delay based on attempt number
 */
function getRetryDelay(attemptNumber: number): number {
  // Progressive delays: 10min, 30min, 1hr
  const delays = [10 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];
  return delays[Math.min(attemptNumber - 1, delays.length - 1)] || 0;
}