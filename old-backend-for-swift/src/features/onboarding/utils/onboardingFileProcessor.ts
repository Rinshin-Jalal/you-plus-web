/**
 * Onboarding File Processor - Handles file uploads during onboarding completion
 * Processes base64 data from frontend and uploads to R2 storage
 */

import { Env } from "@/index";
import { uploadAudioToR2, generateAudioFileName } from "@/features/voice/services/r2-upload";

/**
 * Transcribe audio using Deepgram API
 * @param env - Environment with Deepgram API key
 * @param audioBuffer - Audio data as ArrayBuffer
 * @returns Promise with transcribed text
 */
async function transcribeAudioWithDeepgram(
  env: Env,
  audioBuffer: ArrayBuffer
): Promise<string> {
  try {
    console.log("🎤 Starting Deepgram transcription...");

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/wav",
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Deepgram API error ${response.status}:`, errorText);
      throw new Error(
        `Deepgram transcription failed: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    const transcript =
      result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcript.trim()) {
      console.warn("Deepgram returned empty transcript");
      return "";
    }

    console.log(
      `✅ Transcription successful: "${transcript.substring(0, 100)}..."`
    );
    return transcript;
  } catch (error) {
    console.error("❌ Transcription error:", error);
    // Return empty string instead of throwing - allows processing to continue
    return "";
  }
}

export interface FileProcessingResult {
  success: boolean;
  processedResponses?: Record<string, any>;
  error?: string;
  uploadedFiles?: string[];
}

/**
 * Extract base64 data from data URL
 * @param dataUrl - Data URL (data:mime/type;base64,...)
 * @returns Object with mimeType and base64 data
 */
function parseDataUrl(
  dataUrl: string
): { mimeType: string; base64: string } | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    return null;
  }

  const [header, base64] = dataUrl.split(",");
  if (!header || !base64) {
    return null;
  }

  const mimeMatch = header.match(/data:([^;]+)/);
  if (!mimeMatch) {
    return null;
  }

  return {
    mimeType: mimeMatch[1] || "",
    base64: base64,
  };
}

/**
 * Generate unique filename for uploaded files
 * @param stepId - Onboarding step ID
 * @param fileType - Type of file (audio/image)
 * @param extension - File extension
 * @returns Unique filename
 */
function generateFileName(
  stepId: number,
  fileType: "audio" | "image",
  extension: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `onboarding-${fileType}-step-${stepId}-${timestamp}-${randomId}.${extension}`;
}

/**
 * Process audio response and upload to R2
 * @param env - Cloudflare environment
 * @param userId - User ID for file path
 * @param stepId - Step ID
 * @param response - Response object with base64 audio data
 * @returns Promise with processed response containing cloud URL
 */
