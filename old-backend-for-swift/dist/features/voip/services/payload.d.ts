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
    agentId?: string;
    voiceId?: string;
    roomName?: string;
    liveKitToken?: string;
    cartesiaVoiceId?: string;
    supermemoryUserId?: string;
    handoff?: {
        scheduleId?: string;
        jobId?: string;
        initiatedBy: "scheduler" | "manual";
        retries?: number;
    };
    metadata?: Record<string, unknown>;
}
export declare function createVoipCallPayload(params: VoipCallPayload): VoipCallPayload;
export {};
