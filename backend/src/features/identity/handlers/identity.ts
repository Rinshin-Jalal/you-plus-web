import { Context } from "hono";
import { createSupabaseClient, getStatus, getCallMemory } from "@/features/core/utils/database";
import { Env } from "@/index";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { Identity, Status, CallMemory } from "@/types/database";

export const getCurrentIdentity = async (c: Context) => {
  const userId = c.req.param("userId");
  const authenticatedUserId = getAuthenticatedUserId(c);

  // Security: Users can only access their own identity
  if (userId !== authenticatedUserId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const { data: identity, error: identityError } = await supabase
      .from("identity")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (identityError) {
      return c.json({ error: "Identity not found" }, 404);
    }

    const { data: status, error: statusError } = await supabase
      .from("status")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: callMemory, error: callMemoryError } = await supabase
      .from("call_memory")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const startDate = new Date(identity.created_at);
    const daysActive = Math.floor(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const { data: callAnalytics, error: callError } = await supabase
      .from("call_analytics")
      .select("call_duration_seconds, call_successful")
      .eq("user_id", userId);

    const totalCalls = callAnalytics?.length || 0;
    const successfulCalls = callAnalytics?.filter((c) => c.call_successful === "success").length || 0;
    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

    const identityData = {
      id: identity.id,
      userId: identity.user_id,
      createdAt: identity.created_at,
      updatedAt: identity.updated_at,
      daysActive,

      name: identity.name,
      dailyCommitment: identity.daily_commitment,
      callTime: identity.call_time,

      cartesiaVoiceId: identity.cartesia_voice_id,

      voiceRecordings: {
        whyItMatters: identity.why_it_matters_audio_url,
        costOfQuitting: identity.cost_of_quitting_audio_url,
        commitment: identity.commitment_audio_url,
      },

      onboardingContext: identity.onboarding_context,

      currentStreakDays: status?.current_streak_days || 0,
      longestStreakDays: status?.longest_streak_days || 0,
      totalCallsCompleted: status?.total_calls_completed || 0,
      lastCallAt: status?.last_call_at || null,
      trustScore: status?.trust_score || 50,
      promisesKeptTotal: status?.promises_kept_total || 0,
      promisesBrokenTotal: status?.promises_broken_total || 0,
      promisesKeptLast7Days: status?.promises_kept_last_7_days || 0,
      promisesBrokenLast7Days: status?.promises_broken_last_7_days || 0,
      callsPaused: status?.calls_paused || false,
      callsPausedUntil: status?.calls_paused_until || null,

      currentPersona: callMemory?.current_persona || "mentor",
      severityLevel: callMemory?.severity_level || 1,
      narrativeArc: callMemory?.narrative_arc || "early_struggle",
      lastMood: callMemory?.last_mood || null,
      lastCommitment: callMemory?.last_commitment || null,

      stats: {
        totalCalls,
        successfulCalls,
        successRate,
        longestStreak: status?.longest_streak_days || 0,
      },
    };

    return c.json({
      success: true,
      data: identityData,
    });
  } catch (error) {
    console.error("Identity fetch failed:", error);
    return c.json(
      {
        error: "Failed to fetch identity",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const updateIdentity = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const identityData = await c.req.json();

  if (!identityData || typeof identityData !== "object") {
    return c.json({ error: "Identity data required" }, 400);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (identityData.dailyCommitment !== undefined) {
      updateData.daily_commitment = identityData.dailyCommitment;
    }
    if (identityData.callTime !== undefined) {
      updateData.call_time = identityData.callTime;
    }
    if (identityData.onboardingContext !== undefined) {
      updateData.onboarding_context = identityData.onboardingContext;
    }
    if (identityData.name !== undefined) {
      updateData.name = identityData.name;
    }
    if (identityData.cartesiaVoiceId !== undefined) {
      updateData.cartesia_voice_id = identityData.cartesiaVoiceId;
    }

    const { data: updatedIdentity, error: updateError } = await supabase
      .from("identity")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`Identity updated for user ${userId}`);

    return c.json({
      success: true,
      data: updatedIdentity,
      message: "Identity updated successfully",
    });
  } catch (error) {
    console.error("Identity update failed:", error);
    return c.json(
      {
        error: "Failed to update identity",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const updateIdentityStatus = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const statusData = await c.req.json();

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const updateData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (statusData.currentStreakDays !== undefined) {
      updateData.current_streak_days = statusData.currentStreakDays;
    }
    if (statusData.longestStreakDays !== undefined) {
      updateData.longest_streak_days = statusData.longestStreakDays;
    }
    if (statusData.totalCallsCompleted !== undefined) {
      updateData.total_calls_completed = statusData.totalCallsCompleted;
    }
    if (statusData.lastCallAt !== undefined) {
      updateData.last_call_at = statusData.lastCallAt;
    }
    if (statusData.trustScore !== undefined) {
      updateData.trust_score = statusData.trustScore;
    }
    if (statusData.promisesKeptTotal !== undefined) {
      updateData.promises_kept_total = statusData.promisesKeptTotal;
    }
    if (statusData.promisesBrokenTotal !== undefined) {
      updateData.promises_broken_total = statusData.promisesBrokenTotal;
    }
    if (statusData.promisesKeptLast7Days !== undefined) {
      updateData.promises_kept_last_7_days = statusData.promisesKeptLast7Days;
    }
    if (statusData.promisesBrokenLast7Days !== undefined) {
      updateData.promises_broken_last_7_days = statusData.promisesBrokenLast7Days;
    }
    if (statusData.callsPaused !== undefined) {
      updateData.calls_paused = statusData.callsPaused;
    }
    if (statusData.callsPausedUntil !== undefined) {
      updateData.calls_paused_until = statusData.callsPausedUntil;
    }

    const { data: updatedStatus, error: statusError } = await supabase
      .from("status")
      .upsert(updateData, { onConflict: "user_id" })
      .select()
      .single();

    if (statusError) throw statusError;

    console.log(`Status updated for user ${userId}`);

    return c.json({
      success: true,
      data: updatedStatus,
      message: "Status updated successfully",
    });
  } catch (error) {
    console.error("Status update failed:", error);
    return c.json(
      {
        error: "Failed to update status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const getIdentityStats = async (c: Context) => {
  const userId = c.req.param("userId");
  const authenticatedUserId = getAuthenticatedUserId(c);

  if (userId !== authenticatedUserId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const { data: status, error: statusError } = await supabase
      .from("status")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: callAnalytics } = await supabase
      .from("call_analytics")
      .select("call_duration_seconds, call_successful, created_at")
      .eq("user_id", userId);

    const { data: identity } = await supabase
      .from("identity")
      .select("created_at")
      .eq("user_id", userId)
      .single();

    const daysActive = identity
      ? Math.floor(
          (new Date().getTime() - new Date(identity.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const totalCalls = callAnalytics?.length || 0;
    const successfulCalls = callAnalytics?.filter((c) => c.call_successful === "success").length || 0;
    const callSuccessRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

    const promisesKept = status?.promises_kept_total || 0;
    const promisesBroken = status?.promises_broken_total || 0;
    const totalPromises = promisesKept + promisesBroken;
    const promiseSuccessRate = totalPromises > 0 ? Math.round((promisesKept / totalPromises) * 100) : 0;

    return c.json({
      success: true,
      data: {
        daysActive,
        currentStreakDays: status?.current_streak_days || 0,
        longestStreakDays: status?.longest_streak_days || 0,
        totalCallsCompleted: status?.total_calls_completed || 0,
        lastCallAt: status?.last_call_at || null,
        trustScore: status?.trust_score || 50,
        promises: {
          total: totalPromises,
          kept: promisesKept,
          broken: promisesBroken,
          successRate: promiseSuccessRate,
          keptLast7Days: status?.promises_kept_last_7_days || 0,
          brokenLast7Days: status?.promises_broken_last_7_days || 0,
        },
        calls: {
          total: totalCalls,
          successful: successfulCalls,
          successRate: callSuccessRate,
        },
        performance: {
          trending:
            promiseSuccessRate >= 80
              ? "excellent"
              : promiseSuccessRate >= 60
              ? "good"
              : "needs_improvement",
          consistencyScore: status?.current_streak_days || 0,
        },
      },
    });
  } catch (error) {
    console.error("Identity stats fetch failed:", error);
    return c.json(
      {
        error: "Failed to fetch identity statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
