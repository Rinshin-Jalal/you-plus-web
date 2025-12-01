/**
 * VoIP payload helpers
 * Provides shared schema for scheduler → push → CallKit handoff.
 *
 * Migration: Now supports both ElevenLabs (legacy) and LiveKit (current)
 * - ElevenLabs: agentId + voiceId
 * - LiveKit: roomName + liveKitToken + cartesiaVoiceId
 */
import { CallType } from "@/types/database";

interface VoipCallPrompts {
  systemPrompt: string;
  firstMessage: string;
}

export interface VoipCallPayload {
  callUUID: string;
  userId: string;
  callType: CallType;
  mood: string;
  prompts?: VoipCallPrompts;
  sessionToken?: string;

  // ElevenLabs (Legacy - keep for backward compatibility)
  agentId?: string;
  voiceId?: string;

  // LiveKit (Current)
  roomName?: string; // LiveKit room name
  liveKitToken?: string; // JWT token for authentication
  cartesiaVoiceId?: string; // Voice ID for Cartesia TTS
  supermemoryUserId?: string; // User ID for memory retrieval

  handoff?: {
    scheduleId?: string;
    jobId?: string;
    initiatedBy: "scheduler" | "manual";
    retries?: number;
  };
  metadata?: Record<string, unknown>;
}

export function createVoipCallPayload(params: VoipCallPayload): VoipCallPayload {
  return {
    ...params,
    metadata: {
      ...params.metadata,
      generatedAt: new Date().toISOString(),
      version: "3.0.0", // Bumped for LiveKit migration
      provider: params.roomName ? "livekit" : "elevenlabs",
    },
  };
}