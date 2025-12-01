/**
 * Conversion Onboarding Completion Handler - Super MVP
 *
 * PURPOSE: Handle the new 42-step conversion-focused onboarding flow
 *
 * FLOW:
 * 1. User completes 42-step onboarding in iOS app
 * 2. User pays via RevenueCat
 * 3. User signs up via Supabase (Google/Apple)
 * 4. iOS calls this endpoint to upload onboarding data
 * 5. Backend uploads 3 voice recordings to R2
 * 6. Backend creates identity record (core fields + voice URLs + JSONB context)
 * 7. Trigger automatically creates identity_status record
 * 8. User marked as onboarding_completed
 *
 * DATA STRUCTURE:
 * - Core Fields (explicit columns): name, daily_commitment, chosen_path, call_time, strike_limit
 * - Voice URLs: why_it_matters_audio_url, cost_of_quitting_audio_url, commitment_audio_url
 * - Context (JSONB): goal, motivation_level, attempt_history, favorite_excuse,
 *   who_disappointed, quit_pattern, future_if_no_change, witness, permissions, etc.
 */
import { Context } from "hono";
/**
 * Complete conversion onboarding and finalize user setup
 *
 * ENDPOINT: POST /onboarding/conversion/complete
 *
 * REQUEST BODY:
 * {
 *   "goal": "Get fit and lose 20 pounds",
 *   "goalDeadline": "2025-06-01T00:00:00.000Z",
 *   "motivationLevel": 8,
 *   "whyItMattersAudio": "data:audio/m4a;base64,...",
 *
 *   "attemptCount": 3,
 *   "lastAttemptOutcome": "Gave up after 2 weeks",
 *   "previousAttemptOutcome": "Stopped after injury",
 *   "favoriteExcuse": "Too busy with work",
 *   "whoDisappointed": "My kids and myself",
 *   "quitTime": "2024-10-15T00:00:00.000Z",
 *
 *   "costOfQuittingAudio": "data:audio/m4a;base64,...",
 *   "futureIfNoChange": "Overweight, unhappy, watching life pass by",
 *
 *   "dailyCommitment": "30 min gym session",
 *   "callTime": "2024-01-01T20:30:00.000Z",
 *   "strikeLimit": 3,
 *   "commitmentAudio": "data:audio/m4a;base64,...",
 *   "witness": "My spouse",
 *
 *   "willDoThis": true,
 *   "chosenPath": "hopeful",
 *
 *   "notificationsGranted": true,
 *   "callsGranted": true,
 *
 *   "completedAt": "2025-01-15T10:30:00.000Z",
 *   "totalTimeSpent": 1200,
 *
 *   "pushToken": "apns-device-token-here",  // OPTIONAL
 *   "deviceMetadata": {                      // OPTIONAL
 *     "type": "apns",
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
 *   "message": "Conversion onboarding completed successfully",
 *   "completedAt": "2025-01-15T10:30:00.000Z",
 *   "voiceUploads": {
 *     "whyItMatters": "https://audio.yourbigbruhh.app/audio/...",
 *     "costOfQuitting": "https://audio.yourbigbruhh.app/audio/...",
 *     "commitment": "https://audio.yourbigbruhh.app/audio/..."
 *   }
 * }
 */
export declare const postConversionOnboardingComplete: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    completedAt: string;
    voiceUploads: {
        whyItMatters?: string | undefined;
        costOfQuitting?: string | undefined;
        commitment?: string | undefined;
    };
    identity: {
        created: true;
        core_fields: string[];
        voice_urls: number;
        context_fields: number;
    };
    identityStatusCreated: true;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
