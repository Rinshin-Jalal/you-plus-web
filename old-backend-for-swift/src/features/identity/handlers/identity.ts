/**
 * Identity System - Current identity management and evolution tracking
 *
 * This module provides comprehensive identity management for the YOU+ accountability
 * system. It handles the user's current identity, psychological profile, performance
 * tracking, and behavioral statistics. The identity system is central to creating
 * personalized accountability experiences.
 *
 * Key Features:
 * - Current identity management with 60+ psychological data points
 * - Trust percentage and streak tracking
 * - Promise performance analytics
 * - Voice clip management for emotional impact
 * - Performance statistics and trending analysis
 * - Final oath and commitment tracking
 *
 * Psychological Components:
 * - Identity Name: The persona the user wants to become
 * - Fear Version: Who they're afraid of becoming
 * - Desired Outcome: Their transformation goal
 * - Key Sacrifice: What they must give up
 * - Identity Oath: Their sacred commitment
 * - Enforcement Tone: How they want accountability
 *
 * Data Flow:
 * 1. User creates/updates identity during onboarding
 * 2. System tracks performance against identity goals
 * 3. Trust percentage adjusts based on promise-keeping
 * 4. Voice clips provide emotional connection to commitments
 * 5. Statistics drive behavioral insights and interventions
 */

import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { Identity, IdentityStatus } from "@/types/database";

/**
 * Get current identity with status and statistics (Super MVP)
 *
 * Returns identity profile using Super MVP schema with simplified fields.
 * All psychological data is stored in onboarding_context JSONB field.
 *
 * Super MVP Features:
 * - Core identity fields (name, daily_commitment, chosen_path, call_time, strike_limit)
 * - Voice recording URLs (3 audio files)
 * - Onboarding context JSONB (all psychological data)
 * - Simple streak tracking (current_streak_days, total_calls_completed)
 * - Call statistics and success rates
 * - Days active since identity creation
 *
 * @param c Hono context with userId parameter
 * @returns JSON response with Super MVP identity data and statistics
 */
