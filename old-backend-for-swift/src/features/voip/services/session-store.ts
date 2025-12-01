/**
 * VoIP session store
 * Persists backend session tokens tied to callUUID for webhook + client validation.
 */

import { Env } from "@/index";
import { createSupabaseClient } from "@/features/core/utils/database";
import { VoipCallPayload } from "./payload";

interface SessionRecord {
  call_uuid: string;
  user_id: string;
  session_token?: string;
  payload: VoipCallPayload;
  status: "scheduled" | "ringing" | "connected" | "ended" | "failed";
  status_metadata?: Record<string, unknown>;
  prompts_generated?: boolean;
  prompts_cache?: {
    systemPrompt: string;
    firstMessage: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export async function persistVoipSession(
  env: Env,
  payload: VoipCallPayload,
  sessionToken?: string,
  status: SessionRecord["status"] = "scheduled",
): Promise<void> {
  try {
    const supabase = createSupabaseClient(env);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("voip_sessions" as any)
      .upsert(
        {
          call_uuid: payload.callUUID,
          user_id: payload.userId,
          session_token: sessionToken,
          payload,
          status,
          status_metadata: payload.metadata || {},
          prompts_generated: false,
          prompts_cache: null,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "call_uuid" },
      );

    if (error) {
      console.warn("Failed to persist VoIP session (non-fatal):", error);
    }
  } catch (error) {
    console.warn("VoIP session persistence skipped (non-fatal):", error);
  }
}

export async function updateVoipSessionStatus(
  env: Env,
  callUUID: string,
  status: SessionRecord["status"],
  statusMetadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createSupabaseClient(env);

    const { error } = await supabase
      .from("voip_sessions" as any)
      .update({
        status,
        status_metadata: statusMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("call_uuid", callUUID);

    if (error) {
      console.warn("Failed to update VoIP session status (non-fatal):", error);
    }
  } catch (error) {
    console.warn("VoIP session status update skipped (non-fatal):", error);
  }
}

export async function getVoipSession(env: Env, callUUID: string) {
  try {
    const supabase = createSupabaseClient(env);

    const { data, error } = await supabase
      .from("voip_sessions" as any)
      .select("*")
      .eq("call_uuid", callUUID)
      .maybeSingle();

    if (error) {
      console.warn("Failed to load VoIP session (non-fatal):", error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.warn("VoIP session lookup skipped (non-fatal):", error);
    return null;
  }
}

export function getCachedPrompts(session: SessionRecord | null) {
  if (!session?.prompts_generated) return null;
  return session.prompts_cache || null;
}

export async function cacheVoipPrompts(
  env: Env,
  callUUID: string,
  prompts: { systemPrompt: string; firstMessage: string },
): Promise<void> {
  try {
    const supabase = createSupabaseClient(env);

    const { error } = await supabase
      .from("voip_sessions" as any)
      .update({
        prompts_generated: true,
        prompts_cache: prompts,
        updated_at: new Date().toISOString(),
      })
      .eq("call_uuid", callUUID);

    if (error) {
      console.warn("Failed to cache VoIP prompts (non-fatal):", error);
    }
  } catch (error) {
    console.warn("VoIP prompt caching skipped (non-fatal):", error);
  }
}