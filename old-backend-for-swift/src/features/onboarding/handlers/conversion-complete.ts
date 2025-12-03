import { Context } from "hono";
import { createSupabaseClient, upsertPushToken } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { uploadAudioToR2 } from "@/features/voice/services/r2-upload";
import { VoiceCloneService } from "@/features/voice/services/voice-cloning";

export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");
  console.log("📨 Request headers:", Object.fromEntries(c.req.raw.headers.entries()));
  console.log("🔗 Request URL:", c.req.url);

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const body = await c.req.json();
  console.log("📦 Request body keys:", Object.keys(body));

  const {
    goal,
    goalDeadline,
    motivationLevel,
    whyItMattersAudio,
    attemptCount,
    lastAttemptOutcome,
    previousAttemptOutcome,
    favoriteExcuse,
    whoDisappointed,
    quitTime,
    costOfQuittingAudio,
    futureIfNoChange,
    dailyCommitment,
    callTime,
    strikeLimit,
    commitmentAudio,
    witness,
    willDoThis,
    chosenPath,
    notificationsGranted,
    callsGranted,
    completedAt,
    totalTimeSpent,
    pushToken,
    deviceMetadata,
  } = body;

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
    console.log(`\n🎙️  === UPLOADING VOICE RECORDINGS ===`);

    const voiceUploads: {
      whyItMatters?: string;
      costOfQuitting?: string;
      commitment?: string;
    } = {};

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

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🎤 VOICE CLONING - Clone user's voice for "Future You" agent
    // Uses commitment audio as primary voice sample (longest, clearest recording)
    // ═══════════════════════════════════════════════════════════════════════════════
    let clonedVoiceId: string | null = null;

    const voiceUrlForCloning = voiceUploads.commitment || voiceUploads.whyItMatters || voiceUploads.costOfQuitting;

    if (voiceUrlForCloning) {
      console.log(`\n🎤 === CLONING USER VOICE ===`);
      console.log(`📤 Using audio URL: ${voiceUrlForCloning}`);

      try {
        const voiceCloneService = new VoiceCloneService(env);
        const cloneResult = await voiceCloneService.cloneUserVoice({
          audio_url: voiceUrlForCloning,
          voice_name: `${userName} - Future You`,
          user_id: userId,
          provider: "cartesia", // Use Cartesia for Line SDK compatibility
        });

        if (cloneResult.success && cloneResult.voice_id) {
          clonedVoiceId = cloneResult.voice_id;
          console.log(`✅ Voice cloned successfully! ID: ${clonedVoiceId}`);
        } else {
          console.warn(`⚠️ Voice cloning failed: ${cloneResult.error}`);
        }
      } catch (error) {
        console.error(`💥 Voice cloning error (non-critical):`, error);
        // Non-critical - continue with onboarding even if cloning fails
      }
    } else {
      console.warn(`⚠️ No voice recordings available for cloning`);
    }

    console.log(`\n📦 === BUILDING ONBOARDING CONTEXT ===`);

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

    console.log(`\n💾 === SAVING TO IDENTITY TABLE ===`);

    const { error: insertError } = await supabase
      .from("identity")
      .insert({
        user_id: userId,
        name: userName,
        daily_commitment: dailyCommitment,
        chosen_path: chosenPath,
        call_time: callTimeString,
        strike_limit: strikeLimit,
        why_it_matters_audio_url: voiceUploads.whyItMatters || null,
        cost_of_quitting_audio_url: voiceUploads.costOfQuitting || null,
        commitment_audio_url: voiceUploads.commitment || null,
        cartesia_voice_id: clonedVoiceId, // Cloned voice for Future You agent
        onboarding_context: onboardingContext,
      });

    if (insertError) {
      console.error("❌ Identity insert failed:", insertError);
      throw insertError;
    }

    console.log(`✅ Identity created (trigger auto-creates identity_status)`);

    console.log(`\n👤 === UPDATING USER RECORD ===`);

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

    console.log(`\n🎉 === CONVERSION ONBOARDING COMPLETE ===`);
    console.log(`✅ Identity created with core fields + voice URLs + JSONB context`);
    console.log(`✅ Identity status auto-created by trigger`);
    if (clonedVoiceId) {
      console.log(`✅ Voice cloned for Future You agent: ${clonedVoiceId}`);
    }

    return c.json({
      success: true,
      message: "Conversion onboarding completed successfully",
      completedAt: new Date().toISOString(),
      voiceUploads: voiceUploads,
      voiceClone: {
        cloned: !!clonedVoiceId,
        cartesia_voice_id: clonedVoiceId || null,
      },
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
