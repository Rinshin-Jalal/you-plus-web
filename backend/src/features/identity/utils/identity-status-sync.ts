import { createSupabaseClient, getUserContext } from "@/features/core/utils/database";
import { Env } from "@/index";
import { Identity, Status } from "@/types/database";
import { format, subDays } from "date-fns";

interface StatusSummary {
  disciplineLevel: "CRISIS" | "GROWTH" | "STUCK" | "STABLE" | "UNKNOWN";
  disciplineMessage: string;
  notificationTitle: string;
  notificationMessage: string;
  generatedAt: string;
}

interface SummaryMetrics {
  trustScore: number;
  currentStreak: number;
  longestStreak: number;
  promisesKeptTotal: number;
  promisesBrokenTotal: number;
  promisesKeptLast7Days: number;
  promisesBrokenLast7Days: number;
}

export async function syncIdentityStatus(
  userId: string,
  env: Env
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createSupabaseClient(env);

  try {
    console.log(`Starting status sync for user ${userId}`);

    const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

    // Fetch all call analytics for this user
    const { data: allCalls, error: callsError } = await supabase
      .from("call_analytics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (callsError) {
      console.error(`Failed to fetch call_analytics for user ${userId}:`, callsError);
      throw callsError;
    }

    // Get current status
    const { data: currentStatus } = await supabase
      .from("status")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Calculate promise stats from call_analytics
    const callsWithPromiseResult = (allCalls || []).filter((c) => c.promise_kept !== null);
    const promisesKeptTotal = callsWithPromiseResult.filter((c) => c.promise_kept === true).length;
    const promisesBrokenTotal = callsWithPromiseResult.filter((c) => c.promise_kept === false).length;

    // Calculate 7-day stats
    const recentCalls = (allCalls || []).filter((c) => c.created_at >= `${sevenDaysAgo}T00:00:00Z`);
    const recentWithResult = recentCalls.filter((c) => c.promise_kept !== null);
    const promisesKeptLast7Days = recentWithResult.filter((c) => c.promise_kept === true).length;
    const promisesBrokenLast7Days = recentWithResult.filter((c) => c.promise_kept === false).length;

    // Calculate streak from consecutive promise_kept = true
    const currentStreak = calculateStreakFromCalls(allCalls || []);
    const longestStreak = Math.max(currentStatus?.longest_streak_days || 0, currentStreak);

    // Total calls completed
    const totalCallsCompleted = (allCalls || []).filter((c) => c.call_successful === "success").length;
    const lastCallAt = allCalls?.[0]?.created_at || null;

    // Calculate trust score (keep current or default to 50)
    const trustScore = currentStatus?.trust_score || 50;

    console.log(`Promise stats: ${promisesKeptTotal} kept, ${promisesBrokenTotal} broken`);
    console.log(`Current streak: ${currentStreak} days, Longest: ${longestStreak} days`);
    console.log(`Recent (7d): ${promisesKeptLast7Days} kept, ${promisesBrokenLast7Days} broken`);

    // Upsert status
    const { data: updatedStatus, error: statusError } = await supabase
      .from("status")
      .upsert(
        {
          user_id: userId,
          current_streak_days: currentStreak,
          longest_streak_days: longestStreak,
          total_calls_completed: totalCallsCompleted,
          last_call_at: lastCallAt,
          trust_score: trustScore,
          promises_kept_total: promisesKeptTotal,
          promises_broken_total: promisesBrokenTotal,
          promises_kept_last_7_days: promisesKeptLast7Days,
          promises_broken_last_7_days: promisesBrokenLast7Days,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (statusError) {
      console.error(`Failed to update status for user ${userId}:`, statusError);
      throw statusError;
    }

    console.log(`Status synced for user ${userId}`);

    return {
      success: true,
      data: updatedStatus,
    };
  } catch (error) {
    console.error(`Status sync failed for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown sync error",
    };
  }
}

/**
 * Calculate streak from call_analytics
 */
function calculateStreakFromCalls(calls: Array<{ created_at: string; promise_kept: boolean | null }>): number {
  if (!calls || calls.length === 0) return 0;

  const callsByDate = new Map<string, typeof calls>();

  for (const call of calls) {
    const date = format(new Date(call.created_at), "yyyy-MM-dd");
    if (!callsByDate.has(date)) {
      callsByDate.set(date, []);
    }
    callsByDate.get(date)!.push(call);
  }

  const sortedDates = Array.from(callsByDate.keys()).sort().reverse();

  let streak = 0;

  for (const date of sortedDates) {
    const dayCalls = callsByDate.get(date)!;
    const callsWithResult = dayCalls.filter((c) => c.promise_kept !== null);
    
    if (callsWithResult.length === 0) continue;

    const allKept = callsWithResult.every((c) => c.promise_kept === true);

    if (allKept) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function generateStatusSummary(
  userId: string,
  env: Env
): Promise<StatusSummary> {
  const supabase = createSupabaseClient(env);

  try {
    // Get user context
    const userContext = await getUserContext(env, userId);
    const identity = userContext.identity;
    const status = userContext.status;

    const metrics: SummaryMetrics = {
      trustScore: status?.trust_score || 50,
      currentStreak: status?.current_streak_days || 0,
      longestStreak: status?.longest_streak_days || 0,
      promisesKeptTotal: status?.promises_kept_total || 0,
      promisesBrokenTotal: status?.promises_broken_total || 0,
      promisesKeptLast7Days: status?.promises_kept_last_7_days || 0,
      promisesBrokenLast7Days: status?.promises_broken_last_7_days || 0,
    };

    return buildHeuristicSummary(metrics, identity);
  } catch (error) {
    console.error("Failed to generate status summary:", error);
    return buildHeuristicSummary({
      trustScore: 50,
      currentStreak: 0,
      longestStreak: 0,
      promisesKeptTotal: 0,
      promisesBrokenTotal: 0,
      promisesKeptLast7Days: 0,
      promisesBrokenLast7Days: 0,
    });
  }
}

function buildHeuristicSummary(
  metrics: SummaryMetrics,
  identity?: Identity | null
): StatusSummary {
  const {
    trustScore,
    currentStreak,
    promisesKeptTotal,
    promisesBrokenTotal,
    promisesBrokenLast7Days,
  } = metrics;

  const totalPromises = promisesKeptTotal + promisesBrokenTotal;
  const successRate = totalPromises > 0
    ? Math.round((promisesKeptTotal / totalPromises) * 100)
    : 0;

  let disciplineLevel: StatusSummary["disciplineLevel"] = "UNKNOWN";

  if (totalPromises === 0) {
    disciplineLevel = "UNKNOWN";
  } else if (trustScore < 30 || promisesBrokenLast7Days >= 3 || currentStreak === 0) {
    disciplineLevel = "CRISIS";
  } else if (trustScore >= 70 && currentStreak >= 3) {
    disciplineLevel = "GROWTH";
  } else if (trustScore < 50 || currentStreak < 2) {
    disciplineLevel = "STUCK";
  } else {
    disciplineLevel = "STABLE";
  }

  const identityName = identity?.name || "bro";
  const excuse = identity?.onboarding_context?.favorite_excuse || "weak excuse";

  const disciplineMessageMap: Record<StatusSummary["disciplineLevel"], string> = {
    CRISIS: `You're sliding hard, ${identityName}. Every excuse (${excuse}) puts you deeper in the pit. Decide if you're done being weak.`,
    STUCK: `Momentum is dead. You keep flirting with failure and calling it effort. Lock in or lose it all.`,
    STABLE: `You're holding ground, but there's no fire yet. Stability without aggression becomes decay. Push harder.`,
    GROWTH: `Momentum is real. You're stacking disciplined days—don't soften now. Double down before comfort drags you back.`,
    UNKNOWN: `No record yet. Make a promise today and actually keep it.`,
  };

  const notificationTitleMap: Record<StatusSummary["disciplineLevel"], string> = {
    CRISIS: "EMERGENCY INTERVENTION",
    STUCK: "MOMENTUM CHECK",
    STABLE: "ACCOUNTABILITY CHECK",
    GROWTH: "KEEP IT MOVING",
    UNKNOWN: "ACCOUNTABILITY CHECK",
  };

  const notificationMessageMap: Record<StatusSummary["disciplineLevel"], string> = {
    CRISIS: `Trust score at ${trustScore}%. Your excuses are stacking (${promisesBrokenTotal} broken). Stop pretending tomorrow saves you.`,
    STUCK: `Trust at ${trustScore}% with weak streak. Start acting like you actually want change.`,
    STABLE: `${currentStreak} day streak at ${trustScore}% trust. Don't let boredom kill your momentum.`,
    GROWTH: `Streak at ${currentStreak} days, trust at ${trustScore}%. Ride the wave and set a bigger promise now.`,
    UNKNOWN: `No data yet. Make a commitment and prove you belong here.`,
  };

  return {
    disciplineLevel,
    disciplineMessage: disciplineMessageMap[disciplineLevel],
    notificationTitle: notificationTitleMap[disciplineLevel],
    notificationMessage: notificationMessageMap[disciplineLevel],
    generatedAt: new Date().toISOString(),
  };
}
