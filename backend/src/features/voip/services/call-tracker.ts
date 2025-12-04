/**
 * VoIP Call Tracker Service
 *
 * This module tracks sent calls and detects when users don't acknowledge them.
 * It implements a timeout-based system that automatically triggers retry logic
 * when calls go unanswered for a specified period.
 *
 * Note: This is being deprecated in favor of Cartesia Line phone calls,
 * but keeping for backward compatibility during transition.
 *
 * Key Features:
 * - Tracks all sent calls with unique UUIDs
 * - Implements 10-minute timeout for call acknowledgment
 * - Automatically triggers retry logic on timeout
 * - Clears tracking when calls are acknowledged
 * - Provides debugging and monitoring capabilities
 *
 * Call Lifecycle:
 * 1. Call sent → Tracked with timeout
 * 2. User answers → Acknowledged, tracking cleared
 * 3. User ignores → Timeout triggers retry logic
 * 4. Retry sent → New tracking cycle begins
 */

import { CallType } from "@/types/database";
import { clearCallRetries, handleMissedCall } from "@/features/call/services/call-retry-handler";
import { createSupabaseClient, saveCallAnalytics, acknowledgeCall as dbAcknowledgeCall } from "@/features/core/utils/database";

/**
 * Represents a call that was sent and is being tracked for acknowledgment
 */
interface PendingCall {
  userId: string;
  callUUID: string;
  callType: CallType;
  sentAt: string;
  timeoutId: NodeJS.Timeout;
  acknowledged: boolean;
}

// In-memory tracking of pending calls
// Key: callUUID, Value: PendingCall object
const pendingCalls = new Map<string, PendingCall>();

/**
 * Track a call that was sent and schedule timeout detection
 *
 * This function is called immediately after a call is initiated.
 * It sets up a 10-minute timeout to detect if user doesn't acknowledge
 * call, which would trigger retry logic.
 *
 * @param userId The user ID who received call
 * @param callUUID The unique identifier for this call
 * @param callType The type of call that was sent
 * @param env Environment variables for retry handler
 */
export async function trackSentCall(
  userId: string,
  callUUID: string,
  callType: CallType,
  env: any,
): Promise<void> {
  // Store in call_analytics table with 10-minute timeout
  const timeoutAt = new Date(Date.now() + 10 * 60 * 1000);

  await saveCallAnalytics(env, userId, {
    call_type: callType,
    conversation_id: callUUID,
    mood: "unknown",
    call_duration_seconds: 0,
    call_quality_score: 0,
    commitment_is_specific: false,
    sentiment_trajectory: [],
    excuses_detected: [],
    quotes_captured: [],
    is_retry: false,
    retry_attempt_number: 0,
    acknowledged: false,
    call_successful: "unknown",
    timeout_at: timeoutAt.toISOString(),
    source: "voip",
  });

  console.log(
    `📞 Tracked call ${callUUID} with timeout at ${timeoutAt.toISOString()}`,
  );
}

/**
 * Handle call timeout - trigger retry logic when call not acknowledged
 *
 * This function is called by the timeout when a user hasn't acknowledged
 * a call within 10 minutes. It triggers to retry logic from call-retry-handler
 * to send an escalated follow-up call.
 *
 * @param userId The user ID who didn't acknowledge call
 * @param callUUID The UUID of call that timed out
 * @param callType The type of call that timed out
 * @param env Environment variables for retry handler
 */
async function handleCallTimeout(
  userId: string,
  callUUID: string,
  callType: CallType,
  env: any,
): Promise<void> {
  const pendingCall = pendingCalls.get(callUUID);

  if (!pendingCall) {
    console.log(`⚠️ No pending call found for UUID ${callUUID}`);
    return;
  }

  // If call was already acknowledged, don't trigger retry
  if (pendingCall.acknowledged) {
    console.log(`✅ Call ${callUUID} already acknowledged, skipping timeout`);
    pendingCalls.delete(callUUID);
    return;
  }

  console.log(
    `⏰ Call timeout detected for user ${userId}, call ${callUUID} - triggering retry logic`,
  );

  try {
    // Trigger the existing retry logic from call-retry-handler
    await handleMissedCall(
      userId,
      callType,
      callUUID,
      "missed",
      env,
    );

    // Clean up tracking since we're moving to retry phase
    pendingCalls.delete(callUUID);

    console.log(
      `🔄 Retry logic triggered for user ${userId} due to missed acknowledgment`,
    );
  } catch (error) {
    console.error(`💥 Error handling call timeout for user ${userId}:`, error);
  }
}

/**
 * Mark call as acknowledged and cancel timeout
 *
 * This function should be called when frontend confirms that a user
 * has answered or acknowledged a call. It prevents unnecessary retries
 * and cleans up tracking resources.
 *
 * @param callUUID The UUID of call being acknowledged
 * @returns True if call was found and acknowledged, false otherwise
 */
export async function acknowledgeCall(
  callUUID: string,
  env: any,
): Promise<boolean> {
  const supabase = createSupabaseClient(env);

  console.log(`🔍 Attempting to acknowledge call UUID: ${callUUID}`);

  const { data, error } = await supabase
    .from("call_analytics")
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("conversation_id", callUUID)
    .eq("acknowledged", false)
    .select("user_id, call_type, is_retry")
    .single();

  if (error || !data) {
    console.error(`❌ Failed to acknowledge call ${callUUID}:`, error);
    console.log(`🔍 Checking if call exists with different status...`);
    
    // Debug: Check if call exists at all
    const { data: existingCall } = await supabase
      .from("call_analytics")
      .select("id, acknowledged, acknowledged_at")
      .eq("conversation_id", callUUID)
      .single();
    
    if (existingCall) {
      console.log(`📋 Call exists but acknowledged=${existingCall.acknowledged}, acknowledged_at=${existingCall.acknowledged_at}`);
    } else {
      console.log(`❌ No call found with UUID ${callUUID}`);
    }
    
    return false;
  }

  // Clear retry tracking if this was a retry
  if (data.is_retry) {
    console.log(`🔄 Clearing retry tracking for user ${data.user_id} - ${data.call_type}`);
    await clearCallRetries(data.user_id, data.call_type as CallType, env);
  }

  console.log(`✅ Successfully acknowledged call ${callUUID}`);
  return true;
}

/**
 * Get pending call status (for debugging)
 *
 * This function allows external systems to check if a specific call
 * is being tracked and its current status.
 *
 * @param callUUID The UUID of call to check
 * @returns The pending call object if found, null otherwise
 */
export function getPendingCallStatus(callUUID: string): PendingCall | null {
  return pendingCalls.get(callUUID) || null;
}

/**
 * Get all pending calls (for debugging/monitoring)
 *
 * This function returns all currently tracked calls, useful for
 * monitoring system health and debugging issues.
 *
 * @returns Array of all pending call objects
 */
export function getAllPendingCalls(): PendingCall[] {
  return Array.from(pendingCalls.values());
}

/**
 * Clear all pending calls (for testing/cleanup)
 *
 * This function clears all tracked calls and cancels their timeouts.
 * Useful for testing or system cleanup scenarios.
 */
export function clearAllPendingCalls(): void {
  for (const [callUUID, pendingCall] of pendingCalls.entries()) {
    clearTimeout(pendingCall.timeoutId);
    pendingCalls.delete(callUUID);
  }
  console.log("🧹 All pending calls cleared");
}