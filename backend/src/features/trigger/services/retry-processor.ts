/**
 * Retry Processor Service
 *
 * This module handles the scheduled processing of call timeouts and retries.
 * It runs as part of the cron job to detect missed calls and send retries.
 *
 * Key Features:
 * - Processes timed out calls and triggers retries
 * - Sends escalated retry notifications
 * - Manages retry attempt limits
 * - Provides detailed logging for monitoring
 */

import { Env } from "@/index";
import { createSupabaseClient, createRetryCall, saveCallAnalytics } from "@/features/core/utils/database";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { handleMissedCall } from "@/features/call/services/call-retry-handler";
import { processCartesiaCall } from "@/features/trigger/services/cartesia-call-trigger";
import { CallType } from "@/types/database";

/**
 * Process all timed out calls and trigger retries
 */
export async function processCallTimeouts(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  console.log("⏱️ Checking for timed out calls...");

  // Find calls that have timed out (using call_analytics)
  const { data: timedOutCalls } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("acknowledged", false)
    .not("timeout_at", "is", null)
    .lte("timeout_at", new Date().toISOString())
    .limit(50);

  if (!timedOutCalls?.length) {
    console.log("✅ No timed out calls found");
    return;
  }

  console.log(`⏱️ Found ${timedOutCalls.length} timed out calls`);

  for (const call of timedOutCalls) {
    console.log(
      `⏱️ Processing timeout for call ${call.conversation_id || call.id}`,
    );

    try {
      // Trigger retry logic
      await handleMissedCall(
        call.user_id,
        call.call_type as CallType,
        call.conversation_id || call.id,
        "missed",
        env,
      );

      // Mark as timed out
      await supabase
        .from("call_analytics")
        .update({ call_successful: "missed" })
        .eq("id", call.id);

      console.log(`✅ Processed timeout for call ${call.id}`);
    } catch (error) {
      console.error(`❌ Failed to process timeout for call ${call.id}:`, error);
    }
  }
}

/**
 * Process scheduled retries that are due to be sent
 * Uses Cartesia Line for phone calls instead of VoIP push
 */
export async function processScheduledRetries(env: Env): Promise<void> {
  const supabase = createSupabaseClient(env);

  console.log("🔍 Checking for due retries...");

  // Find retries that are due (using call_analytics)
  const { data: dueRetries } = await supabase
    .from("call_analytics")
    .select("*, users!inner(id, name, phone_number)")
    .eq("is_retry", true)
    .eq("acknowledged", false)
    .not("timeout_at", "is", null)
    .lte("timeout_at", new Date().toISOString())
    .lt("retry_attempt_number", 3)
    .limit(50);

  if (!dueRetries?.length) {
    console.log("✅ No due retries found");
    return;
  }

  console.log(`🔄 Found ${dueRetries.length} due retries`);

  for (const retry of dueRetries) {
    console.log(`📞 Processing retry for user ${retry.user_id}`);

    try {
      const user = retry.users as any;
      
      if (!user?.phone_number) {
        console.log(`⚠️ No phone number for user ${retry.user_id}`);
        continue;
      }

      // Use Cartesia Line to make the retry call
      const result = await processCartesiaCall(
        { 
          id: user.id, 
          name: user.name, 
          phone_number: user.phone_number 
        } as any,
        retry.call_type as CallType,
        env
      );

      if (result.success) {
        console.log(
          `✅ Sent retry ${retry.retry_attempt_number} for user ${retry.user_id}`,
        );
      } else {
        console.log(
          `⚠️ Failed to send retry for user ${retry.user_id}: ${result.error}`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Failed to process retry for user ${retry.user_id}:`,
        error,
      );
    }
  }
}

/**
 * Generate escalating message based on retry attempt number
 */
function getEscalatedMessage(attemptNumber: number): string {
  const baseMessages = {
    1: "You missed your accountability call. This is your first warning.",
    2: "You've missed multiple calls. This is getting serious.",
    3: "Final warning: You're ignoring your commitments.",
  };

  return baseMessages[attemptNumber as keyof typeof baseMessages] ||
    baseMessages[3];
}

/**
 * Main function to process all retry-related tasks
 */
export async function processAllRetries(env: Env): Promise<void> {
  console.log("🚀 Starting retry processing...");

  try {
    await processCallTimeouts(env);
    await processScheduledRetries(env);
    console.log("✅ Retry processing complete");
  } catch (error) {
    console.error("❌ Retry processing failed:", error);
  }
}