async function processAudioResponse(
  env: Env,
  userId: string,
  stepId: number,
  response: any
): Promise<{ success: boolean; response?: any; error?: string }> {
  try {
    console.log(`🎙️ Processing audio for step ${stepId}`);
    console.log(`  - Response value type: ${typeof response.value}`);
    console.log(`  - Response value preview: ${typeof response.value === 'string' ? response.value.substring(0, 100) : 'NOT A STRING'}`);

    if (!response.value || typeof response.value !== "string") {
      console.error(`❌ Invalid audio response format for step ${stepId}`);
      return { success: false, error: "Invalid audio response format" };
    }

    // Check if it's a base64 data URL
    if (!response.value.startsWith("data:audio/")) {
      // Already processed or not base64 data
      console.log(`⏭️ Skipping step ${stepId} - not a data URL (starts with: ${response.value.substring(0, 20)})`);
      return { success: true, response };
    }

    // Parse data URL
    const parsed = parseDataUrl(response.value);
    if (!parsed) {
      return { success: false, error: "Invalid audio data URL format" };
    }

    // Convert base64 to ArrayBuffer
    const binaryString = atob(parsed.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBuffer = bytes.buffer;

    // REVOLUTIONARY CHANGE: Transcribe audio BEFORE uploading
    console.log(`🎤 Transcribing audio for step ${stepId} before upload...`);
    const transcription = await transcribeAudioWithDeepgram(env, audioBuffer);

    if (!transcription.trim()) {
      console.warn(
        `⚠️ Transcription failed for step ${stepId} - proceeding with upload anyway`
      );
    }

    // Generate user-based filename and upload to R2
    const recordingId = `step_${stepId}`;
    const fileName = generateAudioFileName(userId, recordingId, "m4a");
    const uploadResult = await uploadAudioToR2(
      env,
      audioBuffer,
      fileName,
      parsed.mimeType
    );

    if (!uploadResult.success || !uploadResult.cloudUrl) {
      return {
        success: false,
        error: `Audio upload failed: ${uploadResult.error}`,
      };
    }

    // NEW FORMAT: Store transcription in value, cloud URL in voiceUri
    const processedResponse = {
      ...response,
      value: transcription || "Transcription failed", // Store transcribed text, not cloud URL
      voiceUri: uploadResult.cloudUrl, // Store cloud URL in voiceUri field
      originalValue: "base64_data_transcribed_and_uploaded", // Track what was done
    };

    console.log(
      `✅ Audio transcribed and uploaded: "${transcription?.substring(
        0,
        50
      )}..." → ${uploadResult.cloudUrl}`
    );

    return { success: true, response: processedResponse };
  } catch (error: any) {
    console.error(`💥 Audio processing error for step ${stepId}:`, error);
    return {
      success: false,
      error: `Audio processing failed: ${error.message}`,
    };
  }
}

/**
 * Process all onboarding responses and upload files to R2
 * @param env - Cloudflare environment
 * @param responses - All onboarding responses
 * @param userId - User ID for organizing files
 * @returns Promise with processing result
 */
export async function processOnboardingFiles(
  env: Env,
  responses: Record<string, any>,
  userId: string
): Promise<FileProcessingResult> {
  try {
    console.log("🔄 Starting onboarding file processing...");

    const processedResponses: Record<string, any> = {};
    const uploadedFiles: string[] = [];
    const errors: string[] = [];

    // Process each response
    for (const [stepId, response] of Object.entries(responses)) {
      console.log(`Processing step ${stepId}, type: ${response.type}`);

      if (response.type === "voice") {
        // Process voice recording
        const result = await processAudioResponse(
          env,
          userId,
          parseInt(stepId),
          response
        );

        if (result.success && result.response) {
          processedResponses[stepId] = result.response;
          if (result.response.value !== response.value) {
            uploadedFiles.push(`Step ${stepId}: Audio uploaded`);
          }
        } else {
          errors.push(`Step ${stepId}: ${result.error}`);
          // Keep original response if processing failed
          processedResponses[stepId] = response;
        }
      } else {
        // Non-file response, keep as-is
        processedResponses[stepId] = response;
      }
    }

    // Log results
    console.log(`✅ File processing complete:`);
    console.log(
      `- Processed responses: ${Object.keys(processedResponses).length}`
    );
    console.log(`- Uploaded files: ${uploadedFiles.length}`);
    console.log(`- Errors: ${errors.length}`);

    if (uploadedFiles.length > 0) {
      console.log("📁 Uploaded files:", uploadedFiles);
    }

    if (errors.length > 0) {
      console.warn("⚠️ Processing errors:", errors);
    }

    return {
      success: true,
      processedResponses,
      uploadedFiles,
      error: errors.length > 0 ? errors.join("; ") : "",
    };
  } catch (error: any) {
    console.error("💥 Critical error during file processing:", error);
    return {
      success: false,
      error: `File processing failed: ${error.message}`,
    };
  }
}

/**
 * Validate file data before processing
 * @param dataUrl - Data URL to validate
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileData(
  dataUrl: string,
  maxSize: number = 10 * 1024 * 1024
): { valid: boolean; error?: string; size?: number } {
  try {
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      return { valid: false, error: "Invalid data URL format" };
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return { valid: false, error: "Failed to parse data URL" };
    }

    // Estimate file size (base64 is ~133% of original size)
    const estimatedSize = Math.round(parsed.base64.length * 0.75);

    if (estimatedSize > maxSize) {
      return {
        valid: false,
        error: `File too large: ${Math.round(
          estimatedSize / 1024 / 1024
        )}MB (max ${Math.round(maxSize / 1024 / 1024)}MB)`,
        size: estimatedSize,
      };
    }

    return { valid: true, size: estimatedSize };
  } catch (error: any) {
    return { valid: false, error: `Validation error: ${error.message}` };
  }
}
