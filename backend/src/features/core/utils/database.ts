import { createClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import { Env } from "@/index";

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type BigBruhhTone =
  | "Confrontational"
  | "ColdMirror"
  | "Encouraging";

export type CallMood =
  | "motivated"
  | "tired"
  | "defensive"
  | "honest"
  | "defeated"
  | "energized";

export type PersonaType =
  | "mentor"
  | "champion"
  | "drill_sergeant"
  | "disappointed"
  | "strategist"
  | "ally";

export type NarrativeArc =
  | "early_struggle"
  | "building_momentum"
  | "breakthrough"
  | "maintaining"
  | "recovery";

export type CallSource = "cartesia" | "elevenlabs";
export type CallOutcome = "success" | "failure" | "unknown";
export type RetryReason = "missed" | "declined" | "failed";

// ============================================================================
// TABLE INTERFACES
// ============================================================================

export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  timezone: string;
  subscription_status: "active" | "trialing" | "cancelled" | "past_due";
  dodo_customer_id?: string;
  phone_number?: string;
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
}

export interface OnboardingContext {
  goal: string;
  goal_deadline?: string;
  motivation_level: number;
  attempt_count?: number;
  attempt_history?: string;
  favorite_excuse?: string;
  who_disappointed?: string;
  biggest_obstacle?: string;
  how_did_quit?: string;
  quit_time?: string;
  quit_pattern?: string;
  age?: number;
  gender?: string;
  location?: string;
  acquisition_source?: string;
  success_vision?: string;
  future_if_no_change: string;
  what_spent?: string;
  biggest_fear?: string;
  demo_call_rating?: number;
  witness?: string;
  will_do_this?: boolean;
  permissions: {
    notifications: boolean;
    calls: boolean;
  };
  completed_at: string;
  time_spent_minutes: number;
  [key: string]: any;
}

// Pillar types for 5 Pillars system
export type PillarType = 'body' | 'mission' | 'stack' | 'tribe' | 'why';

export interface FutureSelf {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  future_self_statement: string;
  favorite_excuse: string | null;
  onboarding_context: OnboardingContext | null;
  supermemory_container_id: string | null;
}

export interface FutureSelfPillar {
  id: string;
  user_id: string;
  pillar_type: PillarType;
  created_at: string;
  updated_at: string;
  current_state: string;
  future_state: string;
  next_action: string | null;
  commitment_time: string | null;
  trust_score: number;
  promises_kept: number;
  promises_broken: number;
  last_checkin_at: string | null;
}

export interface Status {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  current_streak_days: number;
  longest_streak_days: number;
  total_calls_completed: number;
  last_call_at?: string | null;
  trust_score: number;
  promises_kept_total: number;
  promises_broken_total: number;
  promises_kept_last_7_days: number;
  promises_broken_last_7_days: number;
  calls_paused: boolean;
  calls_paused_until?: string | null;
}

export interface CallMemory {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  memorable_quotes: Array<{ quote: string; context: string; date: string }>;
  emotional_peaks: Array<{ moment: string; emotion: string; date: string }>;
  open_loops: Array<{ topic: string; mentioned_at: string; resolved: boolean }>;
  last_call_type: string;
  call_type_history: string[];
  narrative_arc: NarrativeArc;
  last_mood: CallMood | string;
  current_persona: PersonaType;
  severity_level: number;
  last_commitment?: string;
  last_commitment_time?: string;
  last_commitment_specific: boolean;
}

export interface CallAnalytics {
  id: string;
  user_id: string;
  created_at: string;
  call_type: string;
  mood: CallMood | string;
  call_duration_seconds: number;
  call_quality_score: number;
  promise_kept?: boolean;
  tomorrow_commitment?: string;
  commitment_time?: string;
  commitment_is_specific: boolean;
  sentiment_trajectory: Array<{ timestamp: string; sentiment: string; score: number }>;
  excuses_detected: Array<{ excuse: string; pattern: string; confidence: number }>;
  quotes_captured: Array<{ quote: string; context: string }>;
  is_retry: boolean;
  retry_attempt_number: number;
  original_call_uuid?: string;
  retry_reason?: RetryReason;
  acknowledged: boolean;
  acknowledged_at?: string;
  timeout_at?: string;
  conversation_id?: string;
  source?: CallSource;
  audio_url?: string;
  transcript_json?: Record<string, any>;
  transcript_summary?: string;
  call_successful: CallOutcome;
  start_time?: string;
  end_time?: string;
  cost_cents?: number;
}

