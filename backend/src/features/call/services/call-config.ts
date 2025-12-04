/**
 * Call configuration service
 * Generates LiveKit call configuration with Cartesia voice and Supermemory context
 */

import { Env } from "@/index";
import { CallType, UserContext, BigBruhhTone } from "@/types/database";
import { getUserContext } from "@/features/core/utils/database";
import { calculateOptimalTone } from "@/features/call/services/tone-engine";
import { getPromptForCall } from "@/services/prompt-engine";

export interface CallMetadataResult {
  mood: BigBruhhTone;
  callUUID: string;
  cartesiaVoiceId: string;
  supermemoryUserId: string;
  userContext: UserContext;
  toneAnalysis: BigBruhhTone;
}

export interface CallPromptResult {
  prompts: {
    systemPrompt: string;
    firstMessage: string;
  };
}

export interface CallFullConfigResult extends CallMetadataResult, CallPromptResult { }

export async function generateCallMetadata(
  env: Env,
  userId: string,
  callType: CallType,
  callUUID: string,
): Promise<CallMetadataResult> {
  const userContext = await getUserContext(env, userId);
  const toneAnalysis = calculateOptimalTone(userContext);

  let mood = toneAnalysis;
  // All calls use daily_reckoning mode now (bloat elimination)
  if (false) { // Disabled: apology_call removed
    mood = "Confrontational";
  }

  const cartesiaVoiceId = resolveCartesiaVoiceId(mood);
  const supermemoryUserId = userId; // Use user ID as Supermemory user ID

  return {
    mood,
    callUUID,
    cartesiaVoiceId,
    supermemoryUserId,
    userContext,
    toneAnalysis,
  };
}

export async function generateCallPrompts(
  env: Env,
  callType: CallType,
  userContext: UserContext,
  toneAnalysis: ReturnType<typeof calculateOptimalTone>,
): Promise<CallPromptResult> {
  const callPrompts = await getPromptForCall(
    callType,
    userContext,
    toneAnalysis,
    env,
  );

  return {
    prompts: {
      systemPrompt: callPrompts.systemPrompt,
      firstMessage: callPrompts.firstMessage,
    },
  };
}

export async function generateFullCallConfig(
  env: Env,
  userId: string,
  callType: CallType,
  callUUID: string,
): Promise<CallFullConfigResult> {
  const metadata = await generateCallMetadata(env, userId, callType, callUUID);
  const prompts = await generateCallPrompts(env, callType, metadata.userContext, metadata.toneAnalysis);
  return {
    ...metadata,
    ...prompts,
  };
}

/**
 * Maps mood/tone to Cartesia voice IDs for Sonic-3 TTS
 * Cartesia supports various voice IDs with different emotional characteristics
 */
function resolveCartesiaVoiceId(mood: string): string {
  const cartesiaVoiceMap: Record<string, string> = {
    // Confrontational/Direct moods - sharp, energetic voices
    angry: "79a125e8-cd45-4c13-8213-1149a61737e4",
    nuclear: "79a125e8-cd45-4c13-8213-1149a61737e4",
    disappointed: "c8606b51-3a0d-43a0-9d54-85b100854b20",

    // Calm/Supportive moods - warm, encouraging voices
    calm: "8b571d3d-285b-4fef-914a-d1a1a0ab6eb7",
    encouraging: "8b571d3d-285b-4fef-914a-d1a1a0ab6eb7",
    supportive: "8b571d3d-285b-4fef-914a-d1a1a0ab6eb7",
  };

  // Return the mapped voice ID, or default to calm/supportive voice
  return cartesiaVoiceMap[mood] || cartesiaVoiceMap.supportive || "8b571d3d-285b-4fef-914a-d1a1a0ab6eb7";
}