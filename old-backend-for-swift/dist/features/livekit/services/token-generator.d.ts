/**
 * LiveKit Token Generator Service
 * Generates JWT tokens for iOS clients to connect to LiveKit Cloud
 */
import { Env } from "@/index";
export interface LiveKitTokenPayload {
    userId: string;
    callUUID: string;
    roomName: string;
    identity: string;
    metadata?: Record<string, unknown>;
}
export interface LiveKitTokenResult {
    token: string;
    expiresAt: number;
    expiresIn: number;
}
/**
 * Generate JWT token for LiveKit access
 * Token allows iOS app to connect to LiveKit Cloud room
 */
export declare function generateLiveKitToken(env: Env, payload: LiveKitTokenPayload, durationSeconds?: number): Promise<LiveKitTokenResult>;
/**
 * Generate unique room name for a call
 * Format: youplus-{userId}-{callUUID}
 */
export declare function generateRoomName(userId: string, callUUID: string): string;
/**
 * Generate participant identity for iOS client
 * Format: {userId}@{callUUID}
 */
export declare function generateParticipantIdentity(userId: string, callUUID: string): string;
