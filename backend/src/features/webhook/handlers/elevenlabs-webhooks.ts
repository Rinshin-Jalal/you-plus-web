import { Context } from "hono";
import { createElevenLabsWebhookHandler } from "@/features/webhook/services/elevenlabs-webhook-handler";
import { ElevenLabsWebhookEvent } from "@/types/elevenlabs";
import { Env } from "@/index";

/**
 * ElevenLabs Post-Call Webhook Handler
 * Handles both transcription and audio webhooks from ElevenLabs with R2 storage
 */
export const postElevenLabsWebhook = async (c: Context) => {
  const env = c.env as Env;

  try {
    // Get raw request body for signature validation
    const rawBody = await c.req.text();
    const signature = c.req.header("ElevenLabs-Signature");

    console.log(`🔔 Received ElevenLabs webhook`);
    console.log(`📝 Signature: ${signature ? "Present" : "Missing"}`);
    console.log(`📦 Body length: ${rawBody.length} bytes`);

    // Validate webhook signature if secret is configured
    const webhookSecret = env.ELEVENLABS_WEBHOOK_SECRET || undefined;
    if (webhookSecret && signature) {
      const webhookHandler = createElevenLabsWebhookHandler({
        ...env,
        ELEVENLABS_WEBHOOK_SECRET: webhookSecret as string,
      });

      const isValidSignature = webhookHandler.validateSignature(
        rawBody,
        signature,
        webhookSecret as string
      );

      if (!isValidSignature) {
        console.error("❌ Invalid webhook signature");
        return c.json({ error: "Invalid signature" }, 401);
      }

      console.log("✅ Webhook signature validated");
    } else if (webhookSecret) {
      console.warn("⚠️ Webhook secret configured but no signature provided");
    }

    // Parse webhook payload
    let webhookEvent: ElevenLabsWebhookEvent;
    try {
      webhookEvent = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse webhook payload:", parseError);
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    // Validate webhook event structure
    if (!webhookEvent.type || !webhookEvent.data) {
      console.error("❌ Invalid webhook event structure");
      return c.json({ error: "Invalid webhook structure" }, 400);
    }

    console.log(`🎯 Processing webhook type: ${webhookEvent.type}`);
    console.log(`🆔 Conversation ID: ${webhookEvent.data.conversation_id}`);

    // Create webhook handler and process event
    const webhookHandler = createElevenLabsWebhookHandler({
      ...env,
      ELEVENLABS_WEBHOOK_SECRET: (webhookSecret || '') as string,
    });

    const result = await webhookHandler.processWebhook(webhookEvent);

    if (result.success) {
      console.log(`✅ Successfully processed ${webhookEvent.type} webhook`);
      return c.json({
        success: true,
        message: "Webhook processed successfully",
        conversation_id: webhookEvent.data.conversation_id,
        type: webhookEvent.type,
      });
    } else {
      console.error(`❌ Webhook processing failed: ${result.error}`);
      return c.json({
        success: false,
        error: result.error || "Processing failed"
      }, 500);
    }

  } catch (error) {
    console.error("❌ ElevenLabs webhook endpoint error:", error);
    return c.json(
      {
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

/**
 * Handle chunked/streaming audio webhooks with R2 storage
 * Audio webhooks are delivered with transfer-encoding: chunked
 */
export const postElevenLabsAudioWebhook = async (c: Context) => {
  const env = c.env as Env;

  try {
    console.log(`🎵 Received ElevenLabs audio webhook (chunked)`);

    // Handle chunked transfer encoding
    const transferEncoding = c.req.header("transfer-encoding");
    const isChunked = transferEncoding?.toLowerCase() === "chunked";

    console.log(`📡 Transfer encoding: ${transferEncoding || "none"}`);
    console.log(`🔄 Is chunked: ${isChunked}`);

    // Get raw body (Hono handles chunked encoding automatically)
    const rawBody = await c.req.text();
    const signature = c.req.header("ElevenLabs-Signature");

    console.log(`📦 Received ${rawBody.length} bytes of audio webhook data`);

    // Validate signature if configured
    const webhookSecret = env.ELEVENLABS_WEBHOOK_SECRET || undefined;
    if (webhookSecret && signature) {
      const webhookHandler = createElevenLabsWebhookHandler({
        ...env,
        ELEVENLABS_WEBHOOK_SECRET: webhookSecret as string,
      });

      const isValidSignature = webhookHandler.validateSignature(
        rawBody,
        signature,
        webhookSecret as string
      );

      if (!isValidSignature) {
        console.error("❌ Invalid audio webhook signature");
        return c.json({ error: "Invalid signature" }, 401);
      }
    }

    // Parse and process audio webhook
    let webhookEvent: ElevenLabsWebhookEvent;
    try {
      webhookEvent = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse audio webhook payload:", parseError);
      return c.json({ error: "Invalid JSON payload" }, 400);
    }

    if (webhookEvent.type !== "post_call_audio") {
      console.error(`❌ Expected post_call_audio, got: ${webhookEvent.type}`);
      return c.json({ error: "Invalid webhook type for audio endpoint" }, 400);
    }

    // Process audio webhook
    const webhookHandler = createElevenLabsWebhookHandler({
      ...env,
      ELEVENLABS_WEBHOOK_SECRET: (webhookSecret || '') as string,
    });

    const result = await webhookHandler.processWebhook(webhookEvent);

    if (result.success) {
      console.log(`✅ Successfully processed audio webhook`);
      return c.json({
        success: true,
        message: "Audio webhook processed successfully",
        conversation_id: webhookEvent.data.conversation_id,
      });
    } else {
      console.error(`❌ Audio webhook processing failed: ${result.error}`);
      return c.json({
        success: false,
        error: result.error || "Audio processing failed"
      }, 500);
    }

  } catch (error) {
    console.error("❌ Audio webhook endpoint error:", error);
    return c.json(
      {
        error: "Audio webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
};

/**
 * Test endpoint to verify webhook configuration
 */
export const getElevenLabsWebhookTest = async (c: Context) => {
  return c.json({
    status: "ElevenLabs webhook endpoint is active",
    timestamp: new Date().toISOString(),
    endpoints: {
      transcription: "/webhook/elevenlabs",
      audio: "/webhook/elevenlabs/audio",
    },
    storage: {
      database: "Supabase",
      audio_storage: "R2 with database fallback",
      r2_bucket: "youplus-audio-recordings"
    },
    features: [
      "HMAC signature validation",
      "Transcription webhook processing",
      "Audio webhook processing (chunked)",
      "Success evaluation analysis",
      "Data collection extraction",
      "R2 audio storage with fallback",
      "Database storage with analytics views",
      "Follow-up action triggers",
    ],
  });
};