export interface ExcusePattern {
  id: string;
  user_id: string;
  created_at: string;
  excuse_text: string;
  excuse_pattern: string;
  matches_favorite: boolean;
  confidence: number;
  streak_day?: number;
  call_type?: string;
  was_called_out: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  provider: "dodopayments";
  provider_subscription_id: string;
  provider_customer_id?: string;
  status: "active" | "cancelled" | "past_due" | "trialing" | "paused";
  plan_id?: string;
  plan_name?: string;
  amount_cents?: number;
  currency: string;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  cancel_at_period_end: boolean;
  trial_start?: string;
  trial_end?: string;
}

export interface Onboarding {
  id: string;
  user_id?: string;
  responses: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserContext {
  user: User;
  futureSelf: FutureSelf | null;
  pillars: FutureSelfPillar[];
  status: Status | null;
  callMemory: CallMemory | null;
  recentCallAnalytics: CallAnalytics[];
  stats: {
    totalCalls: number;
    currentStreak: number;
    longestStreak: number;
    trustScore: number;
    promisesKeptTotal: number;
    promisesBrokenTotal: number;
    promisesKeptLast7Days: number;
    promisesBrokenLast7Days: number;
    successRate: number;
  };
}

// ============================================================================
// DATABASE SCHEMA TYPE (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      future_self: {
        Row: FutureSelf;
        Insert: Omit<FutureSelf, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FutureSelf, "id" | "created_at">>;
      };
      future_self_pillars: {
        Row: FutureSelfPillar;
        Insert: Omit<FutureSelfPillar, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FutureSelfPillar, "id" | "created_at">>;
      };
      status: {
        Row: Status;
        Insert: Omit<Status, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Status, "id" | "created_at">>;
      };
      call_memory: {
        Row: CallMemory;
        Insert: Omit<CallMemory, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CallMemory, "id" | "created_at">>;
      };
      call_analytics: {
        Row: CallAnalytics;
        Insert: Omit<CallAnalytics, "id" | "created_at">;
        Update: Partial<Omit<CallAnalytics, "id" | "created_at">>;
      };
      excuse_patterns: {
        Row: ExcusePattern;
        Insert: Omit<ExcusePattern, "id" | "created_at">;
        Update: Partial<Omit<ExcusePattern, "id" | "created_at">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
      };
      onboarding: {
        Row: Onboarding;
        Insert: Omit<Onboarding, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Onboarding, "id" | "created_at">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_trust_score: {
        Args: { p_user_id: string; p_change: number; p_reason: string };
        Returns: number;
      };
      get_excuse_callout_data: {
        Args: { p_user_id: string };
        Returns: Array<{
          excuse_pattern: string;
          times_this_week: number;
          times_total: number;
          days_used: number[];
          is_favorite: boolean;
          last_used: string;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// CLIENT CREATION
// ============================================================================

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function createSupabaseServiceClient(env: Env) {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function createSupabaseClient(env: Env) {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function getActiveUsers(env: Env): Promise<User[]> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("subscription_status", "active");

  if (error) throw new Error(`Failed to fetch active users: ${error.message}`);
  return data || [];
}

export async function getUser(env: Env, userId: string): Promise<User | null> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch user: ${error.message}`);
  return data;
}

// ============================================================================
// STATUS QUERIES
// ============================================================================

export async function getStatus(env: Env, userId: string): Promise<Status | null> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("status")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch status: ${error.message}`);
  }
  return data;
}

export async function updateStatus(
  env: Env,
  userId: string,
  updates: Partial<Omit<Status, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("status")
    .update(updates)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

export async function upsertStatus(
  env: Env,
  userId: string,
  data: Partial<Omit<Status, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("status")
    .upsert(
      { user_id: userId, ...data },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Failed to upsert status: ${error.message}`);
}

export async function updateTrustScore(
  env: Env,
  userId: string,
  change: number,
  reason: string
): Promise<number> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase.rpc("update_trust_score", {
    p_user_id: userId,
    p_change: change,
    p_reason: reason,
  });

  if (error) throw new Error(`Failed to update trust score: ${error.message}`);
  return data as number;
}

export async function updateUserStreak(
  env: Env,
  userId: string,
  newStreak: number
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { data: status } = await supabase
    .from("status")
    .select("longest_streak_days")
    .eq("user_id", userId)
    .maybeSingle();

  const longestStreak = Math.max(status?.longest_streak_days || 0, newStreak);

  const { error } = await supabase
    .from("status")
    .update({
      current_streak_days: newStreak,
      longest_streak_days: longestStreak,
    })
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update user streak: ${error.message}`);
}

// ============================================================================
// CALL MEMORY QUERIES
// ============================================================================

export async function getCallMemory(
  env: Env,
  userId: string
): Promise<CallMemory | null> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("call_memory")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch call memory: ${error.message}`);
  }
  return data;
}

export async function updateCallMemory(
  env: Env,
  userId: string,
  updates: Partial<Omit<CallMemory, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("call_memory")
    .update(updates)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update call memory: ${error.message}`);
}

