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
import { generateCallMetadata } from "@/features/call/services/call-config";
import { createVoipCallPayload } from "@/features/voip/services/payload";
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
export const getCallConfig = async (c) => {
    const { userId, callType } = c.req.param();
    const env = c.env;
    // Super MVP: Only one call type
    const validCallTypes = [
        "daily_reckoning",
    ];
    if (!userId || !callType || !validCallTypes.includes(callType)) {
        return c.json({ error: "Invalid userId or callType" }, 400);
    }
    try {
        const callUUID = `${callType}-${userId.slice(-8)}-${Date.now()}`;
        const metadata = await generateCallMetadata(env, userId, callType, callUUID);
        const basePayload = {
            callUUID,
            userId,
            callType: callType,
            cartesiaVoiceId: metadata.cartesiaVoiceId,
            supermemoryUserId: metadata.supermemoryUserId,
            mood: metadata.mood,
            handoff: {
                initiatedBy: "manual",
            },
            metadata: {
                tone: metadata.toneAnalysis,
                generatedBy: "getCallConfig",
            },
        };
        const payload = createVoipCallPayload(basePayload);
        return c.json({
            success: true,
            payload,
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: "Config generation failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
