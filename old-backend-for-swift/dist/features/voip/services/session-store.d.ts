/**
 * VoIP session store
 * Persists backend session tokens tied to callUUID for webhook + client validation.
 */
import { Env } from "@/index";
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
export declare function persistVoipSession(env: Env, payload: VoipCallPayload, sessionToken?: string, status?: SessionRecord["status"]): Promise<void>;
export declare function updateVoipSessionStatus(env: Env, callUUID: string, status: SessionRecord["status"], statusMetadata?: Record<string, unknown>): Promise<void>;
export declare function getVoipSession(env: Env, callUUID: string): Promise<any>;
export declare function getCachedPrompts(session: SessionRecord | null): {
    systemPrompt: string;
    firstMessage: string;
} | null;
export declare function cacheVoipPrompts(env: Env, callUUID: string, prompts: {
    systemPrompt: string;
    firstMessage: string;
}): Promise<void>;
export {};
