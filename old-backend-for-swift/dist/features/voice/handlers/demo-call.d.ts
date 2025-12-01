import { Context } from "hono";
/**
 * Generate a personalized demo call
 *
 * ENDPOINT: POST /voice/demo
 *
 * INPUT:
 * {
 *   "voiceId": "cartesia-voice-id",
 *   "userName": "John",
 *   "goal": "Lose 10 lbs",
 *   "motivationLevel": 8
 * }
 *
 * OUTPUT:
 * {
 *   "success": true,
 *   "audioUrl": "https://...",
 *   "transcript": "..."
 * }
 */
export declare const postDemoCall: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    audioUrl: string;
    transcript: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
