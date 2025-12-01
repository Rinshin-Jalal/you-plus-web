import { createSupabaseClient } from "@/features/core/utils/database";
import {
  AudioWebhookData,
  CallRecordingElevenLabs,
  ElevenLabsAudioRecord,
  ElevenLabsWebhookEvent,
  EvaluationResult,
  TranscriptionWebhookData,
} from "@/types/elevenlabs";
import { generateAudioFileName, uploadAudioToR2 } from "@/features/voice/services/r2-upload";
import { Env } from "@/index";
import crypto from "node:crypto";
import { syncIdentityStatus } from "@/features/identity/utils/identity-status-sync";

interface ElevenLabsWebhookEnv extends Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ELEVENLABS_WEBHOOK_SECRET?: string;
}

export class ElevenLabsWebhookHandler {
  private env: ElevenLabsWebhookEnv;

  constructor(env: ElevenLabsWebhookEnv) {
    this.env = env;
  }

  /**
   * Validate HMAC signature from ElevenLabs webhook
   */
  validateSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature || !secret) {
      console.warn("Missing signature or secret for webhook validation");
      return false;
    }

    try {
      // Parse ElevenLabs signature format: "t=timestamp,v0=hash"
      const parts = signature.split(",");
      const timestampPart = parts.find((p) => p.startsWith("t="));
      const hashPart = parts.find((p) => p.startsWith("v0="));

      if (!timestampPart || !hashPart) {
        console.error("Invalid signature format");
        return false;
      }

      const timestamp = timestampPart.substring(2);
      const expectedHash = hashPart.substring(3);

      // Validate timestamp (within 30 minutes)
      const reqTimestamp = parseInt(timestamp) * 1000;
      const tolerance = Date.now() - 30 * 60 * 1000;
      if (reqTimestamp < tolerance) {
        console.error("Request timestamp too old");
        return false;
      }

      // Validate HMAC signature
      const message = `${timestamp}.${payload}`;
      const computedHash = crypto
        .createHmac("sha256", secret)
        .update(message)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(expectedHash, "hex"),
        Buffer.from(computedHash, "hex"),
      );
    } catch (error) {
      console.error("Signature validation error:", error);
      return false;
    }
  }

  /**
   * Process incoming ElevenLabs webhook
   */
  async processWebhook(
    event: ElevenLabsWebhookEvent,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `🔔 Processing ElevenLabs webhook: ${event.type} for conversation ${
          event.data?.conversation_id || "unknown"
        }`,
      );

      switch (event.type) {
        case "post_call_transcription":
          if (!event.data) {
            return {
              success: false,
              error: "Missing webhook data for transcription",
            };
          }
          return await this.handleTranscriptionWebhook(
            event.data as TranscriptionWebhookData,
          );

        case "post_call_audio":
          if (!event.data) {
            return { success: false, error: "Missing webhook data for audio" };
          }
          return await this.handleAudioWebhook(event.data as AudioWebhookData);

        default:
          console.log(`ℹ️ Unhandled webhook type: ${event.type}`);
          return { success: true };
      }
    } catch (error) {
      console.error("❌ ElevenLabs webhook processing failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown webhook error",
      };
    }
  }

  /**
   * Handle transcription webhook with full conversation data
   */
  private async handleTranscriptionWebhook(
    data: TranscriptionWebhookData,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createSupabaseClient(this.env);

    try {
      // Extract user ID from multiple possible sources
      const userId = data.user_id ||
        data.conversation_initiation_client_data.dynamic_variables?.user_id ||
        data.conversation_initiation_client_data.dynamic_variables?.userId ||
        data.conversation_initiation_client_data.dynamic_variables?.user;

      // Derive call type from dynamic variables when available (fallback to first_call)
      const dynamicVars =
        data.conversation_initiation_client_data?.dynamic_variables || {};
      const callTypeCandidate: string | undefined = dynamicVars.callType ||
        dynamicVars.call_type;
      const validCallTypes = [
        "morning",
        "evening",
        "first_call",
        "apology_call",
        "emergency",
      ];
      const resolvedCallType =
        validCallTypes.includes(String(callTypeCandidate))
          ? String(callTypeCandidate)
          : "first_call";

      // Prepare call record aligned with public.calls schema
      const callRecord: CallRecordingElevenLabs = {
        conversation_id: data.conversation_id,
        user_id: userId,
        call_type: resolvedCallType,
        audio_url: "", // updated by audio webhook
        duration_sec: data.metadata.call_duration_secs,
        transcript_json: data.transcript,
        transcript_summary: data.analysis.transcript_summary,
        status: data.status,
        cost_cents: Math.round(data.metadata.cost),
        start_time: new Date(data.metadata.start_time_unix_secs * 1000)
          .toISOString(),
        end_time: new Date(
          (data.metadata.start_time_unix_secs +
            data.metadata.call_duration_secs) * 1000,
        ).toISOString(),
        call_successful: data.analysis.call_successful,
        source: "elevenlabs",
      };

      // Upsert into calls by conversation_id
      const { data: insertedRecord, error: callError } = await supabase
        .from("calls")
        .upsert(callRecord, { onConflict: "conversation_id" })
        .select("id")
        .single();

      if (callError) {
        console.error("Failed to store call record:", callError);
        return { success: false, error: "Database storage failed" };
      }

      // Get the call recording ID for related tables
      const callRecordingId = insertedRecord?.id;

      if (callRecordingId) {
        // Process success evaluation results
        await this.processEvaluationResults(
          callRecordingId,
          data.conversation_id,
          data.analysis.evaluation_criteria_results,
          supabase,
        );

        // Process data collection results
        await this.processDataCollection(
          callRecordingId,
          data.conversation_id,
          data.analysis.data_collection_results,
          userId,
          supabase,
        );
      }

      // Trigger any follow-up actions based on call results
      await this.triggerFollowUpActions(callRecord);

      // REMOVED: Memory ingestion disabled - feature removed in bloat elimination
      // REMOVED: Brutal reality generation disabled - feature removed in bloat elimination
      // Sync identity status is still performed after all successful calls

      // 📊 Sync identity status with latest promise data
      if (userId && callRecord.call_successful === "success") {
        try {
          await syncIdentityStatus(userId, this.env);
          console.log(
            `📊 Identity status synced for user ${userId}`,
          );
        } catch (error) {
          console.error(
            `Failed to sync identity status for user ${userId}:`,
            error,
          );
        }
      }

      console.log(
        `✅ Successfully processed transcription webhook for conversation: ${data.conversation_id}`,
      );
      return { success: true };
    } catch (error) {
      console.error("Transcription webhook processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
      };
    }
  }

  /**
   * Handle audio webhook with base64-encoded audio data and R2 storage
   */
  private async handleAudioWebhook(
    data: AudioWebhookData,
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createSupabaseClient(this.env);

    try {
      // Calculate audio file size
      const audioBuffer = Buffer.from(data.full_audio, "base64");
      const fileSizeBytes = audioBuffer.length;

      // Generate unique filename for R2 storage
      const fileName = generateAudioFileName(
        "elevenlabs",
        data.conversation_id,
        "mp3",
      );

      // Upload to R2 bucket first
      // Convert Node.js Buffer to ArrayBuffer for compatibility
      const arrayBuffer = audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength);
      const r2Upload = await uploadAudioToR2(
        this.env,
        arrayBuffer,
        fileName,
        "audio/mpeg",
      );

      // Update calls table with audio URL first
      const audioUrl = r2Upload.success ? r2Upload.cloudUrl : "";

      if (audioUrl) {
        const { error: updateError } = await supabase
          .from("calls")
          .update({ audio_url: audioUrl })
          .eq("conversation_id", data.conversation_id);

        if (updateError) {
          console.error(
            "Failed to update calls with audio URL:",
            updateError,
          );
        }
      }

      // Get the call recording ID for audio table
      const { data: callRecord, error: callError } = await supabase
        .from("calls")
        .select("id")
        .eq("conversation_id", data.conversation_id)
        .single();

      if (callError || !callRecord) {
        console.error("Failed to find call record for audio:", callError);
        return { success: false, error: "Call record not found" };
      }

      // Prepare audio record with R2 data and fallback
      const audioRecord: ElevenLabsAudioRecord = {
        call_recording_id: callRecord.id,
        conversation_id: data.conversation_id,
        agent_id: data.agent_id,
        audio_data: r2Upload.success ? null : data.full_audio, // Only store base64 if R2 fails
        file_size_bytes: fileSizeBytes,
        r2_object_key: r2Upload.success ? fileName : null,
        r2_url: r2Upload.cloudUrl || null,
      };

      // Store audio record in database
      const { error: audioError } = await supabase
        .from("elevenlabs_audio")
        .upsert(audioRecord, {
          onConflict: "conversation_id",
        });

      if (audioError) {
        console.error("Failed to store audio record:", audioError);
        return { success: false, error: "Audio storage failed" };
      }

      if (r2Upload.success) {
        console.log(`✅ Audio stored in R2: ${r2Upload.cloudUrl}`);
      } else {
        console.warn(
          `⚠️ R2 upload failed, stored base64 in database: ${r2Upload.error}`,
        );
      }

      console.log(
        `✅ Successfully processed audio webhook for conversation: ${data.conversation_id} (${fileSizeBytes} bytes)`,
      );
      return { success: true };
    } catch (error) {
      console.error("Audio webhook processing error:", error);
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Audio processing failed",
      };
    }
  }

  /**
   * Process success evaluation results and store detailed metrics
   */
  private async processEvaluationResults(
    callRecordingId: string,
    conversationId: string,
    evaluationResults: Record<string, EvaluationResult>,
    supabase: any,
  ): Promise<void> {
    try {
      // Store individual evaluation results for detailed analysis
      const evaluationRecords = Object.entries(evaluationResults).map((
        [criteriaId, result],
      ) => ({
        call_recording_id: callRecordingId,
        conversation_id: conversationId,
        criteria_id: criteriaId,
        result: result.result,
        rationale: result.rationale,
      }));

      if (evaluationRecords.length > 0) {
        const { error } = await supabase
          .from("elevenlabs_evaluations")
          .upsert(evaluationRecords, {
            onConflict: "conversation_id,criteria_id",
          });

        if (error) {
          console.error("Failed to store evaluation results:", error);
        } else {
          console.log(
            `✅ Stored ${evaluationRecords.length} evaluation results`,
          );
        }
      }
    } catch (error) {
      console.error("Evaluation processing error:", error);
    }
  }

  /**
   * Process data collection results and extract structured information
   */
  private async processDataCollection(
    callRecordingId: string,
    conversationId: string,
    dataCollectionResults: Record<string, any>,
    userId: string | undefined,
    supabase: any,
  ): Promise<void> {
    try {
      // Store individual data collection results
      const dataRecords = Object.entries(dataCollectionResults).map((
        [fieldId, value],
      ) => ({
        call_recording_id: callRecordingId,
        conversation_id: conversationId,
        field_id: fieldId,
        field_value: typeof value === "object"
          ? JSON.stringify(value)
          : String(value),
        field_type: this.inferDataType(value),
        user_id: userId,
      }));

      if (dataRecords.length > 0) {
        const { error } = await supabase
          .from("elevenlabs_data_collection")
          .upsert(dataRecords, {
            onConflict: "conversation_id,field_id",
          });

        if (error) {
          console.error("Failed to store data collection results:", error);
        } else {
          console.log(
            `✅ Stored ${dataRecords.length} data collection results`,
          );
        }
      }

      // Process specific data types for business logic
      await this.processBusinessData(
        dataCollectionResults,
        userId,
        conversationId,
        supabase,
      );

      // Process promise-related data from calls
      await this.processPromiseData(
        dataCollectionResults,
        userId,
        conversationId,
        supabase,
      );
    } catch (error) {
      console.error("Data collection processing error:", error);
    }
  }

  /**
   * Process extracted data for business-specific logic
   */
  private async processBusinessData(
    dataResults: Record<string, any>,
    userId: string | undefined,
    conversationId: string,
    supabase: any,
  ): Promise<void> {
    try {
      // Example: Process contact information
      if (dataResults.email && userId) {
        await supabase
          .from("users")
          .update({ email: dataResults.email })
          .eq("id", userId);
      }

      // Example: Process issue categorization
      if (dataResults.issue_category) {
        // Update call record with issue category for analytics
        // Schema does not include issue_category on calls; skipping this update
      }
    } catch (error) {
      console.error("Business data processing error:", error);
    }
  }

  /**
   * Trigger follow-up actions based on call results
   */
  private async triggerFollowUpActions(
    callRecord: CallRecordingElevenLabs,
  ): Promise<void> {
    try {
      // Example: Send follow-up email if call was unsuccessful
      if (callRecord.call_successful === "failure" && callRecord.user_id) {
        console.log(
          `📧 Triggering follow-up for unsuccessful call: ${callRecord.conversation_id}`,
        );
        // Implement follow-up logic here
      }

      // Example: Update user state based on evaluation results
      if (callRecord.evaluation_results) {
        const positiveResults = Object.values(callRecord.evaluation_results)
          .filter((result) => result.result === "success").length;

        if (positiveResults > 0 && callRecord.user_id) {
          console.log(
            `✨ Positive call outcome for user: ${callRecord.user_id}`,
          );
          // Update user engagement metrics
        }
      }

      // Example: Trigger CRM integration
      if (
        callRecord.data_collection_results &&
        Object.keys(callRecord.data_collection_results).length > 0
      ) {
        console.log(
          `🔄 Triggering CRM update for conversation: ${callRecord.conversation_id}`,
        );
        // Implement CRM integration here
      }
    } catch (error) {
      console.error("Follow-up actions error:", error);
    }
  }

  /**
   * Process promise-related data extracted from calls
   * This is where the AI magic happens - analyzing promises, excuses, and accountability
   */
  private async processPromiseData(
    dataResults: Record<string, any>,
    userId: string | undefined,
    conversationId: string,
    supabase: any,
  ): Promise<void> {
    if (!userId) return;

    try {
      console.log(
        `🎯 Processing promise data for user ${userId} from call ${conversationId}`,
      );

      // Process promises made during the call
      if (
        dataResults.promises_made || dataResults.new_promises ||
        dataResults.commitments_made
      ) {
        const promises = dataResults.promises_made ||
          dataResults.new_promises || dataResults.commitments_made;
        await this.saveCallPromises(promises, userId, conversationId, supabase);
      }

      // Process promise status updates from the call
      if (
        dataResults.promise_updates || dataResults.promise_completions ||
        dataResults.promise_status
      ) {
        const updates = dataResults.promise_updates ||
          dataResults.promise_completions || dataResults.promise_status;
        await this.updatePromisesFromCall(
          updates,
          userId,
          conversationId,
          supabase,
        );
      }

      // Process excuses given for broken promises
      if (
        dataResults.excuses_given || dataResults.excuses_provided ||
        dataResults.reasons_for_failure
      ) {
        const excuses = dataResults.excuses_given ||
          dataResults.excuses_provided || dataResults.reasons_for_failure;
        await this.processCallExcuses(
          excuses,
          userId,
          conversationId,
          supabase,
        );
      }

      // Process accountability metrics and insights
      if (
        dataResults.accountability_score || dataResults.motivation_level ||
        dataResults.commitment_quality
      ) {
        await this.updateAccountabilityMetrics(
          dataResults,
          userId,
          conversationId,
          supabase,
        );
      }

      // Process psychological insights extracted during call
      if (
        dataResults.psychological_insights || dataResults.behavior_patterns ||
        dataResults.mental_state
      ) {
        await this.updatePsychologicalProfile(dataResults, userId, supabase);
      }
    } catch (error) {
      console.error("Promise data processing error:", error);
    }
  }

  /**
   * Save promises made during calls with AI analysis
   */
  private async saveCallPromises(
    promisesData: any,
    userId: string,
    conversationId: string,
    supabase: any,
  ): Promise<void> {
    try {
      const promises = Array.isArray(promisesData)
        ? promisesData
        : [promisesData];

      for (const promise of promises) {
        if (typeof promise === "string" && promise.trim()) {
          // Create promise record linked to call
          const promiseRecord = {
            user_id: userId,
            promise_text: promise.trim(),
            status: "pending" as const,
            created_during_call: true,
            promise_date: new Date().toISOString().split("T")[0],
            priority_level: this.inferPromisePriority(promise),
            category: await this.categorizePromise(promise),
            promise_order: 0, // Will be updated by frontend
            time_specific: this.detectTimeSpecific(promise),
            target_time: this.extractTargetTime(promise),
          };

          const { data: insertedPromise, error: promiseError } = await supabase
            .from("promises")
            .insert(promiseRecord)
            .select("id")
            .single();

          if (promiseError) {
            console.error("Failed to save call promise:", promiseError);
            continue;
          }

          console.log(
            `✅ Saved promise from call: "${promise.substring(0, 50)}..."`,
          );

          // Generate embedding for promise analysis
          if (insertedPromise?.id) {
          // Memory embeddings removed (deprecated in Super MVP)
          // Promise embedding generation disabled
          }
        }
      }
    } catch (error) {
      console.error("Call promise saving error:", error);
    }
  }

  /**
   * Update promise statuses based on call conversation
   */
  private async updatePromisesFromCall(
    updatesData: any,
    userId: string,
    conversationId: string,
    supabase: any,
  ): Promise<void> {
    try {
      // Handle different formats of promise updates
      const updates = Array.isArray(updatesData)
        ? updatesData
        : typeof updatesData === "object"
        ? Object.entries(updatesData)
        : [];

      for (const update of updates) {
        let promiseId: string;
        let status: string;
        let details: string = "";

        if (Array.isArray(update)) {
          [promiseId, status] = update;
        } else if (typeof update === "object") {
          promiseId = update.promise_id || update.id;
          status = update.status || update.result;
          details = update.details || update.reflection || "";
        } else {
          continue;
        }

        if (promiseId && status) {
          // Update promise status
          const { error: updateError } = await supabase
            .from("promises")
            .update({
              status: this.normalizePromiseStatus(status),
              updated_at: new Date().toISOString(),
            })
            .eq("id", promiseId)
            .eq("user_id", userId);

          if (updateError) {
            console.error("Failed to update promise from call:", updateError);
            continue;
          }

          // Generate reflection embedding if details provided
          if (details) {
          // Memory embeddings removed (deprecated in Super MVP)
          // Reflection embedding generation disabled
          }

          console.log(`✅ Updated promise ${promiseId} to status: ${status}`);
        }
      }
    } catch (error) {
      console.error("Promise update from call error:", error);
    }
  }

  /**
   * Process excuses with AI analysis and pattern recognition
   */
  private async processCallExcuses(
    excusesData: any,
    userId: string,
    conversationId: string,
    supabase: any,
  ): Promise<void> {
    try {
      const excuses = Array.isArray(excusesData) ? excusesData : [excusesData];

      for (const excuse of excuses) {
        if (typeof excuse === "string" && excuse.trim()) {
          const excuseText = excuse.trim();

          // Find related promise if mentioned
          const relatedPromise = await this.findRelatedPromise(
            excuseText,
            userId,
            supabase,
          );

          // Update promise with excuse if found
          if (relatedPromise) {
            await supabase
              .from("promises")
              .update({
                excuse_text: excuseText,
                status: "broken",
                updated_at: new Date().toISOString(),
              })
              .eq("id", relatedPromise.id);
          }

          // Generate excuse embedding for pattern analysis
          // Memory embeddings removed (deprecated in Super MVP)
          // Excuse embedding generation disabled

          console.log(
            `🔍 Processed excuse: "${excuseText.substring(0, 50)}..."`,
          );
        }
      }
    } catch (error) {
      console.error("Call excuse processing error:", error);
    }
  }

  /**
   * Update accountability metrics based on call insights
   */
  private async updateAccountabilityMetrics(
    dataResults: Record<string, any>,
    userId: string,
    conversationId: string,
    supabase: any,
  ): Promise<void> {
    try {
      const metrics = {
        accountability_score: dataResults.accountability_score,
        motivation_level: dataResults.motivation_level,
        commitment_quality: dataResults.commitment_quality,
        honesty_assessment: dataResults.honesty_assessment,
        follow_through_likelihood: dataResults.follow_through_likelihood,
      };

      // Update or create identity status record
      const { error } = await supabase
        .from("identity_status")
        .upsert({
          user_id: userId,
          ...metrics,
          last_updated: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) {
        console.error("Failed to update accountability metrics:", error);
      } else {
        console.log(`📊 Updated accountability metrics for user ${userId}`);
      }
    } catch (error) {
      console.error("Accountability metrics update error:", error);
    }
  }

  /**
   * Update psychological profile based on call analysis
   */
  private async updatePsychologicalProfile(
    dataResults: Record<string, any>,
    userId: string,
    supabase: any,
  ): Promise<void> {
    try {
      const profileUpdates = {
        empty_excuse: dataResults.primary_excuse,
        procrastination: dataResults.procrastination_score,
        self_trust: dataResults.self_trust_level,
        consistency: dataResults.consistency_rating,
      };

      // Update identity record with new insights
      const { error } = await supabase
        .from("identity")
        .update({
          ...profileUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to update psychological profile:", error);
      } else {
        console.log(`🧠 Updated psychological profile for user ${userId}`);
      }
    } catch (error) {
      console.error("Psychological profile update error:", error);
    }
  }

  // Helper methods for promise analysis
  private inferPromisePriority(
    promiseText: string,
  ): "low" | "medium" | "high" | "critical" {
    const urgentWords = [
      "urgent",
      "critical",
      "important",
      "must",
      "deadline",
      "asap",
    ];
    const highWords = ["today", "tomorrow", "this week", "soon"];

    const lowerText = promiseText.toLowerCase();

    if (urgentWords.some((word) => lowerText.includes(word))) return "critical";
    if (highWords.some((word) => lowerText.includes(word))) return "high";
    if (lowerText.includes("eventually") || lowerText.includes("someday")) {
      return "low";
    }

    return "medium";
  }

  private async categorizePromise(promiseText: string): Promise<string> {
    // Simple categorization - could be enhanced with AI
    const categories = {
      health: ["exercise", "workout", "diet", "health", "sleep", "medical"],
      work: ["work", "job", "career", "business", "meeting", "project"],
      personal: ["family", "relationship", "friend", "personal", "hobby"],
      financial: [
        "money",
        "budget",
        "investment",
        "debt",
        "savings",
        "financial",
      ],
      learning: ["learn", "study", "course", "book", "skill", "education"],
    };

    const lowerText = promiseText.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return category;
      }
    }

    return "general";
  }

  private detectTimeSpecific(promiseText: string): boolean {
    const timePatterns = [
      /\d{1,2}:\d{2}/, // 5:30, 10:45
      /\d{1,2}(am|pm)/, // 5pm, 10am
      /by \d/, // by 5
      /at \d/, // at 6
      /\b(morning|afternoon|evening|night)\b/,
    ];

    return timePatterns.some((pattern) =>
      pattern.test(promiseText.toLowerCase())
    );
  }

  private extractTargetTime(promiseText: string): string | null {
    const timeMatch = promiseText.match(/(\d{1,2}:\d{2}|\d{1,2}(am|pm))/i);
    return timeMatch ? timeMatch[0] : null;
  }

  private normalizePromiseStatus(
    status: string,
  ): "pending" | "kept" | "broken" {
    const lowerStatus = status.toLowerCase();
    if (
      lowerStatus.includes("complete") || lowerStatus.includes("done") ||
      lowerStatus.includes("kept")
    ) {
      return "kept";
    }
    if (
      lowerStatus.includes("broken") || lowerStatus.includes("failed") ||
      lowerStatus.includes("missed")
    ) {
      return "broken";
    }
    return "pending";
  }

  private async findRelatedPromise(
    excuseText: string,
    userId: string,
    supabase: any,
  ): Promise<any> {
    try {
      // Find recent pending promises for this user
      const { data: promises } = await supabase
        .from("promises")
        .select("id, promise_text")
        .eq("user_id", userId)
        .eq("status", "pending")
        .gte(
          "promise_date",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split(
            "T",
          )[0],
        )
        .order("created_at", { ascending: false });

      // Simple text matching - could be enhanced with embeddings
      if (promises && promises.length > 0) {
        return promises[0]; // Return most recent for now
      }
    } catch (error) {
      console.error("Error finding related promise:", error);
    }
    return null;
  }

  private inferDataType(value: any): string {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") {
      return Number.isInteger(value) ? "integer" : "number";
    }
    if (typeof value === "string") return "string";
    if (typeof value === "object") return "object";
    return "unknown";
  }
}

/**
 * Factory function for creating ElevenLabs webhook handler
 */
export function createElevenLabsWebhookHandler(
  env: ElevenLabsWebhookEnv,
): ElevenLabsWebhookHandler {
  return new ElevenLabsWebhookHandler(env);
}
