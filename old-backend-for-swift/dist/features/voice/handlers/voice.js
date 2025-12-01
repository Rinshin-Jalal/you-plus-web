import { updateUserVoiceId } from "@/features/core/utils/database";
import { createVoiceCloneService } from "@/features/voice/services/voice-cloning";
// Voice cloning endpoint (Supports ElevenLabs & Cartesia)
export const postVoiceClone = async (c) => {
    const formData = await c.req.formData();
    const audioFiles = formData.getAll("audio");
    const userId = c.get("userId"); // Set by requireGuestOrUser
    const voiceName = formData.get("voiceName") || `voice_${userId}`;
    const provider = formData.get("provider") || "cartesia";
    if (audioFiles.length === 0) {
        return c.json({ error: "Missing audio files" }, 400);
    }
    const env = c.env;
    try {
        console.log(`🎤 Cloning voice for ${userId} using ${provider}`);
        // 1. Combine audio files if multiple
        // Swift client sends "clip" which is already combined.
        // Check for "clip" field (Cartesia style) or "audio" (our internal style)
        const audioFile = formData.get("clip") || audioFiles[0];
        if (!audioFile) {
            return c.json({ error: "No audio file found" }, 400);
        }
        // Upload to R2 to get a URL for the voice cloning service
        const audioBuffer = await audioFile.arrayBuffer();
        const { uploadAudioToR2 } = await import("@/features/voice/services/r2-upload");
        const fileName = `${userId}_clone_source_${Date.now()}.m4a`;
        const uploadResult = await uploadAudioToR2(env, audioBuffer, fileName, "audio/m4a");
        if (!uploadResult.success || !uploadResult.cloudUrl) {
            throw new Error("Failed to upload source audio to R2");
        }
        // 2. Call VoiceCloneService
        const voiceService = createVoiceCloneService(env);
        const result = await voiceService.cloneUserVoice({
            audio_url: uploadResult.cloudUrl,
            voice_name: voiceName,
            user_id: userId,
            provider: provider
        });
        if (!result.success) {
            return c.json({ error: result.error || "Cloning failed" }, 500);
        }
        // 3. Update User Record (if not guest)
        if (!userId.startsWith("guest_")) {
            await updateUserVoiceId(env, userId, result.voice_id);
        }
        return c.json({
            success: true,
            voice_id: result.voice_id,
            provider: provider
        });
    }
    catch (error) {
        console.error("Voice cloning endpoint error:", error);
        return c.json({
            error: "Voice cloning failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
// Voice analysis endpoint - Analyze user's path from first voice recording
export const postOnboardingAnalyzeVoice = async (c) => {
    const formData = await c.req.formData();
    const audioFile = formData.get("audio");
    const sessionId = formData.get("sessionId");
    const stepNumber = formData.get("stepNumber");
    if (!audioFile || !sessionId) {
        return c.json({ error: "Missing audio file or sessionId" }, 400);
    }
    // Use sessionId as temporary identifier for pre-auth onboarding
    // Note: Migration to actual user ID happens during account creation
    const userId = sessionId;
    const env = c.env;
    try {
        // Convert audio file to buffer for Deepgram
        const audioBuffer = await audioFile.arrayBuffer();
        // Transcribe audio using Deepgram
        const transcript = await transcribeAudio(audioBuffer, env.DEEPGRAM_API_KEY || "");
        return c.json({ transcript });
    }
    catch (error) {
        console.error("Voice analysis error:", error);
        return c.json({
            error: "Voice analysis failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
// Helper function to transcribe audio using Deepgram
async function transcribeAudio(audioBuffer, apiKey) {
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true", {
        method: "POST",
        headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "audio/wav",
        },
        body: audioBuffer,
    });
    if (!response.ok) {
        throw new Error(`Deepgram transcription failed: ${response.status}`);
    }
    const result = await response.json();
    return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
}
