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
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  SchedulerClient,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
  ActionAfterCompletion,
} from "@aws-sdk/client-scheduler";

// ═══════════════════════════════════════════════════════════════════════════
// AWS EVENTBRIDGE SCHEDULER (for daily call scheduling)
// ═══════════════════════════════════════════════════════════════════════════

interface ScheduleConfig {
  userId: string;
  callTime: string; // HH:MM format
  timezone: string;
  phoneNumber: string;
  userName?: string;
}

function timeToCronExpression(callTime: string): string {
  const [hours, minutes] = callTime.split(':').map(Number);
  return `cron(${minutes} ${hours} * * ? *)`;
}

async function createDailyCallSchedule(config: ScheduleConfig): Promise<{ success: boolean; error?: string }> {
  logger.info(`📅 Creating EventBridge schedule for user ${config.userId}`);
  
  const awsRegion = process.env.AWS_REGION || "us-east-1";
  const lambdaArn = process.env.AWS_LAMBDA_FUNCTION_ARN;
  const schedulerRoleArn = process.env.AWS_SCHEDULER_ROLE_ARN;
  const scheduleGroupName = process.env.AWS_SCHEDULE_GROUP_NAME || "youplus-daily-calls";
  
  if (!lambdaArn || !schedulerRoleArn) {
    logger.warn("⚠️ AWS schedule env vars not configured, skipping schedule creation");
    return { success: false, error: "AWS scheduler not configured" };
  }
  
  const client = new SchedulerClient({
    region: awsRegion,
    credentials: {
      accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY"),
    },
  });
  
  const scheduleName = `daily-call-${config.userId}`;
  const cronExpression = timeToCronExpression(config.callTime);
  
  try {
    const command = new CreateScheduleCommand({
      Name: scheduleName,
      GroupName: scheduleGroupName,
      ScheduleExpression: cronExpression,
      ScheduleExpressionTimezone: config.timezone,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Arn: lambdaArn,
        RoleArn: schedulerRoleArn,
        Input: JSON.stringify({
          userId: config.userId,
          phoneNumber: config.phoneNumber,
          userName: config.userName,
          timezone: config.timezone,
        }),
      },
      State: "ENABLED",
      Description: `Daily accountability call for user ${config.userId}`,
      ActionAfterCompletion: ActionAfterCompletion.NONE,
    });
    
    await client.send(command);
    logger.info(`✅ EventBridge schedule created: ${scheduleName}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`❌ Failed to create schedule:`, { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface OnboardingPayload {
  jobId: string;
  userId: string;
  
  // Core identity
  name?: string;
  core_identity: string;
  primary_pillar?: string;
  dark_future?: string;
  
  // Patterns
  quit_pattern?: string;
  favorite_excuse?: string;
  who_disappointed?: string[];
  
  // Dynamic pillars
  selected_pillars: string[];
  
  // Voice recordings (base64)
  future_self_intro_recording: string;
  why_recording: string;
  pledge_recording: string;
  merged_voice_recording?: string;
  
  // Settings
  call_time?: string;
  timezone?: string;
  
  // Dynamic pillar data (keyed by pillar ID)
  [key: string]: unknown;
}

interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function base64ToBuffer(audioBase64: string): { buffer: Buffer; mimeType: string; extension: string } {
  let cleanBase64 = audioBase64;
  let mimeType = "audio/webm";
  
  if (audioBase64.startsWith("data:")) {
    const match = audioBase64.match(/data:([^;]+);/);
    if (match?.[1]) {
      mimeType = match[1];
    }
  }
  
  if (audioBase64.includes(",")) {
    cleanBase64 = audioBase64.split(",")[1] ?? audioBase64;
  }
  
  const buffer = Buffer.from(cleanBase64, "base64");
  
  const extensionMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
  };
  const extension = extensionMap[mimeType] || "webm";
  
  return { buffer, mimeType, extension };
}

// ═══════════════════════════════════════════════════════════════════════════
// CARTESIA API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function transcribeAudio(audioBase64: string): Promise<TranscriptionResult> {
  logger.info("🎤 Starting Cartesia Ink transcription...");
  
  try {
    const { buffer, mimeType, extension } = base64ToBuffer(audioBase64);
    logger.info(`📦 Audio size: ${buffer.length} bytes, type: ${mimeType}`);
    
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    
    const formData = new FormData();
    formData.append("file", blob, `recording.${extension}`);
    formData.append("model", "ink-whisper");
    formData.append("language", "en");
    
    const response = await fetch("https://api.cartesia.ai/stt", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getEnvVar("CARTESIA_API_KEY")}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ Cartesia STT error: ${response.status} - ${errorText}`);
      return { success: false, error: `Transcription failed: ${response.status}` };
    }
    
    const result = await response.json() as { text?: string; duration?: number };
    logger.info(`✅ Transcription complete: "${result.text?.substring(0, 100)}..."`);
    
    return { success: true, text: result.text || "" };
  } catch (error) {
    logger.error("❌ Transcription error:", { error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function cloneVoice(
  audioBase64: string,
  userId: string,
  userName: string
): Promise<VoiceCloneResult> {
  logger.info("🎭 Starting Cartesia voice cloning...");
  
  try {
    const { buffer, mimeType, extension } = base64ToBuffer(audioBase64);
    logger.info(`📦 Audio for cloning: ${buffer.length} bytes`);
    
    if (buffer.length < 10000) {
      logger.warn("⚠️ Audio may be too short for quality voice cloning");
    }
    
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    
    const formData = new FormData();
    formData.append("clip", blob, `voice_sample.${extension}`);
    formData.append("name", `${userName || "User"} - Future Self`);
    formData.append("description", `Voice clone for You+ Future Self. User: ${userId.slice(0, 8)}`);
    formData.append("language", "en");
    
    const response = await fetch("https://api.cartesia.ai/voices/clone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getEnvVar("CARTESIA_API_KEY")}`,
        "Cartesia-Version": "2025-04-16",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ Voice clone error: ${response.status} - ${errorText}`);
      return { success: false, error: `Voice cloning failed: ${response.status}` };
    }
    
    const result = await response.json() as { id: string; name: string };
    logger.info(`✅ Voice cloned! ID: ${result.id}`);
    
    return { success: true, voiceId: result.id };
  } catch (error) {
    logger.error("❌ Voice cloning error:", { error });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// R2 UPLOAD VIA S3 API
// ═══════════════════════════════════════════════════════════════════════════

function createS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getEnvVar("R2_ENDPOINT"), // e.g., https://<account_id>.r2.cloudflarestorage.com
    credentials: {
      accessKeyId: getEnvVar("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnvVar("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function uploadToR2(
  audioBase64: string,
  userId: string,
  recordingType: string
): Promise<string | null> {
  logger.info(`📤 Uploading ${recordingType} to R2...`);
  
  try {
    const { buffer, mimeType, extension } = base64ToBuffer(audioBase64);
    const s3 = createS3Client();
    
    const timestamp = Date.now();
    const key = `recordings/${userId}/${recordingType}_${timestamp}.${extension}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: getEnvVar("R2_BUCKET_NAME"),
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        userId,
        recordingType,
        uploadedAt: new Date().toISOString(),
      },
    }));
    
    const backendUrl = getEnvVar("BACKEND_URL");
    const audioUrl = `${backendUrl}/audio/${key}`;
    
    logger.info(`✅ Uploaded to R2: ${audioUrl}`);
    return audioUrl;
  } catch (error) {
    logger.error(`❌ R2 upload error:`, { error });
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TASK
// ═══════════════════════════════════════════════════════════════════════════

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
      const isBase64 = (s: string) => s.startsWith("data:") || !s.startsWith("http");
      
      if (isBase64(payload.why_recording)) {
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
      
      if (isBase64(voiceSource)) {
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
      
      if (isBase64(payload.future_self_intro_recording)) {
        futureSelftroUrl = await uploadToR2(
          payload.future_self_intro_recording,
          userId,
          "future_self_intro"
        );
      }
      
      if (isBase64(payload.why_recording)) {
        whyRecordingUrl = await uploadToR2(
          payload.why_recording,
          userId,
          "why"
        );
      }
      
      if (isBase64(payload.pledge_recording)) {
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
