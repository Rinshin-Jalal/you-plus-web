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
import { createSupabaseClient, upsertPushToken } from "@/features/core/utils/database";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { extractAndSaveV3Identity } from "../../identity/services/v3-identity-mapper";
import { processOnboardingFiles } from "@/features/onboarding/utils/onboardingFileProcessor";
import { syncIdentityStatus } from "../../identity/utils/identity-status-sync";
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
export const postOnboardingV3Complete = async (c) => {
    console.log("🎯 === BACKEND: Onboarding V3 Complete Request Received ===");
    console.log("📨 Request headers:", Object.fromEntries(c.req.raw.headers.entries()));
    console.log("🔗 Request URL:", c.req.url);
    console.log("📝 Request method:", c.req.method);
    const userId = getAuthenticatedUserId(c);
    console.log("👤 Authenticated User ID:", userId);
    const body = await c.req.json();
    const { state, pushToken, deviceMetadata } = body;
    console.log("📦 Request body received:", {
        hasState: !!state,
        stateKeys: state ? Object.keys(state) : [],
        userId: body.userId,
        hasPushToken: !!pushToken,
        hasDeviceMetadata: !!deviceMetadata,
    });
    if (!state || !state.responses) {
        return c.json({ error: "Missing onboarding state" }, 400);
    }
    // 📝 LOG RECEIVED ONBOARDING DATA
    console.log(`\n📨 === BACKEND RECEIVED ONBOARDING DATA ===`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📊 Total responses: ${Object.keys(state.responses).length}`);
    console.log(`📈 Progress: ${state.progressPercentage || 0}%`);
    console.log(`👤 User: ${state.userName || "N/A"}`);
    console.log(`\n📋 === RECEIVED RESPONSE BREAKDOWN ===`);
    Object.entries(state.responses).forEach(([stepId, response]) => {
        console.log(`\n🔢 Step ${stepId}:`);
        if (response.type === "voice") {
            console.log(`  🎙️  VOICE RESPONSE:`);
            console.log(`     📁 Voice URI: ${response.voiceUri || "N/A"}`);
            console.log(`     🎵 Duration: ${response.duration || 0} seconds`);
            if (response.value && typeof response.value === "string") {
                if (response.value.startsWith("data:audio/")) {
                    console.log(`     📦 Base64 audio data: ✅ (${response.value.length} chars)`);
                    console.log(`     📦 Preview: ${response.value.substring(0, 80)}...`);
                }
                else {
                    console.error(`     ❌ Unexpected voice format (expected base64): ${response.value.substring(0, 100)}...`);
                }
            }
            else {
                console.error(`     ❌ Missing or invalid voice value`);
            }
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        else if (response.type === "text") {
            console.log(`  📝 TEXT RESPONSE:`);
            console.log(`     ✍️  Text: "${response.value || "N/A"}"`);
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        else if (response.type === "choice") {
            console.log(`  🎯 CHOICE RESPONSE:`);
            console.log(`     🎯 Selected: ${JSON.stringify(response.value, null, 2)}`);
            if (response.selected_option) {
                console.log(`     📋 Option: "${response.selected_option}"`);
            }
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        else if (response.type === "dual_sliders") {
            console.log(`  📊 DUAL SLIDERS RESPONSE:`);
            // 🔧 FIX: Swift sends comma-separated string "7,9" instead of array
            if (response.sliders &&
                Array.isArray(response.sliders)) {
                response.sliders.forEach((slider, index) => {
                    console.log(`     📊 Slider ${index + 1}: ${slider} / 10`);
                });
            }
            else if (response.value && typeof response.value === 'string') {
                // Parse comma-separated string from Swift
                const sliderValues = response.value.split(',').map((v) => parseFloat(v.trim()));
                sliderValues.forEach((slider, index) => {
                    console.log(`     📊 Slider ${index + 1}: ${slider} / 10`);
                });
            }
            else {
                console.error(`     ❌ Unexpected dual_sliders format: ${JSON.stringify(response.value, null, 2)}`);
            }
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        else if (response.type === "timezone_selection") {
            console.log(`  🌍 TIMEZONE RESPONSE:`);
            console.log(`     🌍 Timezone: ${JSON.stringify(response.value, null, 2)}`);
        }
        else if (response.type === "long_press_activate") {
            console.log(`  👆 LONG PRESS RESPONSE:`);
            console.log(`     👆 Duration: ${response.duration || 0}ms`);
            console.log(`     ✅ Activated: ${response.value ? "Yes" : "No"}`);
        }
        else if (response.type === "time_window_picker") {
            console.log(`  ⏰ TIME WINDOW RESPONSE:`);
            console.log(`     ⏰ Selected: ${JSON.stringify(response.value, null, 2)}`);
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        else if (response.type === "time_picker") {
            console.log(`  🕐 TIME PICKER RESPONSE:`);
            console.log(`     🕐 Selected: ${JSON.stringify(response.value, null, 2)}`);
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        else {
            console.log(`  ❓ ${response.type.toUpperCase()} RESPONSE:`);
            console.log(`     📝 Value: ${JSON.stringify(response.value, null, 2)}`);
            if (response.db_field && response.db_field.length > 0) {
                console.log(`     🗂️  DB Field: ${response.db_field.join(', ')}`);
            }
        }
        console.log(`  ⏰ Timestamp: ${response.timestamp}`);
    });
    console.log(`\n📋 === END RECEIVED RESPONSE BREAKDOWN ===\n`);
    const env = c.env;
    const supabase = createSupabaseClient(env);
    try {
        console.log(`🔄 Processing onboarding files for user ${userId}...`);
        // Process files (convert base64 to R2 cloud URLs) before saving
        const fileProcessingResult = await processOnboardingFiles(env, state.responses, userId);
        let processedResponses = state.responses;
        if (fileProcessingResult.success &&
            fileProcessingResult.processedResponses) {
            processedResponses = fileProcessingResult.processedResponses;
            if (fileProcessingResult.uploadedFiles &&
                fileProcessingResult.uploadedFiles.length > 0) {
                console.log(`✅ Successfully processed ${fileProcessingResult.uploadedFiles.length} files:`);
                fileProcessingResult.uploadedFiles.forEach((file) => console.log(`  - ${file}`));
            }
            if (fileProcessingResult.error) {
                console.warn(`⚠️ File processing completed with warnings: ${fileProcessingResult.error}`);
            }
        }
        else {
            console.error(`❌ File processing failed: ${fileProcessingResult.error}`);
            // Continue with original responses if file processing fails
            console.log(`⚠️ Continuing with original responses (files may not work properly)`);
        }
        // Extract call time using db_field: "evening_call_time"
        let callTime = null;
        let callWindow = null;
        console.log(`\n🔍 === EXTRACTING KEY VALUES FROM RESPONSES ===`);
        // Find response by db_field instead of hardcoded step number
        for (const [stepId, responseData] of Object.entries(state.responses)) {
            const response = responseData;
            if (response.db_field && response.db_field.includes('evening_call_time')) {
                console.log(`📞 Found evening_call_time in step ${stepId}`);
                // 🔧 FIX: Try STRING format FIRST (Swift sends "20:30-21:00" as string)
                if (response.value && typeof response.value === 'string') {
                    const timeWindow = response.value;
                    if (timeWindow.includes('-')) {
                        callTime = timeWindow.split('-')[0].trim(); // Extract start time
                        callWindow = timeWindow; // Full window
                    }
                    else {
                        callTime = timeWindow.trim();
                        callWindow = timeWindow.trim();
                    }
                    console.log(`✅ Extracted call time (string format): ${callTime}, window: ${callWindow}`);
                    break;
                }
                // Handle time window picker object format (fallback for older formats)
                else if (response.value && typeof response.value === 'object' && response.value.start && response.value.end) {
                    callTime = response.value.start; // e.g., "20:30" - when calls start
                    callWindow = `${response.value.start}-${response.value.end}`; // e.g., "20:30-21:00" - full window
                    console.log(`✅ Extracted call time (object format): ${callTime}, window: ${callWindow}`);
                    break;
                }
                else {
                    console.error(`❌ Failed to extract call time - unexpected format:`, response.value);
                }
            }
        }
        console.log(`\n📊 === EXTRACTION SUMMARY ===`);
        console.log(`👤 User Name: ${state.userName || 'NOT FOUND'}`);
        console.log(`🌍 Timezone: ${state.userTimezone || 'NOT FOUND'}`);
        console.log(`📞 Call Time: ${callTime || 'NOT FOUND'}`);
        console.log(`⏰ Call Window: ${callWindow || 'NOT FOUND'}`);
        console.log(`📋 === END EXTRACTION SUMMARY ===\n`);
        // Mark onboarding as completed in users table
        await supabase
            .from("users")
            .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            name: state.userName || "User", // Use 'name' field (exists in users table)
            timezone: state.userTimezone || "UTC", // Use 'timezone' field (exists in users table)
            call_window_start: callTime, // When calls start (e.g., "20:30")
            call_window_timezone: state.userTimezone || "UTC", // User's timezone
            updated_at: new Date().toISOString(),
        })
            .eq("id", userId);
        // Save processed responses to onboarding table in JSONB format
        const { error: onboardingError } = await supabase.from("onboarding").upsert({
            user_id: userId,
            responses: processedResponses, // Use processed responses with cloud URLs
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (onboardingError) {
            console.error("Error saving onboarding responses:", onboardingError);
            throw onboardingError;
        }
        console.log(`🎉 V3 onboarding completed for user ${userId}`);
        // 📱 Save push token if provided (NEW: consolidated onboarding flow)
        if (pushToken && deviceMetadata) {
            try {
                console.log(`📱 Saving push token for user ${userId}...`);
                await upsertPushToken(env, userId, {
                    token: pushToken,
                    type: deviceMetadata.type || 'apns',
                    device_model: deviceMetadata.device_model || null,
                    os_version: deviceMetadata.os_version || null,
                    app_version: deviceMetadata.app_version || null,
                    locale: deviceMetadata.locale || null,
                    timezone: deviceMetadata.timezone || null,
                });
                console.log(`✅ Push token saved successfully`);
            }
            catch (error) {
                console.warn(`⚠️ Push token registration failed, user can continue without it:`, error);
            }
        }
        // 🧬 V3 IDENTITY EXTRACTION: Map iOS responses to Identity table schema
        let identityExtractionResult = null;
        try {
            console.log(`🧬 Starting V3 identity extraction for user ${userId}...`);
            // Use V3 mapper to extract identity from iOS responses
            identityExtractionResult = await extractAndSaveV3Identity(userId, state.userName || "User", processedResponses, env);
            console.log(`✅ V3 Identity extraction: ${identityExtractionResult.success ? "SUCCESS" : "FAILED"}`);
            if (identityExtractionResult.success) {
                console.log(`   Core fields: name, daily_commitment, chosen_path, call_time, strike_limit`);
                console.log(`   Voice URLs: ${Object.keys(identityExtractionResult.identity || {}).filter(k => k.includes('audio_url')).length}/3`);
                console.log(`   Context fields: ${Object.keys(identityExtractionResult.identity?.onboarding_context || {}).length}`);
            }
        }
        catch (error) {
            console.warn(`⚠️ V3 Identity extraction failed, user can continue without it:`, error);
            identityExtractionResult = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
        // 📊 Initialize identity status with AI-generated messages
        let identityStatusResult = null;
        try {
            console.log(`📊 Initializing identity status for user ${userId}...`);
            identityStatusResult = await syncIdentityStatus(userId, env);
            console.log(`✅ Identity status sync: ${identityStatusResult.success ? "SUCCESS" : "FAILED"}`);
        }
        catch (error) {
            console.warn(`⚠️ Identity status sync failed, user can continue without it:`, error);
            identityStatusResult = {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
        return c.json({
            success: true,
            message: "Onboarding completed successfully",
            completedAt: new Date().toISOString(),
            totalSteps: Object.keys(processedResponses).length,
            filesProcessed: fileProcessingResult.uploadedFiles?.length || 0,
            processingWarnings: fileProcessingResult.error || null,
            identityExtraction: identityExtractionResult,
            identityStatusSync: identityStatusResult,
        });
    }
    catch (error) {
        console.error("Error completing V3 onboarding:", error);
        return c.json({
            success: false,
            error: "Failed to complete onboarding",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
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
export const postExtractOnboardingData = async (c) => {
    const userId = getAuthenticatedUserId(c);
    const env = c.env;
    const supabase = createSupabaseClient(env);
    try {
        console.log(`🧠 Starting data extraction for user ${userId}...`);
        // Check if user has onboarding data in our onboarding table
        const { data: onboardingRecord, error: onboardingError } = await supabase
            .from("onboarding")
            .select("responses")
            .eq("user_id", userId)
            .single();
        if (onboardingError || !onboardingRecord || !onboardingRecord.responses) {
            return c.json({
                error: "No onboarding responses found for user",
                details: "User must complete onboarding first",
            }, 404);
        }
        console.log(`🗂️ Onboarding data found with ${Object.keys(onboardingRecord.responses).length} responses`);
        // Get user's name from auth
        const { data: userData } = await supabase
            .from("users")
            .select("name")
            .eq("id", userId)
            .single();
        const userName = userData?.name || "User";
        // Extract and save identity data using V3 mapper
        console.log(`🧬 Extracting identity data using V3 MAPPER for user ${userId}...`);
        const identityResult = await extractAndSaveV3Identity(userId, userName, onboardingRecord.responses, env);
        // Log results
        console.log(`✅ V3 Data extraction completed:`);
        console.log(`  - Identity extraction: ${identityResult.success ? "SUCCESS" : "FAILED"}`);
        if (identityResult.success && identityResult.identity) {
            console.log(`  - Core fields: ✅`);
            console.log(`  - Voice URLs: ${Object.keys(identityResult.identity).filter(k => k.includes('audio_url')).length}/3`);
            console.log(`  - Context fields: ${Object.keys(identityResult.identity.onboarding_context || {}).length}`);
        }
        return c.json({
            success: true,
            message: "V3 data extraction completed successfully",
            v3Extraction: {
                success: identityResult.success,
                error: identityResult.error,
            },
            extractedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Data extraction failed:", error);
        return c.json({
            error: "Data extraction failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
};
// Old v3 endpoints removed:
// - getOnboardingV3Resume (not needed with single submission flow)
// - postOnboardingV3VoiceAnalysis (path detection removed as per user request)
