/**
 * Onboarding Routes - Complete V3 Onboarding System
 *
 * PURPOSE: Handle complete onboarding flow from anonymous user to authenticated user
 *
 * FLOW OVERVIEW:
 * 1. ANONYMOUS PHASE: User completes 60-step onboarding (data stored with sessionId)
 * 2. PAYMENT PHASE: User pays via RevenueCat
 * 3. AUTHENTICATION PHASE: User signs up via Supabase (Google/Apple)
 * 4. DATA MIGRATION: Frontend calls /onboarding/v3/complete to push data
 * 5. PROCESSING: Backend uploads files, extracts identity, clones voice
 * 6. COMPLETION: User is ready for daily calls
 *
 * KEY ENDPOINTS:
 * - POST /onboarding/v3/complete: Main completion endpoint (60 steps optimized)
 * - POST /onboarding/complete: Legacy endpoint (deprecated)
 * - POST /onboarding/migrate: Data migration from sessionId to userId
 * - POST /onboarding/extract-data: Re-extract data for existing users
 *
 * DATA PROCESSING:
 * - File uploads: Audio recordings and images uploaded to R2 cloud storage
 * - Voice cloning: Creates personalized voice using 11labs
 * - Identity extraction: Analyzes responses for psychological profile
 * - Psychological profiling: Generates insights for personalized calls
 */
import { Context } from "hono";
/**
 * Complete onboarding V3 flow and finalize user setup
 *
 * ENDPOINT: POST /onboarding/v3/complete
 *
 * PURPOSE: Main completion endpoint for 60-step V3 onboarding flow (optimized)
 *
 * PROCESS:
 * 1. Receives complete onboarding state from frontend
 * 2. Processes files (uploads audio/images to R2 cloud storage)
 * 3. Saves responses to onboarding table (JSONB format)
 * 4. Updates user record with completion status
 * 5. Triggers identity extraction and voice cloning
 *
 * REQUEST BODY:
 * {
 *   "state": {
 *     "currentStep": 60,
 *     "responses": { "step_1": {...}, "step_2": {...}, ... },
 *     "userName": "John",
 *     "brotherName": "Executor",
 *     "wakeUpTime": "07:00",
 *     "userPath": "BROKEN"
 *   },
 *   "pushToken": "apns-device-token-here",  // OPTIONAL: Push notification token
 *   "deviceMetadata": {                      // OPTIONAL: Device info for push notifications
 *     "type": "apns",                        // "apns" for iOS, "fcm" for Android
 *     "device_model": "iPhone 15 Pro",
 *     "os_version": "iOS 17.2",
 *     "app_version": "1.0.0",
 *     "locale": "en_US",
 *     "timezone": "America/New_York"
 *   }
 * }
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Onboarding completed successfully",
 *   "completedAt": "2024-01-15T10:30:00.000Z",
 *   "totalSteps": 60,
 *   "filesProcessed": 8,
 *   "processingWarnings": null
 * }
 */
export declare const postOnboardingV3Complete: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    completedAt: string;
    totalSteps: number;
    filesProcessed: number;
    processingWarnings: string | null;
    identityExtraction: {
        success: boolean;
        identity?: any;
        error?: string | undefined;
    };
    identityStatusSync: {
        success: boolean;
        data?: any;
        error?: string | undefined;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * Extract psychological profile and identity data from existing onboarding responses
 *
 * ENDPOINT: POST /onboarding/extract-data
 *
 * PURPOSE: Re-extract data for users who completed onboarding but need their
 * psychological profile and identity data extracted/re-extracted
 *
 * USAGE:
 * - For users who completed onboarding before identity extraction was implemented
 * - For debugging/testing identity extraction
 * - For users who want to refresh their psychological profile
 *
 * PROCESS:
 * 1. Retrieves existing onboarding responses from database
 * 2. Runs identity extraction (voice transcription, field extraction)
 * 3. Runs psychological profiling (insights, categories, assessment scores)
 * 4. Updates user record with extracted data
 *
 * RESPONSE:
 * {
 *   "success": true,
 *   "onboardingDataExtraction": {
 *     "voiceRecordings": 15,
 *     "images": 3,
 *     "coreInsights": [...],
 *     "voiceCategories": [...],
 *     "assessmentScores": {...},
 *     "hasProfile": true
 *   },
 *   "identityExtraction": {
 *     "success": true,
 *     "fieldsExtracted": 12,
 *     "voiceTranscribed": 15,
 *     "error": null
 *   }
 * }
 */
export declare const postExtractOnboardingData: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    v3Extraction: {
        success: boolean;
        error: string | undefined;
    };
    extractedAt: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
