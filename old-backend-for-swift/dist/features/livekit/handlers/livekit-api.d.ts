/**
 * LiveKit API Handler
 * HTTP endpoints for initiating calls and managing LiveKit sessions
 */
import { Context } from "hono";
import { CallType } from "@/types/database";
/**
 * POST /api/call/initiate-livekit
 * Initiate a new LiveKit call
 *
 * Body:
 * {
 *   userId: string;
 *   callType: "daily_reckoning";
 * }
 */
export declare const postInitiateLiveKitCall: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    status: string;
    callUUID: `${string}-${string}-${string}-${string}-${string}`;
    roomName: string;
    token: string;
    expiresIn: number;
    voipPayload: {
        callUUID: string;
        userId: string;
        callType: CallType;
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
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
