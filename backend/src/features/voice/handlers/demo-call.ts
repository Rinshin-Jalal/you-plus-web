import { Context } from "hono";
import { Env } from "@/index";
import { uploadAudioToR2 } from "@/features/voice/services/r2-upload";

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
export const postDemoCall = async (c: Context) => {
    const body = await c.req.json();
    const { voiceId, userName, goal, motivationLevel } = body;

    if (!voiceId || !userName || !goal) {
        return c.json({ error: "Missing required fields" }, 400);
    }

    const env = c.env as Env;
    const userId = c.get("userId") as string;

    try {
        console.log(`🎬 Generating demo call for ${userName} (${userId})`);

        // 1. Generate Script with OpenAI
        const systemPrompt = `You are the user's Future Self - a version of them who has achieved their goal. You're calling them for their first accountability check-in.
    
    Your tone is:
    - Direct and no-nonsense
    - Uses "I" (you're their future self)
    - Short, punchy sentences
    - Confrontational but supportive
    - References their specific goal
    
    Keep the message under 100 words and make it feel like a real phone call opening.`;

        const userPrompt = `Generate a 60-90 second accountability call opening for:
    - Name: ${userName}
    - Goal: ${goal}
    - Motivation Level: ${motivationLevel}/10
    
    Start with something like "Hey, it's me - you from the future" and reference their specific goal. Make it personal and confrontational.`;

        const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 200,
                temperature: 0.8
            })
        });

        if (!openAIResponse.ok) {
            const error = await openAIResponse.text();
            throw new Error(`OpenAI error: ${error}`);
        }

        const openAIData = await openAIResponse.json();
        const transcript = openAIData.choices[0]?.message?.content?.trim();

        if (!transcript) {
            throw new Error("Failed to generate transcript");
        }

        console.log(`📝 Generated transcript: ${transcript.substring(0, 50)}...`);

        // 2. Generate Audio with Cartesia
        const cartesiaResponse = await fetch("https://api.cartesia.ai/tts/bytes", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
                "Cartesia-Version": "2024-06-10",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model_id: "sonic-3",
                transcript: transcript,
                voice: {
                    mode: "id",
                    id: voiceId
                },
                language: "en",
                generation_config: {
                    volume: 1.0,
                    speed: 1.0,
                    emotion: ["determined", "confident"] // Added emotion based on prompt
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

        // 3. Upload to R2
        const fileName = `${userId}_demo_call_${Date.now()}.wav`;
        const uploadResult = await uploadAudioToR2(
            env,
            audioBuffer,
            fileName,
            "audio/wav"
        );

        if (!uploadResult.success || !uploadResult.cloudUrl) {
            throw new Error(`R2 upload failed: ${uploadResult.error}`);
        }

        console.log(`✅ Demo call generated and uploaded: ${uploadResult.cloudUrl}`);

        return c.json({
            success: true,
            audioUrl: uploadResult.cloudUrl,
            transcript: transcript
        });

    } catch (error) {
        console.error("Demo call generation failed:", error);
        return c.json({
            error: "Demo call generation failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
};
