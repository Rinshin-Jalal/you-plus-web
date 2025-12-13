/**
 * Cartesia API integration for transcription and voice cloning
 */

import { logger } from "@trigger.dev/sdk/v3";
import { getEnvVar, base64ToBuffer } from "./utils";
import type { TranscriptionResult, VoiceCloneResult } from "./types";

export async function transcribeAudio(audioBase64: string): Promise<TranscriptionResult> {
  logger.info("🎤 Starting Cartesia Ink transcription...");
  
  try {
    const { buffer, mimeType, extension } = base64ToBuffer(audioBase64);
    logger.info(`📦 Audio size: ${buffer.length} bytes, type: ${mimeType}`);
    
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    
    const formData = new FormData();
    formData.append("file", blob, `recording.${extension}`);
    formData.append("model", "ink-whisper");
    formData.append("language", "en");
    
    const response = await fetch("https://api.cartesia.ai/stt", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getEnvVar("CARTESIA_API_KEY")}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ Cartesia STT error: ${response.status} - ${errorText}`);
      return { success: false, error: `Transcription failed: ${response.status}` };
    }
    
    const result = await response.json() as { text?: string; duration?: number };
    logger.info(`✅ Transcription complete: "${result.text?.substring(0, 100)}..."`);
    
    return { success: true, text: result.text || "" };
  } catch (error) {
    logger.error("❌ Transcription error:", { error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function cloneVoice(
  audioBase64: string,
  userId: string,
  userName: string
): Promise<VoiceCloneResult> {
  logger.info("🎭 Starting Cartesia voice cloning...");
  
  try {
    const { buffer, mimeType, extension } = base64ToBuffer(audioBase64);
    logger.info(`📦 Audio for cloning: ${buffer.length} bytes`);
    
    if (buffer.length < 10000) {
      logger.warn("⚠️ Audio may be too short for quality voice cloning");
    }
    
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    
    const formData = new FormData();
    formData.append("clip", blob, `voice_sample.${extension}`);
    formData.append("name", `${userName || "User"} - Future Self`);
    formData.append("description", `Voice clone for You+ Future Self. User: ${userId.slice(0, 8)}`);
    formData.append("language", "en");
    
    const response = await fetch("https://api.cartesia.ai/voices/clone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getEnvVar("CARTESIA_API_KEY")}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ Voice clone error: ${response.status} - ${errorText}`);
      return { success: false, error: `Voice cloning failed: ${response.status}` };
    }
    
    const result = await response.json() as { id: string; name: string };
    logger.info(`✅ Voice cloned! ID: ${result.id}`);
    
    return { success: true, voiceId: result.id };
  } catch (error) {
    logger.error("❌ Voice cloning error:", { error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
