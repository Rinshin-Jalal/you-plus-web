/**
 * Cartesia Audio Services
 * 
 * Provides:
 * - Speech-to-Text (STT) transcription via Cartesia Ink
 * - Voice cloning for Future Self agent
 * - Audio upload to Cloudflare R2
 * 
 * https://docs.cartesia.ai/api-reference/stt/transcribe
 * https://docs.cartesia.ai/api-reference/voices/clone
 */

import { Env } from "@/types/environment";

// R2Bucket type from Cloudflare Workers
// We use a minimal interface to avoid dependency on @cloudflare/workers-types
interface R2BucketBinding {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: {
    httpMetadata?: { contentType?: string };
    customMetadata?: Record<string, string>;
  }): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Convert base64 audio to Blob
// ═══════════════════════════════════════════════════════════════════════════

interface AudioBlobResult {
  blob: Blob;
  mimeType: string;
  extension: string;
  bytes: Uint8Array;
}

function base64ToAudioBlob(audioBase64: string): AudioBlobResult {
  // Strip data URI prefix if present (e.g., "data:audio/webm;base64,")
  let cleanBase64 = audioBase64;
  let mimeType = "audio/webm";
  
  if (audioBase64.startsWith("data:")) {
    const match = audioBase64.match(/data:([^;]+);/);
    if (match && match[1]) {
      mimeType = match[1];
    }
  }
  
  if (audioBase64.includes(",")) {
    const parts = audioBase64.split(",");
    cleanBase64 = parts[1] ?? audioBase64;
  }

  // Convert base64 to binary
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Determine file extension from mime type
  const extensionMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
    "audio/m4a": "m4a",
    "audio/mp4": "mp4",
  };
  const extension = extensionMap[mimeType] || "webm";

  // Create Blob
  const blob = new Blob([bytes], { type: mimeType });

  return { blob, mimeType, extension, bytes };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSCRIPTION (Cartesia Ink STT)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transcribe audio using Cartesia Ink STT (Batch API)
 * 
 * Uses multipart/form-data as per Cartesia docs:
 * POST https://api.cartesia.ai/stt
 * 
 * @param audioBase64 - Base64 encoded audio data (with or without data URI prefix)
 * @param env - Environment variables containing CARTESIA_API_KEY
 * @returns Transcription result with text or error
 */