export async function upsertCallMemory(
  env: Env,
  userId: string,
  data: Partial<Omit<CallMemory, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("call_memory")
    .upsert(
      { user_id: userId, ...data },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Failed to upsert call memory: ${error.message}`);
}

// ============================================================================
// CALL ANALYTICS QUERIES
// ============================================================================

export async function saveCallAnalytics(
  env: Env,
  userId: string,
  data: Omit<CallAnalytics, "id" | "user_id" | "created_at">
): Promise<CallAnalytics> {
  const supabase = createSupabaseClient(env);

  const { data: result, error } = await supabase
    .from("call_analytics")
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save call analytics: ${error.message}`);
  return result;
}

export async function updateCallAnalytics(
  env: Env,
  callId: string,
  updates: Partial<Omit<CallAnalytics, "id" | "user_id" | "created_at">>
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("call_analytics")
    .update(updates)
    .eq("id", callId);

  if (error) throw new Error(`Failed to update call analytics: ${error.message}`);
}

export async function getCallAnalyticsByConversationId(
  env: Env,
  conversationId: string
): Promise<CallAnalytics | null> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch call analytics: ${error.message}`);
  }
  return data;
}

export async function getRecentCallAnalytics(
  env: Env,
  userId: string,
  days: number = 7
): Promise<CallAnalytics[]> {
  const supabase = createSupabaseClient(env);
  const cutoff = format(subDays(new Date(), days), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", `${cutoff}T00:00:00Z`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch recent call analytics: ${error.message}`);
  return data || [];
}

export async function checkCallExists(
  env: Env,
  userId: string,
  date: string
): Promise<boolean> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("call_analytics")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", `${date}T00:00:00Z`)
    .lt("created_at", `${date}T23:59:59Z`)
    .limit(1);

  if (error) throw new Error(`Failed to check call exists: ${error.message}`);
  return (data?.length || 0) > 0;
}

export async function getUnacknowledgedCalls(
  env: Env,
  userId: string
): Promise<CallAnalytics[]> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("user_id", userId)
    .eq("acknowledged", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch unacknowledged calls: ${error.message}`);
  return data || [];
}

export async function acknowledgeCall(
  env: Env,
  callId: string
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("call_analytics")
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", callId);

  if (error) throw new Error(`Failed to acknowledge call: ${error.message}`);
}

// ============================================================================
// EXCUSE PATTERNS QUERIES
// ============================================================================

export async function saveExcusePattern(
  env: Env,
  userId: string,
  data: Omit<ExcusePattern, "id" | "user_id" | "created_at">
): Promise<ExcusePattern> {
  const supabase = createSupabaseClient(env);

  const { data: result, error } = await supabase
    .from("excuse_patterns")
    .insert({
      user_id: userId,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save excuse pattern: ${error.message}`);
  return result;
}

export async function getExcuseCalloutData(
  env: Env,
  userId: string
): Promise<Array<{
  excuse_pattern: string;
  times_this_week: number;
  times_total: number;
  days_used: number[];
  is_favorite: boolean;
  last_used: string;
}>> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase.rpc("get_excuse_callout_data", {
    p_user_id: userId,
  });

  if (error) throw new Error(`Failed to get excuse callout data: ${error.message}`);
  return data || [];
}

// ============================================================================
// USER CONTEXT
// ============================================================================

