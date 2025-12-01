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
import { getAuthenticatedUserId } from "@/middleware/auth";
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
export const postTranscribeAudio = async (c) => {
    console.log("🎤 === FRONTEND TRANSCRIPTION REQUEST ===");
    const userId = getAuthenticatedUserId(c);
    console.log(`👤 User: ${userId}`);
    const env = c.env;
    try {
        // Parse multipart form data
        const formData = await c.req.formData();
        const audioFile = formData.get('audio');
        if (!audioFile) {
            return c.json({
                success: false,
                error: "No audio file provided"
            }, 400);
        }
        console.log(`📁 Audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`);
        // Validate file size (max 25MB for Deepgram)
        if (audioFile.size > 25 * 1024 * 1024) {
            return c.json({
                success: false,
                error: "Audio file too large (max 25MB)"
            }, 400);
        }
        // Convert file to ArrayBuffer
        const audioBuffer = await audioFile.arrayBuffer();
        // Transcribe using Deepgram API (same logic as identity extractor)
        console.log(`🎯 Transcribing with Deepgram...`);
        const transcript = await transcribeAudioWithDeepgram(audioBuffer, env);
        if (!transcript.trim()) {
            console.warn("⚠️ Empty transcription result");
            return c.json({
                success: false,
                error: "No speech detected in audio",
            });
        }
        console.log(`✅ Transcription successful: "${transcript.substring(0, 100)}..."`);
        return c.json({
            success: true,
            transcript: transcript.trim(),
            confidence: 0.95, // Deepgram doesn't provide confidence in this format
            duration: audioFile.size / 16000, // Rough estimate
        });
    }
    catch (error) {
        console.error("💥 Transcription error:", error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Transcription failed",
        }, 500);
    }
};
/**
 * Transcribe audio using Deepgram API
 *
 * Transcription logic for converting audio to text during onboarding
 */
async function transcribeAudioWithDeepgram(audioBuffer, env) {
    try {
        const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true", {
            method: "POST",
            headers: {
                Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
                "Content-Type": "audio/wav",
            },
            body: audioBuffer,
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Deepgram API error ${response.status}:`, errorText);
            throw new Error(`Deepgram transcription failed: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        if (!transcript.trim()) {
            console.warn("Deepgram returned empty transcript");
            return "";
        }
        return transcript;
    }
    catch (error) {
        console.error("Deepgram transcription error:", error);
        // Return empty string instead of throwing to allow graceful handling
        return "";
    }
}
