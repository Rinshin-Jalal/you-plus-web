import { uploadAudioToR2 } from "@/features/voice/services/r2-upload";
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
export const postCommitmentAudio = async (c) => {
    const body = await c.req.json();
    const { voiceId, text } = body;
    if (!voiceId || !text) {
        return c.json({ error: "Missing required fields" }, 400);
    }
    const env = c.env;
    const userId = c.get("userId");
    try {
        console.log(`🎙️ Generating commitment audio for ${userId}`);
        // 1. Generate Audio with Cartesia
        const cartesiaResponse = await fetch("https://api.cartesia.ai/tts/bytes", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
                "Cartesia-Version": "2024-06-10",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model_id: "sonic-3",
                transcript: text,
                voice: {
                    mode: "id",
                    id: voiceId
                },
                language: "en",
                generation_config: {
                    volume: 1.0,
                    speed: 0.9, // Slightly slower for commitment
                    emotion: ["serious", "determined"]
                },
                output_format: {
                    container: "wav",
                    encoding: "pcm_s16le",
                    sample_rate: 44100
                }
            })
        });
        if (!cartesiaResponse.ok) {
            const error = await cartesiaResponse.text();
            throw new Error(`Cartesia TTS error: ${error}`);
        }
        const audioBuffer = await cartesiaResponse.arrayBuffer();
        // 2. Upload to R2
        const fileName = `${userId}_commitment_${Date.now()}.wav`;
        const uploadResult = await uploadAudioToR2(env, audioBuffer, fileName, "audio/wav");
        if (!uploadResult.success || !uploadResult.cloudUrl) {
            throw new Error(`R2 upload failed: ${uploadResult.error}`);
        }
        console.log(`✅ Commitment audio generated and uploaded: ${uploadResult.cloudUrl}`);
        return c.json({
            success: true,
            audioUrl: uploadResult.cloudUrl
        });
    }
    catch (error) {
        console.error("Commitment audio generation failed:", error);
        return c.json({
            error: "Commitment audio generation failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
};
