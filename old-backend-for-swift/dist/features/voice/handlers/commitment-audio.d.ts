import { Context } from "hono";
/**
 * Generate commitment audio
 *
 * ENDPOINT: POST /voice/commitment
 *
 * INPUT:
 * {
 *   "voiceId": "cartesia-voice-id",
 *   "text": "I commit to..."
 * }
 *
 * OUTPUT:
 * {
 *   "success": true,
 *   "audioUrl": "https://..."
 * }
 */
export declare const postCommitmentAudio: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    audioUrl: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
