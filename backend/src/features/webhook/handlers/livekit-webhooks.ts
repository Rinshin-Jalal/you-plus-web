/**
 * LiveKit Webhook Handler Endpoints
 * Routes for receiving webhooks from LiveKit Cloud
 */

import { Context } from "hono";
import { Env } from "@/index";
import { createLiveKitWebhookProcessor } from "@/features/webhook/services/livekit-webhook-handler";
import { LiveKitWebhookEvent } from "@/types/livekit";

/**
 * POST /webhook/livekit
 * Main webhook endpoint for all LiveKit events
 */
export const postLiveKitWebhook = async (c: Context) => {
  const env = c.env as Env;

  try {
    // Get raw request body for signature validation
    const rawBody = await c.req.text();
    const signature = c.req.header("Authorization");

    console.log(`🔔 Received LiveKit webhook`);
    console.log(`📝 Signature: ${signature ? "Present" : "Missing"}`);
    console.log(`📦 Body length: ${rawBody.length} bytes`);

    // Validate webhook signature if secret is configured
    const webhookSecret = (env.LIVEKIT_WEBHOOK_SECRET as string) || undefined;
    const processor = createLiveKitWebhookProcessor({
      webhookSecret,
      apiKey: env.LIVEKIT_API_KEY as string,
      apiSecret: env.LIVEKIT_API_SECRET as string,
    });

    if (webhookSecret && signature) {
      // LiveKit uses Bearer token format: "Bearer <token>"
      // The token itself needs to be validated against the webhook secret
      const isValidSignature = processor.validateSignature(
        rawBody,
        signature,
        webhookSecret
      );

      if (!isValidSignature) {
        console.error("❌ Invalid webhook signature");
        return c.json({ error: "Invalid signature" }, 401);
      }

      console.log("✅ Webhook signature validated");
    } else if (webhookSecret) {
      console.warn("⚠️ Webhook secret configured but no Authorization header");
    }

    // Parse webhook payload
    let webhookEvent: LiveKitWebhookEvent;
    try {
      webhookEvent = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return c.json({ error: "Invalid JSON" }, 400);
    }

    console.log(`📌 Event type: ${webhookEvent.event}`);

    // Route to appropriate handler based on event type
    switch (webhookEvent.event) {
      case "room_finished":
        if (webhookEvent.room) {
          await processor.handleRoomFinished(env, webhookEvent.room);
        }
        break;

      case "recording_finished":
        if ((webhookEvent as any).recording) {
          await processor.handleRecordingFinished(
            env,
            (webhookEvent as any).recording
          );
        }
        break;

      case "participant_joined":
        if (webhookEvent.participant) {
          await processor.handleParticipantJoined(
            env,
            webhookEvent.participant
          );
        }
        break;

      case "participant_left":
        if (webhookEvent.participant) {
          await processor.handleParticipantLeft(env, webhookEvent.participant);
        }
        break;

      case "room_started":
        console.log("✅ Room started");
        break;

      case "track_published":
      case "track_unpublished":
        console.log(`📹 Track event: ${webhookEvent.event}`);
        break;

      default:
        console.warn(`⚠️ Unknown event type: ${webhookEvent.event}`);
    }

    // Return success
    return c.json({ status: "ok", event: webhookEvent.event });
  } catch (error) {
    console.error("Error processing LiveKit webhook:", error);
    return c.json(
      { error: "Internal server error", details: String(error) },
      500
    );
  }
};

/**
 * GET /webhook/livekit/test
 * Test endpoint to verify webhook configuration
 */
export const getLiveKitWebhookTest = async (c: Context) => {
  const env = c.env as Env;

  try {
    const testEvent: LiveKitWebhookEvent = {
      event: "room_finished",
      createdAt: Date.now(),
      room: {
        sid: "test-sid",
        name: "youplus-test-user-test-uuid",
        emptyTimeout: 300,
        creationTime: new Date().toISOString(),
        metadata: JSON.stringify({
          userId: "test-user",
          callUUID: "test-uuid",
          mood: "supportive",
        }),
        numParticipants: 2,
        duration: 60,
      },
    };

    const processor = createLiveKitWebhookProcessor({
      webhookSecret: (env.LIVEKIT_WEBHOOK_SECRET as string) || undefined,
    });

    console.log(`🧪 Processing test webhook event`);
    await processor.handleRoomFinished(env, testEvent.room!);

    return c.json({
      status: "ok",
      message: "Test webhook processed successfully",
      event: testEvent,
    });
  } catch (error) {
    console.error("Error processing test webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
};

/**
 * GET /webhook/livekit/health
 * Health check endpoint
 */
export const getLiveKitWebhookHealth = async (c: Context) => {
  const env = c.env as Env;

  const hasCredentials =
    !!(env.LIVEKIT_API_KEY as string) &&
    !!(env.LIVEKIT_API_SECRET as string) &&
    !!(env.LIVEKIT_URL as string);

  return c.json({
    status: hasCredentials ? "ok" : "missing_credentials",
    configured: hasCredentials,
    timestamp: new Date().toISOString(),
  });
};
