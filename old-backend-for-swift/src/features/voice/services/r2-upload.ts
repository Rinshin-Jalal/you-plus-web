import { Env } from "@/index";

export interface UploadResult {
  success: boolean;
  cloudUrl?: string;
  error?: string;
}

// Legacy interface for backwards compatibility
export interface AudioUploadResult extends UploadResult {}

/**
 * Upload audio file to Cloudflare R2 storage
 * @param env - Cloudflare environment with R2 bucket binding
 * @param audioBuffer - Audio file data as ArrayBuffer
 * @param fileName - Unique filename for the upload
 * @param contentType - MIME type of the audio file
 * @returns Promise with upload result
 */
export async function uploadAudioToR2(
  env: Env,
  audioBuffer: ArrayBuffer,
  fileName: string,
  contentType: string = "audio/m4a"
): Promise<AudioUploadResult> {
  return uploadToR2(env, audioBuffer, fileName, contentType, "audio");
}

/**
 * Generic upload function for R2 storage
 * @param env - Cloudflare environment with R2 bucket binding
 * @param fileBuffer - File data as ArrayBuffer
 * @param fileName - Unique filename for the upload
 * @param contentType - MIME type of the file
 * @param folder - Folder prefix (audio, images, etc.)
 * @returns Promise with upload result
 */
async function uploadToR2(
  env: Env,
  fileBuffer: ArrayBuffer,
  fileName: string,
  contentType: string,
  folder: string
): Promise<UploadResult> {
  try {
    const fileType = folder === "audio" ? "🎵" : "🖼️";
    console.log(
      `${fileType} Uploading ${folder} file: ${fileName} (${fileBuffer.byteLength} bytes)`
    );

    // Check if R2 bucket binding exists
    if (!env.AUDIO_BUCKET) {
      console.error("❌ AUDIO_BUCKET binding is missing from env!");
      return {
        success: false,
        error: "R2 bucket binding not configured",
      };
    }

    // Upload to R2 bucket with folder prefix
    const fullPath = `${folder}/${fileName}`;
    console.log(`📤 Uploading to R2 path: ${fullPath}`);

    const putResult = await env.AUDIO_BUCKET.put(fullPath, fileBuffer, {
      httpMetadata: {
        contentType: contentType,
      },
    });

    // Verify upload succeeded
    if (!putResult) {
      throw new Error("R2 put() returned null - upload may have failed");
    }

    console.log(`✅ R2 put() completed, verifying upload...`);

    // Verify file exists in R2
    const headResult = await env.AUDIO_BUCKET.head(fullPath);
    if (!headResult) {
      throw new Error(`Upload verification failed - file not found at ${fullPath}`);
    }

    console.log(`✅ Upload verified! File size: ${headResult.size} bytes`);

    // TODO: REAL URL SHOULD BE SHOWN IN PROD
    // Generate public URL
    const cloudUrl = `https://audio.yourbigbruhh.app/${fullPath}`;

    console.log(`✅ ${folder} uploaded successfully: ${cloudUrl}`);

    return {
      success: true,
      cloudUrl: cloudUrl,
    };
  } catch (error) {
    console.error("💥 R2 upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Generate unique filename for audio upload
 * @param userId - User ID
 * @param recordingId - Recording identifier
 * @param extension - File extension (default: m4a)
 * @returns Unique filename
 */
export function generateAudioFileName(
  userId: string,
  recordingId: string,
  extension: string = "m4a"
): string {
  const timestamp = Date.now();
  return `${userId}/${recordingId}_${timestamp}.${extension}`;
}

/**
 * Extract file extension from local URI
 * @param uri - Local file URI
 * @returns File extension
 */
export function extractFileExtension(uri: string): string {
  const match = uri.match(/\.([^.]+)$/);
  return match?.[1] || "m4a"; // Default to m4a
}