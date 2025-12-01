/**
 * LiveKit Webhook Handler Service
 * Processes webhooks from LiveKit Cloud (room events, recordings, etc)
 */
import { Env } from "@/index";
import { RoomFinishedEvent } from "@/types/livekit";
export interface WebhookConfig {
    webhookSecret?: string | undefined;
    apiKey?: string | undefined;
    apiSecret?: string | undefined;
}
/**
 * Handles LiveKit webhook events and routes to appropriate processors
 */
export declare class LiveKitWebhookProcessor {
    private webhookSecret?;
    constructor(config: WebhookConfig);
    /**
     * Validate webhook signature from LiveKit
     * Uses HMAC-SHA256 with webhook secret
     */
    validateSignature(body: string, signature: string, webhookSecret: string): boolean;
    /**
     * Process room_finished event
     * Called when a LiveKit room closes
     */
    handleRoomFinished(env: Env, event: RoomFinishedEvent): Promise<void>;
    /**
     * Process recording_finished event
     * Called when LiveKit recording becomes available
     */
    handleRecordingFinished(env: Env, event: any): Promise<void>;
    /**
     * Process participant_joined event
     * Called when participant joins room (agent connection)
     */
    handleParticipantJoined(env: Env, event: any): Promise<void>;
    /**
     * Process participant_left event
     * Called when participant leaves room
     */
    handleParticipantLeft(env: Env, event: any): Promise<void>;
}
/**
 * Factory function to create webhook processor
 */
export declare function createLiveKitWebhookProcessor(config: WebhookConfig): LiveKitWebhookProcessor;
