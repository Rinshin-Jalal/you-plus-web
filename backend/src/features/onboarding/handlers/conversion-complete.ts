import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { uploadAudioToR2 } from "@/features/voice/services/r2-upload";
import { VoiceCloneService } from "@/features/voice/services/voice-cloning";
import { addOnboardingProfile } from "@/services/supermemory";

export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");
  console.log("📨 Request headers:", Object.fromEntries(c.req.raw.headers.entries()));
  console.log("🔗 Request URL:", c.req.url);

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const body = await c.req.json();
  console.log("📦 Request body keys:", Object.keys(body));

  const {
    // Core identity
    goal,
    goalDeadline,
    motivationLevel,
    // Voice recordings (base64)
    whyItMattersAudio,
    costOfQuittingAudio,
    commitmentAudio,
    // Pattern recognition
    attemptCount,
    lastAttemptOutcome,
    previousAttemptOutcome,
    favoriteExcuse,
    whoDisappointed,
    biggestObstacle, // "What actually stopped you?"
    quitTime,
    // Demographics
    age,
    gender,
    location,
    // Stakes
    successVision, // "What does victory look like?"
    futureIfNoChange,
    whatSpent, // "What have you already wasted?"
    biggestFear, // "What scares you more?"
    // Belief
    beliefLevel, // "How much do you believe?"
    // Commitment setup
    dailyCommitment,
    callTime,
    callsGranted,
    voiceGranted,
    // Legacy fields (keep for backwards compatibility)
    witness,
    willDoThis,
    notificationsGranted,
    completedAt,
    totalTimeSpent,
    deviceMetadata,
  } = body;

  // Core required fields
  if (!goal || !dailyCommitment || !callTime) {
    return c.json({ error: "Missing required fields: goal, dailyCommitment, callTime" }, 400);
  }

  console.log(`\n📊 === CONVERSION ONBOARDING DATA ===`);
  console.log(`Goal: ${goal}`);
  console.log(`Motivation Level: ${motivationLevel}/10`);
  console.log(`Attempt Count: ${attemptCount}`);
  console.log(`Daily Commitment: ${dailyCommitment}`);
  console.log(`Will Do This: ${willDoThis}`);

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Get user's name from auth first (needed for voice cloning)
    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const userName = userData?.name || "User";

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

    const onboardingContext = {
      // Core goal info
      goal: goal,
      goal_deadline: goalDeadline || null,
      motivation_level: motivationLevel || 5,
      
      // Pattern recognition - THE PSYCHOLOGICAL GOLDMINE
      attempt_count: attemptCount || 0,
      attempt_history: attemptCount 
        ? `Failed ${attemptCount} times. Last: ${lastAttemptOutcome || 'unknown'}. Previous: ${previousAttemptOutcome || 'unknown'}.`
        : null,
      how_did_quit: lastAttemptOutcome || null, // "How does it usually end?"
      favorite_excuse: favoriteExcuse || null,
      quit_time: quitTime || null, // "When do you usually give up?"
      quit_pattern: quitTime || null, // Same as quit_time for agent
      biggest_obstacle: biggestObstacle || null, // "What actually stopped you?"
      who_disappointed: whoDisappointed || null,
      
      // Demographics - FOR PERSONALIZATION
      age: age || null,
      gender: gender || null,
      location: location || null,
      
      // Stakes - EMOTIONAL AMMUNITION
      success_vision: successVision || null, // "What does victory look like?"
      future_if_no_change: futureIfNoChange || null,
      what_spent: whatSpent || null, // "What have you already wasted?"
      biggest_fear: biggestFear || null, // "What scares you more?"
      
      // Belief tracking
      belief_level: beliefLevel || 5,
      
      // Witness/accountability
      witness: witness || null,
      will_do_this: willDoThis ?? true,
      
      // Permissions
      permissions: {
        notifications: notificationsGranted || false,
        calls: callsGranted || false,
        voice: voiceGranted || false,
      },
      
      // Metadata
      completed_at: completedAt || new Date().toISOString(),
      time_spent_minutes: totalTimeSpent ? Math.round(totalTimeSpent / 60) : null,
    };

    console.log(`✅ Onboarding context built with ${Object.keys(onboardingContext).length} fields`);

    console.log(`\n💾 === SAVING TO IDENTITY TABLE ===`);

    // NOTE: chosen_path and strike_limit removed from schema (migration 003)
    const { error: insertError } = await supabase
      .from("identity")
      .insert({
        user_id: userId,
        name: userName,
        daily_commitment: dailyCommitment,
        call_time: callTimeString,
        // Supermemory container reference (for profile fetch)
        supermemory_container_id: userId,
        // Voice recordings (will move to voice_samples table in migration 007)
        why_it_matters_audio_url: voiceUploads.whyItMatters || null,
        cost_of_quitting_audio_url: voiceUploads.costOfQuitting || null,
        commitment_audio_url: voiceUploads.commitment || null,
        cartesia_voice_id: clonedVoiceId, // Cloned voice for Future You agent
        // DEPRECATED: onboarding_context - profile now in Supermemory
        // Keeping for backwards compatibility during transition
        onboarding_context: onboardingContext,
      });

    if (insertError) {
      console.error("❌ Identity insert failed:", insertError);
      throw insertError;
    }

    console.log(`✅ Identity created (trigger auto-creates status)`);

    // ═══════════════════════════════════════════════════════════════════════════════
    // 🧠 SUPERMEMORY - Store psychological profile for dynamic agent context
    // This replaces the need for agent to read onboarding_context directly
    // ═══════════════════════════════════════════════════════════════════════════════
    console.log(`\n🧠 === STORING PROFILE IN SUPERMEMORY ===`);
    
    const supermemoryResult = await addOnboardingProfile(env, userId, {
      goal,
      goalDeadline,
      motivationLevel,
      attemptCount,
      lastAttemptOutcome,
      previousAttemptOutcome,
      favoriteExcuse,
      whoDisappointed,
      biggestObstacle,
      quitTime,
      age,
      gender,
      location,
      successVision,
      futureIfNoChange,
      whatSpent,
      biggestFear,
      beliefLevel,
      dailyCommitment,
      witness,
    });
    
    if (supermemoryResult.success) {
      console.log(`✅ Profile stored in Supermemory: ${supermemoryResult.memoryId}`);
    } else {
      console.warn(`⚠️ Supermemory storage failed (non-critical): ${supermemoryResult.error}`);
      // Non-critical - continue with onboarding even if Supermemory fails
    }

    console.log(`\n👤 === UPDATING USER RECORD ===`);

    // NOTE: call_window_start, call_window_timezone, push_token removed from users table (migration 003)
    // Call time is stored in identity.call_time
    const { error: updateError } = await supabase
      .from("users")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        timezone: deviceMetadata?.timezone || "UTC",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ User update failed:", updateError);
      throw updateError;
    }

    console.log(`✅ User marked as onboarding complete`);

    // NOTE: Push token storage removed for MVP (migration 003)
    // Push notifications handled via alternative mechanism

    console.log(`\n🎉 === CONVERSION ONBOARDING COMPLETE ===`);
    console.log(`✅ Identity created with core fields + voice URLs`);
    console.log(`✅ Status auto-created by trigger`);
    if (clonedVoiceId) {
      console.log(`✅ Voice cloned for Future You agent: ${clonedVoiceId}`);
    }
    if (supermemoryResult.success) {
      console.log(`✅ Profile stored in Supermemory for dynamic agent context`);
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
      supermemory: {
        stored: supermemoryResult.success,
        memoryId: supermemoryResult.memoryId || null,
      },
      identity: {
        created: true,
        core_fields: ["name", "daily_commitment", "call_time", "supermemory_container_id"],
        voice_urls: Object.keys(voiceUploads).length,
        context_fields: Object.keys(onboardingContext).length,
      },
      statusCreated: true, // Automatically created by trigger
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