export async function getUserContext(
  env: Env,
  userId: string
): Promise<UserContext> {
  try {
    const supabase = createSupabaseClient(env);
    const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

    const [
      { data: user, error: userError },
      { data: futureSelf, error: futureSelfError },
      { data: pillars, error: pillarsError },
      { data: status, error: statusError },
      { data: callMemory, error: callMemoryError },
      { data: recentCalls, error: recentCallsError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),
      supabase.from("future_self").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("future_self_pillars").select("*").eq("user_id", userId),
      supabase.from("status").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("call_memory").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("call_analytics")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${sevenDaysAgo}T00:00:00Z`)
        .order("created_at", { ascending: false }),
    ]);

    if (userError) {
      console.warn("getUserContext: user fetch failed:", userError.message);
      return buildFallbackUserContext(userId);
    }

    if (futureSelfError && futureSelfError.code !== "PGRST116") {
      console.warn("getUserContext: future_self fetch issue:", futureSelfError.message);
    }
    if (pillarsError) {
      console.warn("getUserContext: future_self_pillars fetch issue:", pillarsError.message);
    }
    if (statusError && statusError.code !== "PGRST116") {
      console.warn("getUserContext: status fetch issue:", statusError.message);
    }
    if (callMemoryError && callMemoryError.code !== "PGRST116") {
      console.warn("getUserContext: call_memory fetch issue:", callMemoryError.message);
    }

    const currentStreak = status?.current_streak_days ?? 0;
    const longestStreak = status?.longest_streak_days ?? 0;
    const trustScore = status?.trust_score ?? 50;
    const promisesKeptTotal = status?.promises_kept_total ?? 0;
    const promisesBrokenTotal = status?.promises_broken_total ?? 0;
    const promisesKeptLast7Days = status?.promises_kept_last_7_days ?? 0;
    const promisesBrokenLast7Days = status?.promises_broken_last_7_days ?? 0;
    const totalCalls = status?.total_calls_completed ?? 0;

    const totalPromises = promisesKeptTotal + promisesBrokenTotal;
    const successRate = totalPromises > 0 ? promisesKeptTotal / totalPromises : 0;

    return {
      user: user as User,
      futureSelf: futureSelf ?? null,
      pillars: pillars || [],
      status: status ?? null,
      callMemory: callMemory ?? null,
      recentCallAnalytics: recentCalls || [],
      stats: {
        totalCalls,
        currentStreak,
        longestStreak,
        trustScore,
        promisesKeptTotal,
        promisesBrokenTotal,
        promisesKeptLast7Days,
        promisesBrokenLast7Days,
        successRate,
      },
    };
  } catch (e) {
    console.warn("getUserContext: unexpected error:", e instanceof Error ? e.message : e);
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
      email: "unknown@example.com",
      subscription_status: "active",
      timezone: "UTC",
      onboarding_completed: false,
    },
    futureSelf: null,
    pillars: [],
    status: null,
    callMemory: null,
    recentCallAnalytics: [],
    stats: {
      totalCalls: 0,
      currentStreak: 0,
      longestStreak: 0,
      trustScore: 50,
      promisesKeptTotal: 0,
      promisesBrokenTotal: 0,
      promisesKeptLast7Days: 0,
      promisesBrokenLast7Days: 0,
      successRate: 0,
    },
  };
}

// ============================================================================
// RETRY TRACKING
// ============================================================================

export async function createRetryCall(
  env: Env,
  userId: string,
  originalCallId: string,
  retryAttemptNumber: number,
  retryReason: "missed" | "declined" | "failed"
): Promise<CallAnalytics> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("call_analytics")
    .insert({
      user_id: userId,
      call_type: "daily_reckoning",
      mood: "unknown",
      call_duration_seconds: 0,
      call_quality_score: 0,
      commitment_is_specific: false,
      sentiment_trajectory: [],
      excuses_detected: [],
      quotes_captured: [],
      is_retry: true,
      retry_attempt_number: retryAttemptNumber,
      original_call_uuid: originalCallId,
      retry_reason: retryReason,
      acknowledged: false,
      call_successful: "unknown",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create retry call: ${error.message}`);
  return data;
}

export async function getRetryAttempts(
  env: Env,
  originalCallId: string
): Promise<CallAnalytics[]> {
  const supabase = createSupabaseClient(env);

  const { data, error } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("original_call_uuid", originalCallId)
    .order("retry_attempt_number", { ascending: true });

  if (error) throw new Error(`Failed to fetch retry attempts: ${error.message}`);
  return data || [];
}

export async function getPendingRetries(
  env: Env,
  userId: string
): Promise<CallAnalytics[]> {
  const supabase = createSupabaseClient(env);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("call_analytics")
    .select("*")
    .eq("user_id", userId)
    .eq("acknowledged", false)
    .eq("is_retry", true)
    .lt("timeout_at", now);

  if (error) throw new Error(`Failed to fetch pending retries: ${error.message}`);
  return data || [];
}

// ============================================================================
// PUSH TOKEN MANAGEMENT
// ============================================================================

export interface PushTokenData {
  token: string;
  type?: string;
  device_model?: string;
  os_version?: string;
  app_version?: string;
  locale?: string;
  timezone?: string;
}

export async function upsertPushToken(
  env: Env,
  userId: string,
  data: PushTokenData
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: userId,
        token: data.token,
        type: data.type || "fcm",
        device_model: data.device_model,
        os_version: data.os_version,
        app_version: data.app_version,
        locale: data.locale,
        timezone: data.timezone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,token" }
    );

  if (error) throw new Error(`Failed to upsert push token: ${error.message}`);
}

// ============================================================================
// USER VOICE MANAGEMENT
// ============================================================================

export async function updateUserVoiceId(
  env: Env,
  userId: string,
  voiceId: string
): Promise<void> {
  const supabase = createSupabaseClient(env);

  const { error } = await supabase
    .from("users")
    .update({ voice_id: voiceId, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(`Failed to update user voice id: ${error.message}`);
}
