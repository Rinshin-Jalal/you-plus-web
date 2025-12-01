import { Context } from "hono";
/**
 * ElevenLabs Post-Call Webhook Handler
 * Handles both transcription and audio webhooks from ElevenLabs with R2 storage
 */
export declare const postElevenLabsWebhook: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    conversation_id: string;
    type: "post_call_transcription" | "post_call_audio";
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
    timestamp: string;
}, 500, "json">)>;
/**
 * Handle chunked/streaming audio webhooks with R2 storage
 * Audio webhooks are delivered with transfer-encoding: chunked
 */
export declare const postElevenLabsAudioWebhook: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    conversation_id: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
    timestamp: string;
}, 500, "json">)>;
/**
 * Test endpoint to verify webhook configuration
 */
export declare const getElevenLabsWebhookTest: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    status: string;
    timestamp: string;
    endpoints: {
        transcription: string;
        audio: string;
    };
    storage: {
        database: string;
        audio_storage: string;
        r2_bucket: string;
    };
    features: string[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
