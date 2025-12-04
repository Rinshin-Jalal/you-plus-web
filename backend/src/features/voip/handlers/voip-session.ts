import { Context } from "hono";
import { Env } from "@/index";
import { generateFullCallConfig } from "@/features/call/services/call-config";
import {
  cacheVoipPrompts,
  getCachedPrompts,
  getVoipSession,
  persistVoipSession,
} from "@/features/voip/services/session-store";
import { createVoipCallPayload } from "@/features/voip/services/payload";

// NOTE: LiveKit removed (migration 003) - using Cartesia Line SDK for calls

/**
 * Initialize a VoIP session
 * POST /voip/session/init
 */
export async function initVoipSession(c: Context) {
  const { userId, callType } = await c.req.json<{ userId: string; callType: string }>();
  const env = c.env as Env;

  if (!userId || !callType) {
    return c.json({ error: "Missing userId or callType" }, 400);
  }

  const callUUID = `${callType}-${userId.slice(-8)}-${Date.now()}`;
  const config = await generateFullCallConfig(env, userId, callType as any, callUUID);

  const basePayload = {
    callUUID,
    userId,
    callType: callType as any,
    mood: config.mood,
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
export async function getVoipSessionPrompts(c: Context) {
  const { callUUID } = await c.req.json<{ callUUID: string }>();
  const env = c.env as Env;

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
  const config = await generateFullCallConfig(
    env,
    payload.userId,
    payload.callType,
    callUUID,
  );

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
