import type { Context } from "hono";
import type { Env } from "@/index";
import {
  createSupabaseClient,
  updateTrustScore,
  upsertCallMemory,
} from "@/features/core/utils/database";
import { syncIdentityStatus } from "@/features/identity/utils/identity-status-sync";

interface CallReportPayload {
  user_id: string;
  kept_promise: boolean | null;
  notes?: string;
  call_type: string;
  conversation_id?: string;
  duration_seconds?: number;
  tomorrow_commitment?: string;
  tomorrow_commitment_time?: string;
  tomorrow_commitment_specific?: boolean;
  mood?: string;
  excuses_detected?: Array<{ excuse: string; pattern: string; confidence: number }>;
  quotes_captured?: Array<{ quote: string; context: string }>;
}

export const postCallReport = async (c: Context) => {
  const env = c.env as Env;

  try {
    const body = (await c.req.json()) as CallReportPayload;
    const {
      user_id,
      kept_promise,
      notes,
      call_type,
      conversation_id,
      duration_seconds,
      tomorrow_commitment,
      tomorrow_commitment_time,
      tomorrow_commitment_specific,
      mood,
      excuses_detected,
      quotes_captured,
    } = body;

    // Validate required fields
    if (!user_id) {
      return c.json({ success: false, error: "user_id is required" }, 400);
    }

    console.log(`Call report received for user ${user_id}:`, {
      kept_promise,
      call_type,
      duration_seconds,
    });

    const supabase = createSupabaseClient(env);
    const now = new Date().toISOString();

    if (conversation_id) {
      const { error: updateError } = await supabase
        .from("call_analytics")
        .update({
          promise_kept: kept_promise,
          call_duration_seconds: duration_seconds || 0,
          call_successful: "success",
          mood: mood || "unknown",
          tomorrow_commitment,
          commitment_time: tomorrow_commitment_time,
          commitment_is_specific: tomorrow_commitment_specific || false,
          excuses_detected: excuses_detected || [],
          quotes_captured: quotes_captured || [],
          acknowledged: true,
          acknowledged_at: now,
          end_time: now,
          transcript_summary: notes,
        })
        .eq("conversation_id", conversation_id);

      if (updateError) {
        console.error("Error updating call_analytics:", updateError);
      }
    } else {
      const today = new Date().toISOString().split("T")[0];
      const { data: recentCall, error: findError } = await supabase
        .from("call_analytics")
        .select("id")
        .eq("user_id", user_id)
        .gte("created_at", `${today}T00:00:00Z`)
        .eq("acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentCall && !findError) {
        await supabase
          .from("call_analytics")
          .update({
            promise_kept: kept_promise,
            call_duration_seconds: duration_seconds || 0,
            call_successful: "success",
            mood: mood || "unknown",
            tomorrow_commitment,
            commitment_time: tomorrow_commitment_time,
            commitment_is_specific: tomorrow_commitment_specific || false,
            excuses_detected: excuses_detected || [],
            quotes_captured: quotes_captured || [],
            acknowledged: true,
            acknowledged_at: now,
            end_time: now,
            transcript_summary: notes,
          })
          .eq("id", recentCall.id);
      }
    }

    if (kept_promise !== null) {
      const trustChange = kept_promise ? 5 : -5;
      const reason = kept_promise ? "Promise kept" : "Promise broken";

      try {
        await updateTrustScore(env, user_id, trustChange, reason);
        console.log(
          `Trust score updated for user ${user_id}: ${trustChange > 0 ? "+" : ""}${trustChange} (${reason})`
        );
      } catch (trustError) {
        console.error("Error updating trust score:", trustError);
      }
    }

    if (tomorrow_commitment || quotes_captured?.length) {
      try {
        const memoryUpdates: Record<string, unknown> = {};

        if (tomorrow_commitment) {
          memoryUpdates.last_commitment = tomorrow_commitment;
          memoryUpdates.last_commitment_time = tomorrow_commitment_time;
          memoryUpdates.last_commitment_specific = tomorrow_commitment_specific || false;
        }

        if (mood) {
          memoryUpdates.last_mood = mood;
        }

        if (quotes_captured?.length) {
          const { data: currentMemory } = await supabase
            .from("call_memory")
            .select("memorable_quotes")
            .eq("user_id", user_id)
            .maybeSingle();

          const existingQuotes = currentMemory?.memorable_quotes || [];
          const newQuotes = quotes_captured.map((q) => ({
            ...q,
            date: now,
          }));
          memoryUpdates.memorable_quotes = [...existingQuotes, ...newQuotes].slice(-20);
        }

        await upsertCallMemory(env, user_id, memoryUpdates);
        console.log(`Call memory updated for user ${user_id}`);
      } catch (memoryError) {
        console.error("Error updating call memory:", memoryError);
      }
    }

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
          `Tomorrow's commitment saved for user ${user_id}: "${tomorrow_commitment}"`
        );
      }
    }

    if (excuses_detected?.length) {
      for (const excuse of excuses_detected) {
        await supabase.from("excuse_patterns").insert({
          user_id,
          excuse_text: excuse.excuse,
          excuse_pattern: excuse.pattern,
          confidence: excuse.confidence,
          call_type,
          was_called_out: false,
        });
      }
      console.log(`Saved ${excuses_detected.length} excuse patterns for user ${user_id}`);
    }

    await syncIdentityStatus(user_id, env);

    return c.json({
      success: true,
      message: "Call report processed successfully",
    });
  } catch (error) {
    console.error("Error in postCallReport:", error);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
};
