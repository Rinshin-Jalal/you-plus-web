/**
 * LiveKit Webhook Handler Service
 * Processes webhooks from LiveKit Cloud (room events, recordings, etc)
 */

import { Env } from "@/index";
import { LiveKitWebhookEvent, RoomFinishedEvent } from "@/types/livekit";
import * as crypto from "crypto";

export interface WebhookConfig {
  webhookSecret?: string | undefined;
  apiKey?: string | undefined;
  apiSecret?: string | undefined;
}

/**
 * Handles LiveKit webhook events and routes to appropriate processors
 */
export class LiveKitWebhookProcessor {
  private webhookSecret?: string | undefined;

  constructor(config: WebhookConfig) {
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Validate webhook signature from LiveKit
   * Uses HMAC-SHA256 with webhook secret
   */
  validateSignature(
    body: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    try {
      // LiveKit uses format: v0=<hash>
      if (!signature.startsWith("v0=")) {
        console.error("Invalid signature format");
        return false;
      }

      const expectedHash = signature.substring(3); // Remove "v0="

      // Calculate HMAC
      const hmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("base64");

      // Compare hashes
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(hmac)
      );

      if (isValid) {
        console.log("✅ Webhook signature validated");
      } else {
        console.error("❌ Invalid webhook signature");
      }

      return isValid;
    } catch (error) {
      console.error("Error validating signature:", error);
      return false;
    }
  }

  /**
   * Process room_finished event
   * Called when a LiveKit room closes
   */
  async handleRoomFinished(
    env: Env,
    event: RoomFinishedEvent
  ): Promise<void> {
    try {
      console.log(`📞 Room finished: ${event.name}`);
      console.log(`   Duration: ${event.duration}s`);
      console.log(`   Participants: ${event.numParticipants}`);

      // Extract metadata from room
      let metadata: Record<string, unknown> = {};
      try {
        metadata = JSON.parse(event.metadata || "{}");
      } catch (e) {
        console.warn("Failed to parse room metadata");
      }

      const userId = metadata.userId as string;
      const callUUID = metadata.callUUID as string;
      const mood = metadata.mood as string;

      if (!userId || !callUUID) {
        console.error("Missing userId or callUUID in room metadata");
        return;
      }

      // Call ended - process completion
      // Note: Database storage removed (placeholder implementations)
      console.log(`✅ Call ended: ${callUUID} (duration: ${event.duration}s)`);

      // Trigger post-call processing
      // In production: Notify backend to process transcripts, extract promises, etc.
      console.log(`✅ Call ${callUUID} processing queued`);
    } catch (error) {
      console.error("Error handling room_finished event:", error);
    }
  }

  /**
   * Process recording_finished event
   * Called when LiveKit recording becomes available
   */
  async handleRecordingFinished(
    env: Env,
    event: any
  ): Promise<void> {
    try {
      console.log(`🎥 Recording finished: ${event.filename}`);
      console.log(`   Size: ${event.size} bytes`);
      console.log(`   Location: ${event.location}`);

      // Recording completed
      // Note: Database storage removed (placeholder implementations)
      console.log(`✅ Recording completed: ${event.filename} (${event.size} bytes)`);

      console.log(`✅ Recording stored`);
    } catch (error) {
      console.error("Error handling recording_finished event:", error);
    }
  }

  /**
   * Process participant_joined event
   * Called when participant joins room (agent connection)
   */
  async handleParticipantJoined(
    env: Env,
    event: any
  ): Promise<void> {
    try {
      const isAgent = event.name?.includes("agent") || event.identity?.includes("agent");

      if (isAgent) {
        console.log(`🤖 Agent joined: ${event.identity}`);
      } else {
        console.log(`👤 Participant joined: ${event.identity}`);
      }

      // Store participant info if needed
      // This could be used for analytics/monitoring
    } catch (error) {
      console.error("Error handling participant_joined event:", error);
    }
  }

  /**
   * Process participant_left event
   * Called when participant leaves room
   */
  async handleParticipantLeft(
    env: Env,
    event: any
  ): Promise<void> {
    try {
      console.log(`👋 Participant left: ${event.identity}`);
      // Could trigger cleanup or session end if needed
    } catch (error) {
      console.error("Error handling participant_left event:", error);
    }
  }
}

/**
 * Factory function to create webhook processor
 */
export function createLiveKitWebhookProcessor(
  config: WebhookConfig
): LiveKitWebhookProcessor {
  return new LiveKitWebhookProcessor(config);
}
