/**
 * VoIP session store
 * Persists backend session tokens tied to callUUID for webhook + client validation.
 */
import { createSupabaseClient } from "@/features/core/utils/database";
export async function persistVoipSession(env, payload, sessionToken, status = "scheduled") {
    try {
        const supabase = createSupabaseClient(env);
        const now = new Date().toISOString();
        const { error } = await supabase
            .from("voip_sessions")
            .upsert({
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
        }, { onConflict: "call_uuid" });
        if (error) {
            console.warn("Failed to persist VoIP session (non-fatal):", error);
        }
    }
    catch (error) {
        console.warn("VoIP session persistence skipped (non-fatal):", error);
    }
}
export async function updateVoipSessionStatus(env, callUUID, status, statusMetadata) {
    try {
        const supabase = createSupabaseClient(env);
        const { error } = await supabase
            .from("voip_sessions")
            .update({
            status,
            status_metadata: statusMetadata,
            updated_at: new Date().toISOString(),
        })
            .eq("call_uuid", callUUID);
        if (error) {
            console.warn("Failed to update VoIP session status (non-fatal):", error);
        }
    }
    catch (error) {
        console.warn("VoIP session status update skipped (non-fatal):", error);
    }
}
export async function getVoipSession(env, callUUID) {
    try {
        const supabase = createSupabaseClient(env);
        const { data, error } = await supabase
            .from("voip_sessions")
            .select("*")
            .eq("call_uuid", callUUID)
            .maybeSingle();
        if (error) {
            console.warn("Failed to load VoIP session (non-fatal):", error);
            return null;
        }
        return data || null;
    }
    catch (error) {
        console.warn("VoIP session lookup skipped (non-fatal):", error);
        return null;
    }
}
export function getCachedPrompts(session) {
    if (!session?.prompts_generated)
        return null;
    return session.prompts_cache || null;
}
export async function cacheVoipPrompts(env, callUUID, prompts) {
    try {
        const supabase = createSupabaseClient(env);
        const { error } = await supabase
            .from("voip_sessions")
            .update({
            prompts_generated: true,
            prompts_cache: prompts,
            updated_at: new Date().toISOString(),
        })
            .eq("call_uuid", callUUID);
        if (error) {
            console.warn("Failed to cache VoIP prompts (non-fatal):", error);
        }
    }
    catch (error) {
        console.warn("VoIP prompt caching skipped (non-fatal):", error);
    }
}
