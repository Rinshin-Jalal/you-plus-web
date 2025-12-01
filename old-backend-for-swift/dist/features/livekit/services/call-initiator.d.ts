/**
 * LiveKit Call Initiator Service
 * Creates LiveKit rooms and initiates agent dispatch
 */
import { Env } from "@/index";
import { CallType } from "@/types/database";
export interface LiveKitRoomConfig {
    roomName: string;
    userId: string;
    callUUID: string;
    callType: CallType;
    mood: string;
    prompts: {
        systemPrompt: string;
        firstMessage: string;
    };
    cartesiaVoiceId: string;
    supermemoryUserId: string;
    metadata: Record<string, unknown>;
}
export interface LiveKitInitiationResult {
    roomName: string;
    participantIdentity: string;
    token: string;
    expiresIn: number;
    agentDispatchUrl: string;
}
/**
 * Initiate a LiveKit call by creating room and generating access token
 */
export declare function initiateLiveKitCall(env: Env, config: LiveKitRoomConfig): Promise<LiveKitInitiationResult>;
/**
 * Validate LiveKit Cloud credentials
 */
export declare function validateLiveKitCredentials(env: Env): Promise<boolean>;