export const getCurrentIdentity = async (c: Context) => {
  const userId = c.req.param("userId");
  const authenticatedUserId = getAuthenticatedUserId(c);

  // Security: Users can only access their own identity
  // This ensures privacy and prevents unauthorized access to personal identity data
  if (userId !== authenticatedUserId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Step 1: Get current identity with all psychological data
    // This includes identity name, summary, fears, goals, and commitments
    const { data: identity, error: identityError } = await supabase
      .from("identity")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (identityError) {
      return c.json({ error: "Identity not found" }, 404);
    }

    // Step 2: Get identity status for performance tracking (Super MVP schema)
    // Super MVP: Only current_streak_days, total_calls_completed, last_call_at
    const { data: identityStatus, error: statusError } = await supabase
      .from("identity_status")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Step 3: Calculate days since identity creation
    // This provides context for identity evolution and commitment duration
    const startDate = new Date(identity.created_at);
    const daysActive = Math.floor(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Step 4: Get call statistics for accountability tracking
    // This measures how well the user responds to accountability calls
    const { data: callStats, error: callError } = await supabase
      .from("calls")
      .select("duration_sec")
      .eq("user_id", userId);

    const totalCalls = callStats?.length || 0;
    const answeredCalls =
      callStats?.filter((call) => call.duration_sec > 0).length || 0;
    const successRate =
      totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

    // Step 5: Compile identity data (Super MVP schema)
    // Super MVP: 12 columns (5 core + 3 voice URLs + 1 JSONB + system fields)
    const identityData = {
      // System fields
      id: identity.id,
      userId: identity.user_id,
      createdAt: identity.created_at,
      updatedAt: identity.updated_at,
      daysActive,

      // Core identity fields (Super MVP)
      name: identity.name,
      dailyCommitment: identity.daily_commitment,
      chosenPath: identity.chosen_path, // "hopeful" | "doubtful"
      callTime: identity.call_time, // TIME format "HH:MM:SS"
      strikeLimit: identity.strike_limit, // 1-5

      // Voice recording URLs
      voiceRecordings: {
        whyItMatters: identity.why_it_matters_audio_url,
        costOfQuitting: identity.cost_of_quitting_audio_url,
        commitment: identity.commitment_audio_url,
      },

      // Onboarding context (JSONB - all psychological data)
      onboardingContext: identity.onboarding_context,

      // Status information (Super MVP simplified)
      currentStreakDays: identityStatus?.current_streak_days || 0,
      totalCallsCompleted: identityStatus?.total_calls_completed || 0,
      lastCallAt: identityStatus?.last_call_at || null,

      // Call statistics
      stats: {
        totalCalls,
        answeredCalls,
        successRate,
        longestStreak: identityStatus?.current_streak_days || 0,
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

/**
 * Update current identity (Super MVP)
 *
 * Allows updating user's identity profile with Super MVP schema fields.
 * Only core operational fields can be updated. Psychological data is
 * stored in onboarding_context JSONB and set during onboarding.
 *
 * Updatable Fields (Super MVP):
 * - dailyCommitment: The daily action they committed to
 * - callTime: TIME format "HH:MM:SS" for daily accountability call
 * - strikeLimit: Number of allowed missed days (1-5)
 * - onboardingContext: JSONB object (optional - for corrections)
 *
 * Note: name and chosenPath are typically set during onboarding and not changed
 *
 * @param c Hono context with identity data in request body
 * @returns JSON response confirming identity update
 */
export const updateIdentity = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const identityData = await c.req.json();

  if (!identityData || typeof identityData !== "object") {
    return c.json({ error: "Identity data required" }, 400);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Build update object with only Super MVP fields
    // Only update fields that are provided in the request
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase request fields to snake_case database fields
    if (identityData.dailyCommitment !== undefined) {
      updateData.daily_commitment = identityData.dailyCommitment;
    }
    if (identityData.callTime !== undefined) {
      updateData.call_time = identityData.callTime;
    }
    if (identityData.strikeLimit !== undefined) {
      updateData.strike_limit = identityData.strikeLimit;
    }
    if (identityData.onboardingContext !== undefined) {
      updateData.onboarding_context = identityData.onboardingContext;
    }
    // Note: name and chosen_path typically not updated after onboarding
    if (identityData.name !== undefined) {
      updateData.name = identityData.name;
    }
    if (identityData.chosenPath !== undefined) {
      updateData.chosen_path = identityData.chosenPath;
    }

    // Update the identity record with Super MVP fields only
    const { data: updatedIdentity, error: updateError } = await supabase
      .from("identity")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`🆔 Identity updated for user ${userId} (Super MVP schema)`);

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

/**
 * Update identity status (Super MVP - simplified streak tracking)
 *
 * This endpoint manages performance tracking with Super MVP's simplified schema.
 * Only basic streak and call tracking - no trust percentage or promise counts.
 * Uses upsert to handle both creation and updates seamlessly.
 *
 * Super MVP Status Fields:
 * - current_streak_days: Consecutive days of kept commitments
 * - total_calls_completed: Total number of completed accountability calls
 * - last_call_at: Timestamp of last completed call
 *
 * @param c Hono context with status data in request body
 * @returns JSON response confirming status update
 */
export const updateIdentityStatus = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const {
    currentStreakDays,
    totalCallsCompleted,
    lastCallAt,
  } = await c.req.json();

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Build update object with Super MVP identity_status fields
    const statusData: any = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    // Only include provided fields
    if (currentStreakDays !== undefined) {
      statusData.current_streak_days = currentStreakDays;
    }
    if (totalCallsCompleted !== undefined) {
      statusData.total_calls_completed = totalCallsCompleted;
    }
    if (lastCallAt !== undefined) {
      statusData.last_call_at = lastCallAt;
    }

    // Update identity status using upsert for seamless creation/update
    // Super MVP: Only streak days, total calls, and last call timestamp
    const { data: updatedStatus, error: statusError } = await supabase
      .from("identity_status")
      .upsert(statusData, { onConflict: "user_id" })
      .select()
      .single();

    if (statusError) throw statusError;

    console.log(`📊 Identity status updated for user ${userId} (Super MVP schema)`);

    return c.json({
      success: true,
      data: updatedStatus,
      message: "Identity status updated successfully",
    });
  } catch (error) {
    console.error("Identity status update failed:", error);
    return c.json(
      {
        error: "Failed to update identity status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

/**
 * Get identity performance statistics (Super MVP)
 *
 * Provides performance analytics using Super MVP's simplified schema.
 * Calculates success rates, trends, and behavioral insights for accountability.
 *
 * Super MVP Metrics:
 * - Days Active: Time since identity creation
 * - Current Streak: Consecutive days of kept commitments
 * - Total Calls Completed: Count of completed accountability calls
 * - Promise Success Rate: Kept vs broken promises
 * - Call Answer Rate: Responsiveness to accountability
 * - Performance Trending: Excellent/Good/Needs Improvement
 *
 * @param c Hono context with userId parameter
 * @returns JSON response with Super MVP performance statistics
 */
export const getIdentityStats = async (c: Context) => {
  const userId = c.req.param("userId");
  const authenticatedUserId = getAuthenticatedUserId(c);

  if (userId !== authenticatedUserId) {
    return c.json({ error: "Access denied" }, 403);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Step 1: Get current identity status for performance tracking
    const { data: identityStatus, error: statusError } = await supabase
      .from("identity_status")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Step 2: Get promises statistics for accountability tracking
    const { data: promises } = await supabase
      .from("promises")
      .select("status, created_at")
      .eq("user_id", userId);

    // Step 3: Get calls statistics for responsiveness measurement
    const { data: calls } = await supabase
      .from("calls")
      .select("duration_sec, created_at")
      .eq("user_id", userId);

    if (statusError && statusError.code !== "PGRST116") {
      // Not found is OK
      throw statusError;
    }

    // Step 4: Calculate comprehensive performance metrics
    const totalPromises = promises?.length || 0;
    const keptPromises =
      promises?.filter((p) => p.status === "kept").length || 0;
    const brokenPromises =
      promises?.filter((p) => p.status === "broken").length || 0;
    const successRate =
      totalPromises > 0 ? Math.round((keptPromises / totalPromises) * 100) : 0;

    const totalCalls = calls?.length || 0;
    const answeredCalls = calls?.filter((c) => c.duration_sec > 0).length || 0;
    const callAnswerRate =
      totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

    // Step 5: Calculate days since identity creation for context
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

    // Step 6: Return Super MVP performance statistics
    return c.json({
      success: true,
      data: {
        daysActive,
        // Super MVP: Simplified status tracking
        currentStreakDays: identityStatus?.current_streak_days || 0,
        totalCallsCompleted: identityStatus?.total_calls_completed || 0,
        lastCallAt: identityStatus?.last_call_at || null,
        promises: {
          total: totalPromises,
          kept: keptPromises,
          broken: brokenPromises,
          successRate,
        },
        calls: {
          total: totalCalls,
          answered: answeredCalls,
          answerRate: callAnswerRate,
        },
        performance: {
          trending:
            successRate >= 80
              ? "excellent"
              : successRate >= 60
              ? "good"
              : "needs_improvement",
          consistencyScore: identityStatus?.current_streak_days || 0,
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