/**
 * Call Configuration Endpoint - LiveKit + Cartesia + Supermemory
 *
 * This module provides the primary endpoint for generating intelligent call configurations
 * for LiveKit voice calls. It's responsible for creating personalized, behaviorally-aware
 * prompts that drive effective accountability conversations via WebRTC.
 *
 * Key Responsibilities:
 * - Generate personalized call prompts based on user behavioral data
 * - Calculate optimal tone and mood for each call scenario
 * - Integrate with prompt engine for intelligent conversation generation
 * - Provide call tracking metadata for monitoring and analytics
 * - Generate LiveKit credentials for WebRTC connection
 *
 * Call Types Supported (Super MVP):
 * - daily_reckoning: Daily accountability calls (unified morning/evening)
 *
 * Integration Flow:
 * 1. Frontend requests call configuration via /api/call/initiate-livekit
 * 2. System analyzes user behavioral patterns
 * 3. Generates personalized prompts, tone, and LiveKit credentials
 * 4. Returns configuration for LiveKit agent connection
 * 5. Call is executed with intelligent personalization
 */
import { Context } from "hono";
import { CallType } from "@/types/database";
/**
 * Generate call configuration for LiveKit calls
 *
 * This endpoint creates intelligent, personalized call configurations that
 * adapt to each user's behavioral patterns and accountability needs. It
 * integrates behavioral intelligence with tone analysis to generate
 * highly effective accountability conversations via WebRTC.
 *
 * The configuration includes:
 * - Cartesia voice ID for TTS
 * - Supermemory user ID for context retrieval
 * - Optimized mood based on user patterns
 * - Personalized system prompts and first messages
 * - Call tracking metadata for analytics
 * - Behavioral intelligence indicators
 *
 * @param c Hono context with userId and callType parameters
 * @returns JSON response with complete call configuration
 */
export declare const getCallConfig: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    payload: {
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
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
