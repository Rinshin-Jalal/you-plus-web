import { CallType } from "@/types/database";
import { getUserContext } from "@/features/core/utils/database";
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";

export async function handleMissedCall(
  userId: string,
  callType: CallType,
  callUUID: string,
  reason: "missed" | "declined" | "failed",
  env: Env,
): Promise<void> {
  const supabase = createSupabaseClient(env);

  console.log(`📞 Handling missed call for user ${userId}, reason: ${reason}`);

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

    if (retryAttemptNumber > 3) {
      console.log(`🚫 Max retries reached for user ${userId}`);
      return;
    }
  }

  const retryCallUUID = generateCallUUID(callType);
  const timeoutAt = new Date(Date.now() + getRetryDelay(retryAttemptNumber));

  const { error } = await supabase
    .from("calls")
    .insert({
      user_id: userId,
      call_type: callType,
      conversation_id: retryCallUUID, // Store retry UUID for acknowledgment
      audio_url: "",
      duration_sec: 0,
      status: "scheduled",
      call_successful: "unknown",
      source: "elevenlabs",
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

  const userContext = await getUserContext(env, userId);
  const recentFailures = userContext.recentStreakPattern?.filter((p) =>
    p.status === "broken"
  );

  console.log("userContext", userContext);

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

export async function clearCallRetries(
  userId: string,
  callType: CallType,
  env: Env,
): Promise<void> {
  const supabase = createSupabaseClient(env);

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

function getEscalatedUrgency(
  attemptNumber: number,
): "high" | "critical" | "emergency" {
  if (attemptNumber === 1) return "high";
  if (attemptNumber === 2) return "critical";
  return "emergency";
}

function getEscalatedMessage(attemptNumber: number, userContext?: any): string {
  const baseMessages = {
    1: "You missed your accountability call. This is your first warning.",
    2: "You've missed multiple calls. This is getting serious.",
    3: "Final warning: You're ignoring your commitments.",
  };

  return baseMessages[attemptNumber as keyof typeof baseMessages] ||
    baseMessages[3];
}

function getRetryDelay(attemptNumber: number): number {
  const delays = [10 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];
  return delays[Math.min(attemptNumber - 1, delays.length - 1)] || 0;
}