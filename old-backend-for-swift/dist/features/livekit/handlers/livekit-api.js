/**
 * LiveKit API Handler
 * HTTP endpoints for initiating calls and managing LiveKit sessions
 */
import { initiateLiveKitCall } from "@/features/livekit/services/call-initiator";
import { generateFullCallConfig } from "@/features/call/services/call-config";
import { createVoipCallPayload } from "@/features/voip/services/payload";
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
export const postInitiateLiveKitCall = async (c) => {
    const env = c.env;
    try {
        const body = await c.req.json();
        const { userId, callType } = body;
        if (!userId || !callType) {
            return c.json({ error: "Missing required fields: userId, callType" }, 400);
        }
        console.log(`📞 Initiating LiveKit call for user ${userId}`);
        // Generate unique call UUID
        const callUUID = crypto.randomUUID();
        // Generate call configuration (tone, prompts, voice, etc.)
        const callConfig = await generateFullCallConfig(env, userId, callType, callUUID);
        // Initiate LiveKit call
        const liveKitResult = await initiateLiveKitCall(env, {
            roomName: `youplus-${userId}-${callUUID}`.toLowerCase(),
            userId,
            callUUID,
            callType,
            mood: callConfig.mood,
            prompts: callConfig.prompts,
            cartesiaVoiceId: callConfig.cartesiaVoiceId,
            supermemoryUserId: callConfig.supermemoryUserId,
            metadata: {
                userContext: callConfig.userContext,
                toneAnalysis: callConfig.toneAnalysis,
            },
        });
        // Create VoIP payload for push notification
        const voipPayload = createVoipCallPayload({
            callUUID,
            userId,
            callType,
            mood: callConfig.mood,
            prompts: callConfig.prompts,
            roomName: liveKitResult.roomName,
            liveKitToken: liveKitResult.token,
            cartesiaVoiceId: callConfig.cartesiaVoiceId,
            supermemoryUserId: callConfig.supermemoryUserId,
            metadata: {
                expiresIn: liveKitResult.expiresIn,
            },
        });
        console.log(`✅ LiveKit call initiated: ${callUUID}`);
        return c.json({
            status: "success",
            callUUID,
            roomName: liveKitResult.roomName,
            token: liveKitResult.token,
            expiresIn: liveKitResult.expiresIn,
            voipPayload,
        });
    }
    catch (error) {
        console.error("Error initiating LiveKit call:", error);
        return c.json({ error: "Failed to initiate call", details: String(error) }, 500);
    }
};
