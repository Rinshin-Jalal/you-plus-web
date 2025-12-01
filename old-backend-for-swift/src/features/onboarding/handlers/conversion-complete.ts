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
import { createSupabaseClient, upsertPushToken } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { uploadAudioToR2 } from "@/features/voice/services/r2-upload";

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
export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");
  console.log("📨 Request headers:", Object.fromEntries(c.req.raw.headers.entries()));
  console.log("🔗 Request URL:", c.req.url);

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const body = await c.req.json();
  console.log("📦 Request body keys:", Object.keys(body));

  const {
    // Identity & Aspiration
    goal,
    goalDeadline,
    motivationLevel,
    whyItMattersAudio,

    // Pattern Recognition
    attemptCount,
    lastAttemptOutcome,
    previousAttemptOutcome,
    favoriteExcuse,
    whoDisappointed,
    quitTime,

    // The Cost
    costOfQuittingAudio,
    futureIfNoChange,

    // Commitment Setup
    dailyCommitment,
    callTime,
    strikeLimit,
    commitmentAudio,
    witness,

    // Decision
    willDoThis,
    chosenPath,

    // Permissions
    notificationsGranted,
    callsGranted,

    // Metadata
    completedAt,
    totalTimeSpent,

    // Optional: Push notifications
    pushToken,
    deviceMetadata,
  } = body;

  // Validate required fields
  if (!goal || !goalDeadline || !motivationLevel) {
    return c.json({ error: "Missing required identity fields" }, 400);
  }

  if (!attemptCount || !lastAttemptOutcome || !previousAttemptOutcome) {
    return c.json({ error: "Missing required pattern recognition fields" }, 400);
  }

  if (!futureIfNoChange) {
    return c.json({ error: "Missing required cost analysis fields" }, 400);
  }

  if (!dailyCommitment || !callTime || !strikeLimit || !witness) {
    return c.json({ error: "Missing required commitment fields" }, 400);
  }

  if (willDoThis === undefined || !chosenPath) {
    return c.json({ error: "Missing required decision fields" }, 400);
  }

  console.log(`\n📊 === CONVERSION ONBOARDING DATA ===`);
  console.log(`Goal: ${goal}`);
  console.log(`Motivation Level: ${motivationLevel}/10`);
  console.log(`Attempt Count: ${attemptCount}`);
  console.log(`Daily Commitment: ${dailyCommitment}`);
  console.log(`Chosen Path: ${chosenPath}`);
  console.log(`Will Do This: ${willDoThis}`);

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // ==================================================
    // PHASE 1: Upload Voice Recordings to R2
    // ==================================================
    console.log(`\n🎙️  === UPLOADING VOICE RECORDINGS ===`);

    const voiceUploads: {
      whyItMatters?: string;
      costOfQuitting?: string;
      commitment?: string;
    } = {};

    // Upload whyItMattersAudio (if provided)
    if (whyItMattersAudio && whyItMattersAudio.startsWith("data:audio/")) {
      console.log("📤 Uploading whyItMatters audio...");
      const base64Data = whyItMattersAudio.split(",")[1];
      const audioBuffer = Buffer.from(base64Data, "base64");
      const fileName = `${userId}_why_it_matters_${Date.now()}.m4a`;

      const uploadResult = await uploadAudioToR2(
        env,
        audioBuffer.buffer,
        fileName,
        "audio/m4a"
      );

      if (uploadResult.success && uploadResult.cloudUrl) {
        voiceUploads.whyItMatters = uploadResult.cloudUrl;
        console.log(`✅ WhyItMatters uploaded: ${uploadResult.cloudUrl}`);
      } else {
        console.warn(`⚠️ WhyItMatters upload failed: ${uploadResult.error}`);
      }
    }

    // Upload costOfQuittingAudio (if provided)
    if (costOfQuittingAudio && costOfQuittingAudio.startsWith("data:audio/")) {
      console.log("📤 Uploading costOfQuitting audio...");
      const base64Data = costOfQuittingAudio.split(",")[1];
      const audioBuffer = Buffer.from(base64Data, "base64");
      const fileName = `${userId}_cost_of_quitting_${Date.now()}.m4a`;

      const uploadResult = await uploadAudioToR2(
        env,
        audioBuffer.buffer,
        fileName,
        "audio/m4a"
      );

      if (uploadResult.success && uploadResult.cloudUrl) {
        voiceUploads.costOfQuitting = uploadResult.cloudUrl;
        console.log(`✅ CostOfQuitting uploaded: ${uploadResult.cloudUrl}`);
      } else {
        console.warn(`⚠️ CostOfQuitting upload failed: ${uploadResult.error}`);
      }
    }

    // Upload commitmentAudio (if provided)
    if (commitmentAudio && commitmentAudio.startsWith("data:audio/")) {
      console.log("📤 Uploading commitment audio...");
      const base64Data = commitmentAudio.split(",")[1];
      const audioBuffer = Buffer.from(base64Data, "base64");
      const fileName = `${userId}_commitment_${Date.now()}.m4a`;

      const uploadResult = await uploadAudioToR2(
        env,
        audioBuffer.buffer,
        fileName,
        "audio/m4a"
      );

      if (uploadResult.success && uploadResult.cloudUrl) {
        voiceUploads.commitment = uploadResult.cloudUrl;
        console.log(`✅ Commitment uploaded: ${uploadResult.cloudUrl}`);
      } else {
        console.warn(`⚠️ Commitment upload failed: ${uploadResult.error}`);
      }
    }

    console.log(`✅ Voice uploads complete: ${Object.keys(voiceUploads).length}/3`);

    // ==================================================
    // PHASE 2: Build Onboarding Context JSONB
    // ==================================================
    console.log(`\n📦 === BUILDING ONBOARDING CONTEXT ===`);

    // Parse call time to extract just the time portion (HH:MM:SS)
    const callTimeDate = new Date(callTime);
    const callTimeString = `${String(callTimeDate.getHours()).padStart(2, "0")}:${String(
      callTimeDate.getMinutes()
    ).padStart(2, "0")}:${String(callTimeDate.getSeconds()).padStart(2, "0")}`;

    // Get user's name from auth
    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const userName = userData?.name || "User";

    // Build concise onboarding context (everything that's not a core field)
    const onboardingContext = {
      goal: goal,
      goal_deadline: goalDeadline,
      motivation_level: motivationLevel,
      attempt_history: `Failed ${attemptCount} times. Last: ${lastAttemptOutcome}. Previous: ${previousAttemptOutcome}.`,
      favorite_excuse: favoriteExcuse,
      who_disappointed: whoDisappointed,
      quit_time: quitTime,
      quit_pattern: `Usually quits after ${attemptCount} attempts`,
      future_if_no_change: futureIfNoChange,
      witness: witness,
      will_do_this: willDoThis,
      permissions: {
        notifications: notificationsGranted || false,
        calls: callsGranted || false,
      },
      completed_at: completedAt,
      time_spent_minutes: Math.round(totalTimeSpent / 60),
    };

    console.log(`✅ Onboarding context built with ${Object.keys(onboardingContext).length} fields`);

    // ==================================================
    // PHASE 3: Save to Identity Table
    // ==================================================
    console.log(`\n💾 === SAVING TO IDENTITY TABLE ===`);

    //TODO: WE NEED TO USE AI TO MAKE THIS MORE DYNAMIC somehow
    const { error: insertError } = await supabase
      .from("identity")
      .insert({
        user_id: userId,

        // Core fields (used in app logic)
        name: userName,
        daily_commitment: dailyCommitment,
        chosen_path: chosenPath,
        call_time: callTimeString,
        strike_limit: strikeLimit,

        // Voice recordings (R2 URLs for AI calls)
        why_it_matters_audio_url: voiceUploads.whyItMatters || null,
        cost_of_quitting_audio_url: voiceUploads.costOfQuitting || null,
        commitment_audio_url: voiceUploads.commitment || null,

        // Everything else (JSONB context for AI personalization)
        onboarding_context: onboardingContext,
      });

    if (insertError) {
      console.error("❌ Identity insert failed:", insertError);
      throw insertError;
    }

    console.log(`✅ Identity created (trigger auto-creates identity_status)`);

    // ==================================================
    // PHASE 4: Update User Record
    // ==================================================
    console.log(`\n👤 === UPDATING USER RECORD ===`);

    // Extract timezone from deviceMetadata or default to UTC
    const userTimezone = deviceMetadata?.timezone || "UTC";

    const { error: updateError } = await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        call_window_start: callTimeString,
        call_window_timezone: userTimezone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ User update failed:", updateError);
      throw updateError;
    }

    console.log(`✅ User marked as onboarding complete`);

    // ==================================================
    // PHASE 5: Save Push Token (if provided)
    // ==================================================
    if (pushToken && deviceMetadata) {
      try {
        console.log(`\n📱 === SAVING PUSH TOKEN ===`);
        await upsertPushToken(env, userId, {
          token: pushToken,
          type: deviceMetadata.type || "apns",
          device_model: deviceMetadata.device_model || null,
          os_version: deviceMetadata.os_version || null,
          app_version: deviceMetadata.app_version || null,
          locale: deviceMetadata.locale || null,
          timezone: deviceMetadata.timezone || null,
        });
        console.log(`✅ Push token saved successfully`);
      } catch (error) {
        console.warn(`⚠️ Push token save failed (non-critical):`, error);
      }
    }

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================
    console.log(`\n🎉 === CONVERSION ONBOARDING COMPLETE ===`);
    console.log(`✅ Identity created with core fields + voice URLs + JSONB context`);
    console.log(`✅ Identity status auto-created by trigger`);

    return c.json({
      success: true,
      message: "Conversion onboarding completed successfully",
      completedAt: new Date().toISOString(),
      voiceUploads: voiceUploads,
      identity: {
        created: true,
        core_fields: ["name", "daily_commitment", "chosen_path", "call_time", "strike_limit"],
        voice_urls: Object.keys(voiceUploads).length,
        context_fields: Object.keys(onboardingContext).length,
      },
      identityStatusCreated: true, // Automatically created by trigger
    });
  } catch (error) {
    console.error("💥 Conversion onboarding failed:", error);
    return c.json(
      {
        success: false,
        error: "Failed to complete conversion onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
