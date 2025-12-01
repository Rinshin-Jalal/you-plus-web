import { Context } from "hono";
/**
 * Initialize a VoIP session
 * POST /voip/session/init
 */
export declare function initVoipSession(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    callUUID: string;
    payload: {
        callUUID: string;
        userId: string;
        callType: import("../../../types/database").CallType;
        mood: string;
        prompts?: {
            systemPrompt: string;
            firstMessage: string;
        } | undefined;
        sessionToken?: string | undefined;
        agentId?: string | undefined;
        voiceId?: string | undefined;
        roomName?: string | undefined;
        liveKitToken?: string | undefined;
        cartesiaVoiceId?: string | undefined;
        supermemoryUserId?: string | undefined;
        handoff?: {
            scheduleId?: string | undefined;
            jobId?: string | undefined;
            initiatedBy: "scheduler" | "manual";
            retries?: number | undefined;
        } | undefined;
        metadata?: {
            [x: string]: import("hono/utils/types").JSONValue;
        } | undefined;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
/**
 * Get prompts for a VoIP session
 * POST /voip/session/prompts
 */
export declare function getVoipSessionPrompts(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    prompts: {
        systemPrompt: string;
        firstMessage: string;
    };
    cached: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    prompts: {
        systemPrompt: string;
        firstMessage: string;
    };
    cached: false;
    mood: import("../../../types/database").BigBruhhTone;
    cartesiaVoiceId: string;
    supermemoryUserId: string;
    roomName: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
