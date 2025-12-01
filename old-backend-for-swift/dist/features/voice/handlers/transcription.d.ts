/**
 * Transcription Routes - Frontend Audio Transcription Service
 *
 * PURPOSE: Provide transcription service for frontend during onboarding
 * APPROACH: Move transcription from identity extraction to onboarding phase
 *
 * FLOW:
 * 1. Frontend records audio during onboarding
 * 2. Frontend sends audio to this endpoint
 * 3. Backend transcribes using Deepgram API
 * 4. Frontend stores transcription in onboarding data
 * 5. Backend identity extraction uses stored transcription
 */
import { Context } from "hono";
/**
 * Transcribe audio file using Deepgram API
 *
 * ENDPOINT: POST /transcribe/audio
 *
 * PURPOSE: Transcribe audio during onboarding before upload to R2
 *
 * REQUEST: multipart/form-data with audio file
 * RESPONSE: { success: boolean, transcript: string, confidence?: number }
 */
export declare const postTranscribeAudio: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    transcript: string;
    confidence: number;
    duration: number;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