export async function transcribeAudio(
  audioBase64: string,
  env: Env
): Promise<TranscriptionResult> {
  console.log("🎤 Starting Cartesia Ink transcription...");

  try {
    const { blob, mimeType, extension } = base64ToAudioBlob(audioBase64);
    console.log(`📦 Audio size: ${blob.size} bytes, type: ${mimeType}`);

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append("file", blob, `recording.${extension}`);
    formData.append("model", "ink-whisper");
    formData.append("language", "en");

    // Call Cartesia Ink API
    const response = await fetch("https://api.cartesia.ai/stt", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cartesia STT error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Transcription failed: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json() as { text?: string; language?: string; duration?: number };
    const transcribedText = result.text || "";

    console.log(`✅ Transcription complete (${result.duration?.toFixed(1)}s): "${transcribedText.substring(0, 100)}..."`);

    return {
      success: true,
      text: transcribedText,
    };
  } catch (error) {
    console.error("❌ Transcription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown transcription error",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VOICE CLONING (Cartesia Voices API)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clone a user's voice using Cartesia Voice Cloning API
 * 
 * Creates a high-similarity voice clone from a single audio clip.
 * Cartesia recommends ~5 seconds of audio for best results.
 * 
 * The audio is typically a merged WAV file created client-side using Web Audio API.
 * This ensures Cartesia receives a valid audio file (not concatenated bytes).
 * 
 * POST https://api.cartesia.ai/voices/clone
 * 
 * @param audioSources - Array of base64 encoded audio data (uses largest if multiple)
 * @param userId - User ID for naming the voice
 * @param userName - User's name for the voice description
 * @param env - Environment variables containing CARTESIA_API_KEY
 * @returns Voice clone result with voiceId or error
 */
export async function cloneVoice(
  audioSources: string[],
  userId: string,
  userName: string,
  env: Env
): Promise<VoiceCloneResult> {
  console.log("🎭 Starting Cartesia voice cloning...");
  console.log(`📊 Received ${audioSources.length} audio sources`);

  try {
    // Filter out empty sources
    const validSources = audioSources.filter(s => s && s.length > 0);
    
    if (validSources.length === 0) {
      return {
        success: false,
        error: "No valid audio sources provided for voice cloning",
      };
    }

    // Select the largest/best recording for cloning
    // (Cartesia needs a single valid audio file, not concatenated bytes)
    let bestSource = validSources[0]!;
    let bestSize = 0;
    
    for (let i = 0; i < validSources.length; i++) {
      const source = validSources[i]!;
      const { bytes } = base64ToAudioBlob(source);
      console.log(`   Source ${i + 1}: ${bytes.length} bytes`);
      if (bytes.length > bestSize) {
        bestSize = bytes.length;
        bestSource = source;
      }
    }
    
    const { blob, mimeType } = base64ToAudioBlob(bestSource);
    console.log(`📦 Selected best audio for cloning: ${blob.size} bytes, type: ${mimeType}`);

    // Validate audio size - Cartesia recommends at least 5 seconds
    // Rough estimate: 5 seconds of webm audio is typically 40-80KB
    if (blob.size < 10000) {
      console.warn("⚠️ Audio may be too short for quality voice cloning");
    }

    // Determine extension from mime type
    const extensionMap: Record<string, string> = {
      "audio/webm": "webm",
      "audio/mp3": "mp3",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
    };
    const extension = extensionMap[mimeType] || "webm";

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append("clip", blob, `voice_sample_combined.${extension}`);
    formData.append("name", `${userName || "User"} - Future Self`);
    formData.append("description", `Voice clone for You+ Future Self agent. User ID: ${userId.slice(0, 8)}. Combined from ${validSources.length} recordings.`);
    formData.append("language", "en");

    // Call Cartesia Voice Clone API
    // API docs: https://docs.cartesia.ai/api-reference/voices/clone
    const response = await fetch("https://api.cartesia.ai/voices/clone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CARTESIA_API_KEY}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Cartesia voice clone error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Voice cloning failed: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json() as {
      id: string;
      name: string;
      user_id: string;
      is_public: boolean;
      created_at: string;
      language: string;
    };

    console.log(`✅ Voice cloned successfully!`);
    console.log(`   Voice ID: ${result.id}`);
    console.log(`   Name: ${result.name}`);
    console.log(`   Created: ${result.created_at}`);
    console.log(`   Sources combined: ${validSources.length}`);

    return {
      success: true,
      voiceId: result.id,
    };
  } catch (error) {
    console.error("❌ Voice cloning error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown voice cloning error",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// R2 UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Upload audio to Cloudflare R2 and return the URL
 * 
 * @param audioBase64 - Base64 encoded audio data
 * @param userId - User ID for file path
 * @param recordingType - Type of recording (e.g., "why", "pledge", "dark_future")
 * @param bucket - R2 bucket binding
 * @param env - Environment variables
 * @returns URL of the uploaded audio or null on failure
 */
export async function uploadAudioToR2(
  audioBase64: string,
  userId: string,
  recordingType: string,
  bucket: R2BucketBinding,
  env: Env
): Promise<string | null> {
  console.log(`📤 Uploading ${recordingType} recording to R2...`);

  try {
    const { blob, mimeType, extension } = base64ToAudioBlob(audioBase64);
    
    // Convert blob to Uint8Array for R2
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Generate file path
    const timestamp = Date.now();
    const key = `recordings/${userId}/${recordingType}_${timestamp}.${extension}`;

    // Upload to R2
    await bucket.put(key, bytes, {
      httpMetadata: {
        contentType: mimeType,
      },
      customMetadata: {
        userId,
        recordingType,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Construct the public URL
    const backendUrl = env.BACKEND_URL || "https://api.youplus.app";
    const audioUrl = `${backendUrl}/audio/${key}`;

    console.log(`✅ Audio uploaded to R2: ${audioUrl}`);
    return audioUrl;
  } catch (error) {
    console.error("❌ R2 upload error:", error);
    return null;
  }
}


