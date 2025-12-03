/**
 * Call Report Handler
 *
 * Receives call completion reports from the Cartesia Line agent.
 * Updates call status, user streak, and identity status in the database.
 *
 * This endpoint is called by the agent after each call ends with:
 * - user_id: The user who was called
 * - kept_promise: Whether they fulfilled their commitment (true/false/null)
 * - notes: Optional notes about the call
 * - call_type: Type of call (accountability_checkin)
 */

import type { Context } from "hono";
import type { Env } from "@/index";
import { createSupabaseClient } from "@/features/core/utils/database";

interface CallReportPayload {
  user_id: string;
  kept_promise: boolean | null;
  notes?: string;
  call_type: string;
  cartesia_call_id?: string;
  duration_seconds?: number;
  tomorrow_commitment?: string;
}

/**
 * POST /api/calls/report
 *
 * Receives call completion report from Cartesia agent
 */
export const postCallReport = async (c: Context) => {
  const env = c.env as Env;

  try {
    const body = await c.req.json() as CallReportPayload;
    const {
      user_id,
      kept_promise,
      notes,
      call_type,
      cartesia_call_id,
      duration_seconds,
      tomorrow_commitment,
    } = body;

    // Validate required fields
    if (!user_id) {
      return c.json({ success: false, error: "user_id is required" }, 400);
    }

    console.log(`📞 Call report received for user ${user_id}:`, {
      kept_promise,
      call_type,
      duration_seconds,
    });

    const supabase = createSupabaseClient(env);
    const now = new Date().toISOString();

    // 1. Update the call record if we have a cartesia_call_id
    if (cartesia_call_id) {
      const { error: callUpdateError } = await supabase
        .from("calls")
        .update({
          status: "completed",
          completed_at: now,
          kept_promise,
          notes,
          duration_seconds,
        })
        .eq("cartesia_call_id", cartesia_call_id);

      if (callUpdateError) {
        console.error("Error updating call record:", callUpdateError);
        // Continue anyway - don't fail the whole report
      }
    } else {
      // Find the most recent call for this user today
      const today = new Date().toISOString().split("T")[0];
      const { data: recentCall, error: findError } = await supabase
        .from("calls")
        .select("id")
        .eq("user_id", user_id)
        .eq("call_date", today)
        .eq("status", "initiated")
        .order("initiated_at", { ascending: false })
        .limit(1)
        .single();

      if (recentCall && !findError) {
        await supabase
          .from("calls")
          .update({
            status: "completed",
            completed_at: now,
            kept_promise,
            notes,
            duration_seconds,
          })
          .eq("id", recentCall.id);
      }
    }

    // 2. Update identity_status for streak tracking
    if (kept_promise !== null) {
      const { data: currentStatus, error: statusError } = await supabase
        .from("identity_status")
        .select("current_streak_days, longest_streak_days, total_calls")
        .eq("user_id", user_id)
        .single();

      if (!statusError && currentStatus) {
        const newStreak = kept_promise
          ? (currentStatus.current_streak_days || 0) + 1
          : 0; // Reset streak on broken promise

        const longestStreak = Math.max(
          newStreak,
          currentStatus.longest_streak_days || 0
        );

        await supabase
          .from("identity_status")
          .update({
            current_streak_days: newStreak,
            longest_streak_days: longestStreak,
            total_calls: (currentStatus.total_calls || 0) + 1,
            last_call_at: now,
            last_call_kept_promise: kept_promise,
            updated_at: now,
          })
          .eq("user_id", user_id);

        console.log(
          `✅ Updated streak for user ${user_id}: ${newStreak} days (kept: ${kept_promise})`
        );
      }
    }

    // 3. Store tomorrow's commitment if provided
    if (tomorrow_commitment) {
      const { error: identityError } = await supabase
        .from("identity")
        .update({
          daily_commitment: tomorrow_commitment,
          updated_at: now,
        })
        .eq("user_id", user_id);

      if (identityError) {
        console.error("Error updating tomorrow commitment:", identityError);
      } else {
        console.log(
          `📝 Tomorrow's commitment saved for user ${user_id}: "${tomorrow_commitment}"`
        );
      }
    }

    return c.json({
      success: true,
      message: "Call report processed successfully",
    });
  } catch (error) {
    console.error("💥 Error in postCallReport:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      500
    );
  }
};
