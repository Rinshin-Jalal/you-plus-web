import { generateFullCallConfig } from "@/features/call/services/call-config";
import { cacheVoipPrompts, getCachedPrompts, getVoipSession, persistVoipSession, } from "@/features/voip/services/session-store";
import { createVoipCallPayload } from "@/features/voip/services/payload";
import { initiateLiveKitCall } from "@/features/livekit/services/call-initiator";
/**
 * Initialize a VoIP session
 * POST /voip/session/init
 */
export async function initVoipSession(c) {
    const { userId, callType } = await c.req.json();
    const env = c.env;
    if (!userId || !callType) {
        return c.json({ error: "Missing userId or callType" }, 400);
    }
    const callUUID = `${callType}-${userId.slice(-8)}-${Date.now()}`;
    const config = await generateFullCallConfig(env, userId, callType, callUUID);
    // Initiate LiveKit call to create room and get token
    let liveKitResult;
    try {
        liveKitResult = await initiateLiveKitCall(env, {
            roomName: `youplus-${userId}-${callUUID}`.toLowerCase(),
            userId,
            callUUID,
            callType: callType,
            mood: config.mood,
            prompts: config.prompts,
            cartesiaVoiceId: config.cartesiaVoiceId,
            supermemoryUserId: config.supermemoryUserId,
            metadata: {
                tone: config.toneAnalysis,
                generatedBy: "voip-session/init",
            },
        });
    }
    catch (error) {
        console.error("Warning: LiveKit initiation failed, continuing without room:", error);
        // Continue without LiveKit room - client can retry later
    }
    const basePayload = {
        callUUID,
        userId,
        callType: callType,
        mood: config.mood,
        ...(liveKitResult?.roomName && { roomName: liveKitResult.roomName }),
        ...(liveKitResult?.token && { liveKitToken: liveKitResult.token }),
        cartesiaVoiceId: config.cartesiaVoiceId,
        supermemoryUserId: config.supermemoryUserId,
        metadata: {
            tone: config.toneAnalysis,
            generatedBy: "voip-session/init",
        },
    };
    const payload = createVoipCallPayload(basePayload);
    await persistVoipSession(env, payload, undefined, "scheduled");
    return c.json({
        success: true,
        callUUID,
        payload,
    });
}
/**
 * Get prompts for a VoIP session
 * POST /voip/session/prompts
 */
export async function getVoipSessionPrompts(c) {
    const { callUUID } = await c.req.json();
    const env = c.env;
    if (!callUUID) {
        return c.json({ error: "Missing callUUID" }, 400);
    }
    const session = await getVoipSession(env, callUUID);
    if (!session) {
        return c.json({ error: "Session not found" }, 404);
    }
    const cached = getCachedPrompts(session);
    if (cached) {
        return c.json({ success: true, prompts: cached, cached: true });
    }
    const { payload } = session;
    const config = await generateFullCallConfig(env, payload.userId, payload.callType, callUUID);
    await cacheVoipPrompts(env, callUUID, config.prompts);
    return c.json({
        success: true,
        prompts: config.prompts,
        cached: false,
        mood: config.mood,
        cartesiaVoiceId: config.cartesiaVoiceId,
        supermemoryUserId: config.supermemoryUserId,
        roomName: payload.roomName,
    });
}
