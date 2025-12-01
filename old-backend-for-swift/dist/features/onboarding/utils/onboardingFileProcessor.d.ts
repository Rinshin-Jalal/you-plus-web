/**
 * Onboarding File Processor - Handles file uploads during onboarding completion
 * Processes base64 data from frontend and uploads to R2 storage
 */
import { Env } from "@/index";
export interface FileProcessingResult {
    success: boolean;
    processedResponses?: Record<string, any>;
    error?: string;
    uploadedFiles?: string[];
}
/**
 * Process all onboarding responses and upload files to R2
 * @param env - Cloudflare environment
 * @param responses - All onboarding responses
 * @param userId - User ID for organizing files
 * @returns Promise with processing result
 */
export declare function processOnboardingFiles(env: Env, responses: Record<string, any>, userId: string): Promise<FileProcessingResult>;
/**
 * Validate file data before processing
 * @param dataUrl - Data URL to validate
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export declare function validateFileData(dataUrl: string, maxSize?: number): {
    valid: boolean;
    error?: string;
    size?: number;
};
