/**
 * Process Onboarding Task (Trigger.dev)
 * 
 * Handles heavy onboarding processing in the background:
 * - Transcribe why_recording via Cartesia Ink
 * - Clone voice via Cartesia API  
 * - Upload recordings to R2 via S3 API
 * - Save to Supabase
 * 
 * This runs on Trigger.dev infrastructure, not Cloudflare Workers,
 * so we use S3 API for R2 access instead of Worker bindings.
 */

import { task, logger } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { transcribeAudio, cloneVoice } from "./cartesia";
import { uploadToR2 } from "./r2";
import { createDailyCallSchedule } from "./scheduler";
import { getEnvVar, isBase64Audio } from "./utils";
import type { OnboardingPayload } from "./types";

export const processOnboarding = task({
  id: "process-onboarding",
  
  run: async (payload: OnboardingPayload) => {
    const { jobId, userId } = payload;
    
    logger.info(`🚀 Starting onboarding processing for user ${userId}, job ${jobId}`);
    
    // Initialize Supabase client
    const supabase = createClient(
      getEnvVar("SUPABASE_URL"),
      getEnvVar("SUPABASE_SERVICE_ROLE_KEY")
    );
    
    // Helper to update job status
    async function updateJob(data: Record<string, unknown>) {
      await supabase
        .from("onboarding_jobs")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", jobId);
    }
    
    try {
      // Mark job as processing
      await updateJob({ 
        status: "processing", 
        started_at: new Date().toISOString(),
        current_step: "transcribing",
        progress: 10,
      });
      
      // ─────────────────────────────────────────────────────────────────────
      // STEP 1: Transcribe why_recording
      // ─────────────────────────────────────────────────────────────────────
      logger.info("📝 [1/4] Transcribing why_recording...");
      
      let theWhy = "";
      
      if (isBase64Audio(payload.why_recording)) {
        const transcriptionResult = await transcribeAudio(payload.why_recording);
        if (transcriptionResult.success && transcriptionResult.text) {
          theWhy = transcriptionResult.text;
        } else {
          theWhy = "[Voice recording - transcription pending]";
          logger.warn(`Transcription failed: ${transcriptionResult.error}`);
        }
      } else {
        theWhy = "[Voice recording]";
      }
      
      await updateJob({ current_step: "cloning_voice", progress: 30 });
      
      // ─────────────────────────────────────────────────────────────────────
      // STEP 2: Clone voice
      // ─────────────────────────────────────────────────────────────────────
      logger.info("🎭 [2/4] Cloning voice...");
      
      let cartesiaVoiceId: string | null = null;
      const voiceSource = payload.merged_voice_recording || payload.why_recording;
      
      if (isBase64Audio(voiceSource)) {
        const cloneResult = await cloneVoice(
          voiceSource,
          userId,
          payload.name || "User"
        );
        
        if (cloneResult.success && cloneResult.voiceId) {
          cartesiaVoiceId = cloneResult.voiceId;
        } else {
          logger.warn(`Voice cloning failed: ${cloneResult.error}`);
        }
      }
      
      await updateJob({ current_step: "uploading_audio", progress: 50 });
      
      // ─────────────────────────────────────────────────────────────────────
      // STEP 3: Upload recordings to R2
      // ─────────────────────────────────────────────────────────────────────
      logger.info("📤 [3/4] Uploading recordings to R2...");
      
      let futureSelftroUrl: string | null = null;
      let whyRecordingUrl: string | null = null;
      let pledgeRecordingUrl: string | null = null;
      
      if (isBase64Audio(payload.future_self_intro_recording)) {
        futureSelftroUrl = await uploadToR2(
          payload.future_self_intro_recording,
          userId,
          "future_self_intro"
        );
      }
      
      if (isBase64Audio(payload.why_recording)) {
        whyRecordingUrl = await uploadToR2(
          payload.why_recording,
          userId,
          "why"
        );
      }
      
      if (isBase64Audio(payload.pledge_recording)) {
        pledgeRecordingUrl = await uploadToR2(
          payload.pledge_recording,
          userId,
          "pledge"
        );
      }
      
      await updateJob({ current_step: "saving_data", progress: 75 });
      
      // ─────────────────────────────────────────────────────────────────────
      // STEP 4: Save to Supabase
      // ─────────────────────────────────────────────────────────────────────
      logger.info("💾 [4/4] Saving to Supabase...");
      
      // Get user's name and phone number
      const { data: userData } = await supabase
        .from("users")
        .select("name, phone_number")
        .eq("id", userId)
        .single();
      
      const userName = payload.name || userData?.name || "User";
      
      // Parse call time
      let callTimeString = "21:00:00";
      const finalCallTime = payload.call_time || "21:00";
      
      if (typeof finalCallTime === "string") {
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(finalCallTime)) {
          const parts = finalCallTime.split(":");
          callTimeString = `${parts[0]!.padStart(2, "0")}:${parts[1]}:${parts[2] || "00"}`;
        }
      }
      
      // Map primary pillar
      let mappedPrimaryPillar = payload.selected_pillars[0]!;
      if (payload.primary_pillar) {
        for (const pillarId of payload.selected_pillars) {
          const pillarLower = pillarId.toLowerCase();
          const primaryLower = payload.primary_pillar.toLowerCase();
          if (primaryLower.includes(pillarLower) || 
              primaryLower.includes(pillarLower.replace("_", " "))) {
            mappedPrimaryPillar = pillarId;
            break;
          }
        }
      }
      
      // Create/update future_self record
      const { data: futureSelfData, error: futureSelfError } = await supabase
        .from("future_self")
        .upsert({
          user_id: userId,
          core_identity: payload.core_identity,
          primary_pillar: mappedPrimaryPillar,
          the_why: theWhy,
          dark_future: payload.dark_future || null,
          quit_pattern: payload.quit_pattern || null,
          favorite_excuse: payload.favorite_excuse || null,
          who_disappointed: Array.isArray(payload.who_disappointed) 
            ? payload.who_disappointed 
            : [],
          future_self_intro_url: futureSelftroUrl,
          why_recording_url: whyRecordingUrl,
          pledge_recording_url: pledgeRecordingUrl,
          cartesia_voice_id: cartesiaVoiceId,
          supermemory_container_id: userId,
          selected_pillars: payload.selected_pillars,
        }, { onConflict: "user_id" })
        .select("id")
        .single();
      
      if (futureSelfError) {
        throw new Error(`Future Self insert failed: ${futureSelfError.message}`);
      }
      
      const futureSelfId = futureSelfData.id;
      logger.info(`✅ Future Self created with ID: ${futureSelfId}`);
      
      // Delete existing pillars
      await supabase
        .from("future_self_pillars")
        .delete()
        .eq("user_id", userId);
      
      // Create pillar records
      const createdPillars: string[] = [];
      
      for (let i = 0; i < payload.selected_pillars.length; i++) {
        const pillarId = payload.selected_pillars[i]!;
        
        const currentState = payload[`${pillarId}_current`] as string | undefined;
        const goal = payload[`${pillarId}_goal`] as string | undefined;
        const futureState = payload[`${pillarId}_future`] as string | undefined;
        
        if (!currentState || !futureState) {
          logger.warn(`Skipping pillar ${pillarId} - missing required fields`);
          continue;
        }
        
        const isPrimary = pillarId === mappedPrimaryPillar;
        const priority = isPrimary ? 100 : Math.max(50, 90 - i * 10);
        const identityStatement = `I am someone who ${futureState.toLowerCase().startsWith("i ") ? futureState.slice(2) : futureState}`;
        
        const { error: pillarError } = await supabase
          .from("future_self_pillars")
          .insert({
            user_id: userId,
            future_self_id: futureSelfId,
            pillar: pillarId,
            current_state: currentState,
            future_state: futureState,
            identity_statement: identityStatement,
            non_negotiable: goal || `I show up for ${pillarId.replace(/_/g, " ")} every day`,
            priority,
          });
        
        if (pillarError) {
          throw new Error(`Pillar ${pillarId} insert failed: ${pillarError.message}`);
        }
        
        createdPillars.push(pillarId);
      }
      
      // Create/update status record
      await supabase
        .from("status")
        .upsert({
          user_id: userId,
          current_streak_days: 0,
          longest_streak_days: 0,
          total_calls_completed: 0,
          last_call_at: null,
        }, { onConflict: "user_id" });
      
      // Update user record
      const userUpdateData: Record<string, unknown> = {
        name: userName,
        call_time: callTimeString,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      if (payload.timezone) {
        userUpdateData.timezone = payload.timezone;
      }
      
      await supabase
        .from("users")
        .update(userUpdateData)
        .eq("id", userId);
      
      // ─────────────────────────────────────────────────────────────────────
      // COMPLETE
      // ─────────────────────────────────────────────────────────────────────
      await updateJob({
        status: "completed",
        completed_at: new Date().toISOString(),
        current_step: "done",
        progress: 100,
        future_self_id: futureSelfId,
        voice_cloned: !!cartesiaVoiceId,
        pillars_created: createdPillars,
      });
      
      logger.info(`🎉 Onboarding complete for user ${userId}`);
      logger.info(`   Pillars: ${createdPillars.join(", ")}`);
      logger.info(`   Voice cloned: ${!!cartesiaVoiceId}`);
      
      // ─────────────────────────────────────────────────────────────────────
      // STEP 5: Create EventBridge schedule for daily calls
      // ─────────────────────────────────────────────────────────────────────
      let scheduleCreated = false;
      
      if (userData?.phone_number) {
        logger.info("📅 [5/5] Creating daily call schedule...");
        
        const timezone = payload.timezone || "America/New_York";
        // callTimeString is in HH:MM:SS format, we need HH:MM for the schedule
        const callTimeForSchedule = callTimeString.substring(0, 5);
        
        const scheduleResult = await createDailyCallSchedule({
          userId,
          callTime: callTimeForSchedule,
          timezone,
          phoneNumber: userData.phone_number,
          userName,
        });
        
        scheduleCreated = scheduleResult.success;
        
        if (scheduleResult.success) {
          logger.info(`✅ Daily call schedule created for ${callTimeForSchedule} ${timezone}`);
        } else {
          logger.warn(`⚠️ Failed to create schedule: ${scheduleResult.error}`);
          // Don't fail the onboarding if schedule creation fails
          // The schedule can be created later via settings update
        }
      } else {
        logger.warn("⚠️ No phone number found, skipping schedule creation");
      }
      
      return {
        success: true,
        futureSelfId,
        voiceCloned: !!cartesiaVoiceId,
        pillarsCreated: createdPillars,
        scheduleCreated,
      };
      
    } catch (error) {
      logger.error("💥 Onboarding processing failed:", { error });
      
      await updateJob({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      });
      
      throw error;
    }
  },
});
