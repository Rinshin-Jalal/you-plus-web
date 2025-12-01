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
import { createSupabaseClient } from "@/features/core/utils/database";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { trackSentCall } from "@/features/voip/services/call-tracker";
import { handleMissedCall } from "@/features/call/services/call-retry-handler";
/**
 * Process all timed out calls and trigger retries
 */
export async function processCallTimeouts(env) {
    const supabase = createSupabaseClient(env);
    console.log("⏱️ Checking for timed out calls...");
    // Find calls that have timed out
    const { data: timedOutCalls } = await supabase
        .from("calls")
        .select("*")
        .eq("acknowledged", false)
        .lte("timeout_at", new Date().toISOString())
        .limit(50);
    if (!timedOutCalls?.length) {
        console.log("✅ No timed out calls found");
        return;
    }
    console.log(`⏱️ Found ${timedOutCalls.length} timed out calls`);
    for (const call of timedOutCalls) {
        console.log(`⏱️ Processing timeout for call ${call.conversation_id || call.id}`);
        try {
            // Trigger retry logic
            await handleMissedCall(call.user_id, call.call_type, call.conversation_id || call.id, "missed", env);
            // Mark as processed
            await supabase
                .from("calls")
                .update({ status: "timeout" })
                .eq("id", call.id);
            console.log(`✅ Processed timeout for call ${call.id}`);
        }
        catch (error) {
            console.error(`❌ Failed to process timeout for call ${call.id}:`, error);
        }
    }
}
/**
 * Process scheduled retries that are due to be sent
 */
export async function processScheduledRetries(env) {
    const supabase = createSupabaseClient(env);
    console.log("🔍 Checking for due retries...");
    // Find retries that are due
    const { data: dueRetries } = await supabase
        .from("calls")
        .select("*")
        .eq("is_retry", true)
        .eq("acknowledged", false)
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
            // Get user's push token
            const { data: user } = await supabase
                .from("users")
                .select("push_token")
                .eq("id", retry.user_id)
                .single();
            if (!user?.push_token) {
                console.log(`⚠️ No push token for user ${retry.user_id}`);
                continue;
            }
            // Send retry call
            const callUUID = generateCallUUID(retry.call_type);
            await sendVoipPushNotification(user.push_token, {
                userId: retry.user_id,
                callType: retry.call_type,
                type: "accountability_call_retry",
                callUUID,
                urgency: retry.urgency,
                attemptNumber: retry.retry_attempt_number,
                retryReason: retry.retry_reason,
                message: getEscalatedMessage(retry.retry_attempt_number),
            }, {
                IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
                IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
                IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
            });
            // Track the new call
            await trackSentCall(retry.user_id, callUUID, retry.call_type, env);
            console.log(`✅ Sent retry ${retry.retry_attempt_number} for user ${retry.user_id}`);
        }
        catch (error) {
            console.error(`❌ Failed to process retry for user ${retry.user_id}:`, error);
        }
    }
}
/**
 * Generate escalating message based on retry attempt number
 */
function getEscalatedMessage(attemptNumber) {
    const baseMessages = {
        1: "You missed your accountability call. This is your first warning.",
        2: "You've missed multiple calls. This is getting serious.",
        3: "Final warning: You're ignoring your commitments.",
    };
    return baseMessages[attemptNumber] ||
        baseMessages[3];
}
/**
 * Main function to process all retry-related tasks
 */
export async function processAllRetries(env) {
    console.log("🚀 Starting retry processing...");
    try {
        await processCallTimeouts(env);
        await processScheduledRetries(env);
        console.log("✅ Retry processing complete");
    }
    catch (error) {
        console.error("❌ Retry processing failed:", error);
    }
}
