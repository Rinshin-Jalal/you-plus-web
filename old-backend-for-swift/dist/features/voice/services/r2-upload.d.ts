import { Env } from "@/index";
export interface UploadResult {
    success: boolean;
    cloudUrl?: string;
    error?: string;
}
export interface AudioUploadResult extends UploadResult {
}
/**
 * Upload audio file to Cloudflare R2 storage
 * @param env - Cloudflare environment with R2 bucket binding
 * @param audioBuffer - Audio file data as ArrayBuffer
 * @param fileName - Unique filename for the upload
 * @param contentType - MIME type of the audio file
 * @returns Promise with upload result
 */
export declare function uploadAudioToR2(env: Env, audioBuffer: ArrayBuffer, fileName: string, contentType?: string): Promise<AudioUploadResult>;
/**
 * Generate unique filename for audio upload
 * @param userId - User ID
 * @param recordingId - Recording identifier
 * @param extension - File extension (default: m4a)
 * @returns Unique filename
 */
export declare function generateAudioFileName(userId: string, recordingId: string, extension?: string): string;
/**
 * Extract file extension from local URI
 * @param uri - Local file URI
 * @returns File extension
 */
export declare function extractFileExtension(uri: string): string;
