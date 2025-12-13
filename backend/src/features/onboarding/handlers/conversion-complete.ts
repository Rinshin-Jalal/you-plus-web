import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/types/environment";
import { getAuthenticatedUserId } from "@/middleware/auth";
import type { ConversionCompleteBody } from "../schemas";
import { tasks } from "@trigger.dev/sdk/v3";
import type { processOnboarding } from "@/trigger/processOnboarding";

/**
 * Conversion Onboarding Complete Handler (Async Version)
 * 
 * This handler validates the payload and queues heavy processing to Trigger.dev.
 * Returns immediately with a jobId that the frontend can poll for status.
 * 
 * Heavy tasks delegated to Trigger.dev:
 * - Transcribe why_recording via Cartesia Ink (~3-8s)
 * - Clone voice via Cartesia API (~10-20s)
 * - Upload 3 recordings to R2 (~2-5s each)
 * - Save to Supabase
 */
export const postConversionOnboardingComplete = async (c: Context) => {
  console.log("🎯 === CONVERSION ONBOARDING: Complete Request Received ===");

  const userId = getAuthenticatedUserId(c);
  console.log("👤 Authenticated User ID:", userId);

  const validatedPayload = c.get("validatedJson") as ConversionCompleteBody | undefined;
  if (!validatedPayload)
    return c.json({ error: "Invalid onboarding payload" }, 400);
  console.log("📦 Request body keys:", Object.keys(validatedPayload));
  const env = c.env as Env;

  const supabase = createSupabaseClient(env);

  try {
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Check for existing active job (prevent duplicate submissions)
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: existingJob } = await supabase
      .from("onboarding_jobs")
      .select("id, status, created_at")
      .eq("user_id", userId)
      .in("status", ["pending", "processing"])
      .single();

    if (existingJob) {
      console.log(`⚠️ Active job exists for user: ${existingJob.id} (${existingJob.status})`);
      return c.json({
        success: true,
        message: "Onboarding already in progress",
        jobId: existingJob.id,
        status: existingJob.status,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Create job record in database
    // ═══════════════════════════════════════════════════════════════════════════
    const { data: jobData, error: jobError } = await supabase
      .from("onboarding_jobs")
      .insert({
        user_id: userId,
        status: "pending",
        current_step: "queued",
        progress: 0,
      })
      .select("id")
      .single();

    if (jobError) {
      console.error("❌ Failed to create job record:", jobError);
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    const jobId = jobData.id;
    console.log(`📋 Created onboarding job: ${jobId}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Queue the heavy processing to Trigger.dev
    // ═══════════════════════════════════════════════════════════════════════════
    console.log("🚀 Queueing onboarding task to Trigger.dev...");

    // Build the payload for Trigger.dev (includes dynamic pillar fields via schema passthrough)
    const triggerPayload = {
      jobId,
      userId,
      ...validatedPayload,
    } as Parameters<typeof processOnboarding.trigger>[0];

    try {
      const handle = await tasks.trigger<typeof processOnboarding>(
        "process-onboarding",
        triggerPayload
      );

      // Update job with Trigger.dev run ID
      await supabase
        .from("onboarding_jobs")
        .update({ trigger_run_id: handle.id })
        .eq("id", jobId);

      console.log(`✅ Task queued! Run ID: ${handle.id}`);
    } catch (triggerError) {
      // If Trigger.dev fails to queue, mark job as failed
      console.error("❌ Failed to queue task:", triggerError);
      
      await supabase
        .from("onboarding_jobs")
        .update({ 
          status: "failed",
          error_message: triggerError instanceof Error ? triggerError.message : "Failed to queue task",
        })
        .eq("id", jobId);

      throw triggerError;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Return immediately with job ID
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`🎉 Onboarding queued successfully for user ${userId}`);

    return c.json({
      success: true,
      message: "Onboarding processing started",
      jobId,
      status: "processing",
      pollUrl: `/api/onboarding/status/${jobId}`,
    });

  } catch (error) {
    console.error("💥 Failed to queue onboarding:", error);
    return c.json(
      {
        success: false,
        error: "Failed to start onboarding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

/**
 * Get Onboarding Job Status
 * 
 * Called by frontend to poll for job completion.
 * GET /api/onboarding/status/:jobId
 */
export const getOnboardingJobStatus = async (c: Context) => {
  const params = c.get("validatedParams") as { jobId: string } | undefined;
  const jobId = params?.jobId;
  const userId = getAuthenticatedUserId(c);
  const env = c.env as Env;
  if (!jobId) return c.json({ error: "Missing jobId parameter" }, 400);

  const supabase = createSupabaseClient(env);

  const { data: job, error } = await supabase
    .from("onboarding_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId) // Ensure user can only see their own jobs
    .single();

  if (error || !job) {
    return c.json({ error: "Job not found" }, 404);
  }

  // Build response based on status
  const response: Record<string, unknown> = {
    jobId: job.id,
    status: job.status,
    currentStep: job.current_step,
    progress: job.progress,
    createdAt: job.created_at,
  };

  if (job.status === "completed") {
    response.completedAt = job.completed_at;
    response.futureSelf = {
      id: job.future_self_id,
      voiceCloned: job.voice_cloned,
      pillars: job.pillars_created,
    };
  }

  if (job.status === "failed") {
    response.error = job.error_message;
    response.completedAt = job.completed_at;
  }

  return c.json(response);
};
