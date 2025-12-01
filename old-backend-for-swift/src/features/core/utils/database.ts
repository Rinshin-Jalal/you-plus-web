import { createClient } from "@supabase/supabase-js";
import {
  CallRecording,
  CallType,
  Database,
  PromiseStatus,
  User,
  UserContext,
  UserPromise,
} from "@/types/database";
import { format, isWithinInterval, parse, subDays } from "date-fns";
import { Env } from "@/index";

/**
 * Utility to check if we're in development mode
 * 🔓 Used for subscription bypass logic
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Service role client for bypassing RLS policies (admin access)
 */
export function createSupabaseServiceClient(env: Env) {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Standard client using service role key (same as above for this app)
 */
export function createSupabaseClient(env: Env) {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function getActiveUsers(env: Env): Promise<User[]> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("subscription_status", "active");

  if (error) throw new Error(`Failed to fetch active users: ${error.message}`);
  return data || [];
}

export async function getUserContext(
  env: Env,
  userId: string
): Promise<UserContext> {
  try {
    const supabase = createSupabaseClient(env);
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

    // Execute all database queries in parallel for 5x performance improvement
    const [
      { data: user, error: userError },
      { data: todayPromises },
      { data: yesterdayPromises },
      recentMemoriesInsights,
      { data: recentPattern },
      { data: identity, error: identityError },
      { data: identityStatus, error: identityStatusError },
    ] = await Promise.all([
      // Fetch user
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),

      // Fetch today's promises
      supabase
        .from("promises")
        .select("*")
        .eq("user_id", userId)
        .eq("promise_date", today)
        .order("promise_order", { ascending: true })
        .order("created_at", { ascending: true }),

      // Fetch yesterday's promises
      supabase
        .from("promises")
        .select("*")
        .eq("user_id", userId)
        .eq("promise_date", yesterday)
        .order("promise_order", { ascending: true })
        .order("created_at", { ascending: true }),

      // Memory embeddings removed (bloat elimination) - return empty insights
      Promise.resolve({ typeCounts: {}, topExcuseCount: 0 }),

      // Fetch recent streak pattern (last 7 days)
      supabase
        .from("promises")
        .select("*")
        .eq("user_id", userId)
        .gte("promise_date", sevenDaysAgo)
        .order("promise_date", { ascending: false }),

      // Fetch identity (optional)
      supabase.from("identity").select("*").eq("user_id", userId).maybeSingle(),

      // Fetch identity status (optional)
      supabase
        .from("identity_status")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (userError) {
      console.warn(
        "getUserContext: user fetch failed, returning fallback:",
        userError.message
      );
      return buildFallbackUserContext(userId);
    }

    // Handle nulls and errors gracefully (treat optional tables as nullable instead of throwing)
    if (identityError && identityError.code !== "PGRST116") {
      console.warn(
        "getUserContext: identity fetch failed, continuing without identity:",
        identityError.message
      );
    }
    if (identityStatusError && identityStatusError.code !== "PGRST116") {
      console.warn(
        "getUserContext: identity_status fetch failed, continuing without status:",
        identityStatusError.message
      );
    }

    // Calculate stats with null safety
    const totalPromises = identityStatus?.promises_made_count ?? 0;
    const brokenPromises = identityStatus?.promises_broken_count ?? 0;
    const keptPromises = totalPromises - brokenPromises;
    const successRate = totalPromises > 0 ? keptPromises / totalPromises : 0;
    const currentStreak = identityStatus?.current_streak_days ?? 0;

    // Prefer persisted nightly profile when available
    let memoryInsights = {
      countsByType: recentMemoriesInsights?.typeCounts || {},
      topExcuseCount7d: recentMemoriesInsights?.topExcuseCount || 0,
      emergingPatterns: [] as Array<{
        sampleText: string;
        recentCount: number;
        baselineCount: number;
        growthFactor: number;
      }>,
    };
    try {
      const { data: statusRow } = await createSupabaseClient(env)
        .from("identity_status")
        .select("pattern_profile")
        .eq("user_id", userId)
        .maybeSingle();
      const profile = (statusRow as any)?.pattern_profile;
      if (profile) {
        memoryInsights = {
          countsByType: profile.countsByType || memoryInsights.countsByType,
          topExcuseCount7d:
            profile.summary?.topExcuses ?? memoryInsights.topExcuseCount7d,
          emergingPatterns: profile.emergingPatterns || [],
        };
      }
    } catch (_) {
      /* optional */
    }

    return {
      user: user as any,
      todayPromises: todayPromises || [],
      yesterdayPromises: yesterdayPromises || [],
      recentStreakPattern: recentPattern || [],
      identity: identity ?? null,
      identityStatus: identityStatus ?? null,
      stats: {
        totalPromises,
        keptPromises,
        brokenPromises,
        successRate,
        currentStreak,
      },
      // @ts-ignore add insights without breaking consumers; migrate later
      memoryInsights,
    };
  } catch (e) {
    console.warn(
      "getUserContext: unexpected error, returning fallback:",
      e instanceof Error ? e.message : e
    );
    return buildFallbackUserContext(userId);
  }
}

function buildFallbackUserContext(userId: string): UserContext {
  const nowIso = new Date().toISOString();
  return {
    user: {
      id: userId,
      created_at: nowIso,
      updated_at: nowIso,
      name: "Friend",
      email: "test@example.com",
      subscription_status: "active",
      timezone: "UTC",
      call_window_start: "20:00",
      call_window_timezone: "UTC",
      push_token: "demo-push-token",
      onboarding_completed: false,
      schedule_change_count: 0,
      voice_reclone_count: 0,
    } as any,
    todayPromises: [],
    yesterdayPromises: [],
    recentStreakPattern: [],
    identity: null,
    identityStatus: {
      id: "stub",
      user_id: userId,
      trust_percentage: 50,
      current_streak_days: 0,
    } as any,
    stats: {
      totalPromises: 0,
      keptPromises: 0,
      brokenPromises: 0,
      successRate: 0,
      currentStreak: 0,
    },
    // @ts-ignore
    memoryInsights: {
      countsByType: {},
      topExcuseCount7d: 0,
      emergingPatterns: [],
    },
  };
}
export async function createPromise(
  env: Env,
  userId: string,
  promiseText: string,
  options?: {
    priority?: "low" | "medium" | "high" | "critical";
    category?: string;
    targetTime?: string;
    createdDuringCall?: boolean;
    parentPromiseId?: string;
  }
): Promise<UserPromise> {
  const supabase = createSupabaseClient(env);
  const today = format(new Date(), "yyyy-MM-dd");

  // Get current highest order for today
  const { data: existingPromises } = await supabase
    .from("promises")
    .select("promise_order")
    .eq("user_id", userId)
    .eq("promise_date", today)
    .order("promise_order", { ascending: false })
    .limit(1);

  const nextOrder = existingPromises?.[0]?.promise_order
    ? existingPromises[0].promise_order + 1
    : 1;

  const { data, error } = await supabase
    .from("promises")
    .insert({
      user_id: userId,
      promise_date: today,
      promise_text: promiseText,
      status: "pending",
      promise_order: nextOrder,
      priority_level: options?.priority || "medium",
      category: options?.category || "general",
      time_specific: !!options?.targetTime,
      target_time: options?.targetTime || null,
      created_during_call: options?.createdDuringCall || false,
      parent_promise_id: options?.parentPromiseId || null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create promise: ${error.message}`);
  return data;
}

export async function getTodayPromises(
  env: Env,
  userId: string
): Promise<UserPromise[]> {
  const supabase = createSupabaseClient(env);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("promises")
    .select("*")
    .eq("user_id", userId)
    .eq("promise_date", today)
    .order("promise_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch promises: ${error.message}`);
  return data || [];
}

export async function updatePromiseOrder(
  env: Env,
  promiseId: string,
  newOrder: number
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("promises")
    .update({ promise_order: newOrder })
    .eq("id", promiseId);

  if (error) {
    throw new Error(`Failed to update promise order: ${error.message}`);
  }
}

export async function getPromiseSummary(
  env: Env,
  userId: string,
  date?: string
): Promise<any> {
  const supabase = createSupabaseClient(env);
  const targetDate = date || format(new Date(), "yyyy-MM-dd");

  const { data, error } = await supabase.rpc("get_user_promise_summary", {
    user_uuid: userId,
    target_date: targetDate,
  });

  if (error) throw new Error(`Failed to get promise summary: ${error.message}`);
  return (
    data?.[0] || {
      total_promises: 0,
      kept_promises: 0,
      broken_promises: 0,
      pending_promises: 0,
      success_rate: 0,
      priority_breakdown: { high: 0, medium: 0, low: 0, critical: 0 },
    }
  );
}

export async function bulkUpdatePromiseStatus(
  env: Env,
  updates: Array<{
    promiseId: string;
    status: "pending" | "kept" | "broken";
    excuseText?: string;
  }>
): Promise<void> {
  const supabase = createSupabaseClient(env);

  for (const update of updates) {
    const updateData: any = { status: update.status };
    if (update.excuseText) updateData.excuse_text = update.excuseText;

    const { error } = await supabase
      .from("promises")
      .update(updateData)
      .eq("id", update.promiseId);

    if (error) {
      throw new Error(
        `Failed to update promise ${update.promiseId}: ${error.message}`
      );
    }
  }
}

export async function updatePromiseStatus(
  env: Env,
  promiseId: string,
  status: PromiseStatus,
  excuseText?: string
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const updateData: any = { status };
  if (excuseText) updateData.excuse_text = excuseText;

  const { error } = await supabase
    .from("promises")
    .update(updateData)
    .eq("id", promiseId);

  if (error) throw new Error(`Failed to update promise: ${error.message}`);
}

export async function saveCallRecording(
  env: Env,
  userId: string,
  callType: CallType,
  audioUrl: string,
  durationSec: number,
  toneUsed?: "supportive" | "neutral" | "concerned",
  transcript?: string
): Promise<CallRecording> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("calls")
    .insert({
      user_id: userId,
      call_type: callType,
      audio_url: audioUrl,
      duration_sec: durationSec,
      // tone_used is not present in schema; omit to satisfy schema
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save call recording: ${error.message}`);
  return data;
}

export async function updateUserStreak(
  env: Env,
  userId: string,
  newStreak: number
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("users")
    .update({ alignment_streak: newStreak })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update user streak: ${error.message}`);
}

export async function updateUserVoiceId(
  env: Env,
  userId: string,
  voiceCloneId: string
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("users")
    .update({ voice_clone_id: voiceCloneId })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update user voice ID: ${error.message}`);
  }
}

export async function updateUserTone(
  env: Env,
  userId: string,
  mood: "supportive" | "neutral" | "concerned"
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("users")
    .update({ current_transmission_mood: mood })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update user tone: ${error.message}`);
}

export interface PushTokenMetadata {
  token: string;
  type?: "apns" | "fcm" | "voip";
  device_model?: string;
  os_version?: string;
  app_version?: string;
  locale?: string;
  timezone?: string;
}

export async function upsertPushToken(
  env: Env,
  userId: string,
  metadata: PushTokenMetadata
): Promise<void> {
  const supabase = createSupabaseClient(env);

  if (!metadata.token) {
    throw new Error("Missing push token");
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token: metadata.token,
      type: metadata.type || "fcm",
      device_model: metadata.device_model || null,
      os_version: metadata.os_version || null,
      app_version: metadata.app_version || null,
      locale: metadata.locale || null,
      timezone: metadata.timezone || null,
      is_active: true,
      updated_at: now,
    },
    { onConflict: "token" }
  );

  if (error) {
    console.error(`Failed to upsert push token for user ${userId}:`, error);
    throw new Error(`Failed to save push token: ${error.message}`);
  }
}

export async function checkCallExists(
  env: Env,
  userId: string,
  callType: CallType,
  date: string
): Promise<boolean> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("calls")
    .select("id")
    .eq("user_id", userId)
    .eq("call_type", callType)
    .gte("created_at", `${date}T00:00:00Z`)
    .lt("created_at", `${date}T23:59:59Z`)
    .limit(1);

  if (error) throw new Error(`Failed to check call exists: ${error.message}`);
  return (data?.length || 0) > 0;
}

// NEW: Promise Collection utilities
export async function createPromiseCollection(
  env: Env,
  userId: string,
  collectionName: string,
  collectionDate: string,
  theme?: string
): Promise<any> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("promise_collections")
    .insert({
      user_id: userId,
      collection_name: collectionName,
      collection_date: collectionDate,
      theme: theme || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create promise collection: ${error.message}`);
  }
  return data;
}

// NEW: Subscription Event utilities
export async function saveSubscriptionEvent(
  env: Env,
  userId: string | null,
  eventType: string,
  productId: string,
  transactionId: string,
  purchaseDate: string,
  webhookData: Record<string, any>,
  expirationDate?: string,
  isTrialPeriod: boolean = false,
  revenueUsd?: number
): Promise<any> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("subscription_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      product_id: productId,
      transaction_id: transactionId,
      purchase_date: purchaseDate,
      expiration_date: expirationDate || null,
      is_trial_period: isTrialPeriod,
      revenue_usd: revenueUsd || null,
      webhook_data: webhookData,
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save subscription event: ${error.message}`);
  }
  return data;
}