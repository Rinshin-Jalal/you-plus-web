import { getUserContext, createSupabaseClient, createRetryCall } from "@/features/core/utils/database";
import { Env } from "@/index";

type RetryReason = "missed" | "declined" | "failed";
type Urgency = "high" | "critical" | "emergency";

export async function handleMissedCall(
  userId: string,
  callType: string,
  callId: string,
  reason: RetryReason,
  env: Env
): Promise<void> {
  const supabase = createSupabaseClient(env);

  console.log(`Handling missed call for user ${userId}, reason: ${reason}`);

  // Check for existing unacknowledged retries
  const { data: existingRetry } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("user_id", userId)
    .eq("call_type", callType)
    .eq("is_retry", true)
    .eq("acknowledged", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let retryAttemptNumber = 1;
  let urgency: Urgency = "high";

  if (existingRetry) {
    retryAttemptNumber = (existingRetry.retry_attempt_number || 0) + 1;
    urgency = getEscalatedUrgency(retryAttemptNumber);

    if (retryAttemptNumber > 3) {
      console.log(`Max retries reached for user ${userId}`);
      return;
    }
  }

  // Create retry call record
  const timeoutAt = new Date(Date.now() + getRetryDelay(retryAttemptNumber));

  const retryCall = await createRetryCall(env, userId, callId, retryAttemptNumber, reason);

  // Update with timeout
  await supabase
    .from("call_analytics")
    .update({ timeout_at: timeoutAt.toISOString() })
    .eq("id", retryCall.id);

  // Get user context for notification message
  const userContext = await getUserContext(env, userId);
  const message = getEscalatedMessage(retryAttemptNumber, userContext);

  console.log(
    `Retry ${retryAttemptNumber} scheduled for ${timeoutAt.toISOString()}, urgency: ${urgency}`
  );

  // TODO: Send push notification or trigger call
  // This depends on your push notification service implementation
  console.log(`Would send notification to user ${userId}: ${message}`);
}

export async function clearCallRetries(
  userId: string,
  callType: string,
  env: Env
): Promise<void> {
  const supabase = createSupabaseClient(env);

  await supabase
    .from("call_analytics")
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("call_type", callType)
    .eq("is_retry", true)
    .eq("acknowledged", false);

  console.log(`Cleared retry tracking for ${userId} - ${callType}`);
}

export async function getRetryStatus(
  userId: string,
  callType: string,
  env: Env
): Promise<any[]> {
  const supabase = createSupabaseClient(env);

  const { data } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("user_id", userId)
    .eq("call_type", callType)
    .eq("is_retry", true)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getTimedOutRetries(env: Env): Promise<any[]> {
  const supabase = createSupabaseClient(env);
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("is_retry", true)
    .eq("acknowledged", false)
    .lt("timeout_at", now);

  return data || [];
}



function getEscalatedUrgency(attemptNumber: number): Urgency {
  if (attemptNumber === 1) return "high";
  if (attemptNumber === 2) return "critical";
  return "emergency";
}

function getEscalatedMessage(attemptNumber: number, userContext?: any): string {
  const name = userContext?.user?.name || userContext?.identity?.name || "bro";

  const messages: Record<number, string> = {
    1: `${name}, you missed your accountability call. This is your first warning.`,
    2: `${name}, you've missed multiple calls. This is getting serious.`,
    3: `${name}, final warning: You're ignoring your commitments.`,
  };

  return messages[attemptNumber] || messages[3];
}

function getRetryDelay(attemptNumber: number): number {
  // Delays: 10 min, 30 min, 60 min
  const delays = [10 * 60 * 1000, 30 * 60 * 1000, 60 * 60 * 1000];
  return delays[Math.min(attemptNumber - 1, delays.length - 1)] || delays[0];
}
