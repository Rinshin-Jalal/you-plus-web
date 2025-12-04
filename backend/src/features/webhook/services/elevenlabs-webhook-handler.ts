import { createSupabaseClient } from "@/features/core/utils/database";
import {
  AudioWebhookData,
  ElevenLabsAudioRecord,
  ElevenLabsWebhookEvent,
  EvaluationResult,
  TranscriptionWebhookData,
} from "@/types/elevenlabs";
import { generateAudioFileName, uploadAudioToR2 } from "@/features/voice/services/r2-upload";
import { Env } from "@/index";
import crypto from "node:crypto";
import { syncIdentityStatus } from "@/features/identity/utils/identity-status-sync";
import { CallAnalytics, CallMood } from "@/types/database";

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
   * Stores data in call_analytics table (replaces old calls table)
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

      // Derive call type from dynamic variables when available
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

      // Map ElevenLabs call_successful to our CallOutcome type
      const callOutcome = data.analysis.call_successful === "success" 
        ? "success" 
        : data.analysis.call_successful === "failure" 
          ? "failure" 
          : "unknown";

      // Prepare call analytics record (replaces old calls table)
      const callAnalyticsRecord: Partial<CallAnalytics> = {
        user_id: userId,
        call_type: resolvedCallType,
        mood: this.inferMoodFromTranscript(data.transcript) as CallMood,
        call_duration_seconds: data.metadata.call_duration_secs,
        call_quality_score: this.calculateCallQualityScore(data),
        
        // External service tracking
        conversation_id: data.conversation_id,
        source: "elevenlabs",
        
        // Recording and transcript
        audio_url: "", // Updated by audio webhook
        transcript_json: data.transcript,
        transcript_summary: data.analysis.transcript_summary,
        
        // Timestamps
        start_time: new Date(data.metadata.start_time_unix_secs * 1000).toISOString(),
        end_time: new Date(
          (data.metadata.start_time_unix_secs + data.metadata.call_duration_secs) * 1000
        ).toISOString(),
        
        // Outcome
        call_successful: callOutcome,
        cost_cents: Math.round(data.metadata.cost),
        
        // Initialize arrays
        sentiment_trajectory: [],
        excuses_detected: [],
        quotes_captured: [],
        
        // Default values
        commitment_is_specific: false,
        is_retry: false,
        retry_attempt_number: 0,
        acknowledged: false,
      };

      // Upsert into call_analytics by conversation_id
      const { data: insertedRecord, error: callError } = await supabase
        .from("call_analytics")
        .upsert(callAnalyticsRecord, { onConflict: "conversation_id" })
        .select("id")
        .single();

      if (callError) {
        console.error("Failed to store call analytics record:", callError);
        return { success: false, error: "Database storage failed" };
      }

      const callAnalyticsId = insertedRecord?.id;

      if (callAnalyticsId) {
        // Process success evaluation results
        await this.processEvaluationResults(
          callAnalyticsId,
          data.conversation_id,
          data.analysis.evaluation_criteria_results,
          supabase,
        );

        // Process data collection results (extracts commitments, excuses, quotes)
        await this.processDataCollection(
          callAnalyticsId,
          data.conversation_id,
          data.analysis.data_collection_results,
          userId,
          supabase,
        );
      }

      // Trigger any follow-up actions based on call results
      await this.triggerFollowUpActions(userId, callOutcome, data.conversation_id);

      // Sync identity status after successful calls
      if (userId && callOutcome === "success") {
        try {
          await syncIdentityStatus(userId, this.env);
          console.log(`📊 Identity status synced for user ${userId}`);
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
      const arrayBuffer = audioBuffer.buffer.slice(
        audioBuffer.byteOffset, 
        audioBuffer.byteOffset + audioBuffer.byteLength
      );
      const r2Upload = await uploadAudioToR2(
        this.env,
        arrayBuffer,
        fileName,
        "audio/mpeg",
      );

      // Update call_analytics table with audio URL
      const audioUrl = r2Upload.success ? r2Upload.cloudUrl : "";

      if (audioUrl) {
        const { error: updateError } = await supabase
          .from("call_analytics")
          .update({ audio_url: audioUrl })
          .eq("conversation_id", data.conversation_id);

        if (updateError) {
          console.error(
            "Failed to update call_analytics with audio URL:",
            updateError,
          );
        }
      }

      // Get the call analytics record ID for audio table
      const { data: callRecord, error: callError } = await supabase
        .from("call_analytics")
        .select("id")
        .eq("conversation_id", data.conversation_id)
        .single();

      if (callError || !callRecord) {
        console.error("Failed to find call_analytics record for audio:", callError);
        return { success: false, error: "Call analytics record not found" };
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
    callAnalyticsId: string,
    conversationId: string,
    evaluationResults: Record<string, EvaluationResult>,
    supabase: any,
  ): Promise<void> {
    try {
      // Store individual evaluation results for detailed analysis
      const evaluationRecords = Object.entries(evaluationResults).map((
        [criteriaId, result],
      ) => ({
        call_recording_id: callAnalyticsId,
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
   * Stores commitments in call_analytics, excuses in excuse_patterns
   */
  private async processDataCollection(
    callAnalyticsId: string,
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
        call_recording_id: callAnalyticsId,
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

      // Process commitments - store in call_analytics and call_memory
      await this.processCommitmentData(
        callAnalyticsId,
        dataCollectionResults,
        userId,
        supabase,
      );

      // Process excuses - store in excuse_patterns table
      await this.processExcuseData(
        callAnalyticsId,
        conversationId,
        dataCollectionResults,
        userId,
        supabase,
      );

      // Process quotes - store in call_analytics.quotes_captured
      await this.processQuotesData(
        callAnalyticsId,
        dataCollectionResults,
        supabase,
      );
    } catch (error) {
      console.error("Data collection processing error:", error);
    }
  }

  /**
   * Process commitment data from calls
   * Updates call_analytics and call_memory tables
   */
  private async processCommitmentData(
    callAnalyticsId: string,
    dataResults: Record<string, any>,
    userId: string | undefined,
    supabase: any,
  ): Promise<void> {
    if (!userId) return;

    try {
      // Extract commitment from various possible field names
      const commitment = 
        dataResults.commitments_made ||
        dataResults.new_commitments ||
        dataResults.tomorrow_commitment ||
        dataResults.promises_made;

      if (!commitment) return;

      const commitmentText = Array.isArray(commitment) 
        ? commitment[0] 
        : typeof commitment === "string" 
          ? commitment 
          : null;

      if (!commitmentText) return;

      // Extract commitment time if specified
      const commitmentTime = 
        dataResults.commitment_time ||
        this.extractTargetTime(commitmentText);

      const isSpecific = this.detectTimeSpecific(commitmentText);

      // Update call_analytics with commitment
      const { error: analyticsError } = await supabase
        .from("call_analytics")
        .update({
          tomorrow_commitment: commitmentText,
          commitment_time: commitmentTime,
          commitment_is_specific: isSpecific,
        })
        .eq("id", callAnalyticsId);

      if (analyticsError) {
        console.error("Failed to update call_analytics with commitment:", analyticsError);
      }

      // Update call_memory with last commitment
      const { error: memoryError } = await supabase
        .from("call_memory")
        .upsert({
          user_id: userId,
          last_commitment: commitmentText,
          last_commitment_time: commitmentTime,
          last_commitment_specific: isSpecific,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (memoryError) {
        console.error("Failed to update call_memory with commitment:", memoryError);
      } else {
        console.log(`✅ Saved commitment: "${commitmentText.substring(0, 50)}..."`);
      }
    } catch (error) {
      console.error("Commitment data processing error:", error);
    }
  }

  /**
   * Process excuse data from calls
   * Stores in excuse_patterns table for pattern callouts
   */
  private async processExcuseData(
    callAnalyticsId: string,
    conversationId: string,
    dataResults: Record<string, any>,
    userId: string | undefined,
    supabase: any,
  ): Promise<void> {
    if (!userId) return;

    try {
      const excusesData = 
        dataResults.excuses_given ||
        dataResults.excuses_provided ||
        dataResults.reasons_for_failure;

      if (!excusesData) return;

      const excuses = Array.isArray(excusesData) ? excusesData : [excusesData];
      const excusesDetected: Array<{ excuse: string; pattern: string; confidence: number }> = [];

      // Get user's favorite excuse for matching
      const { data: identity } = await supabase
        .from("identity")
        .select("onboarding_context")
        .eq("user_id", userId)
        .single();

      const favoriteExcuse = identity?.onboarding_context?.favorite_excuse || null;

      // Get current streak for context
      const { data: status } = await supabase
        .from("status")
        .select("current_streak_days")
        .eq("user_id", userId)
        .single();

      const currentStreak = status?.current_streak_days || 0;

      for (const excuse of excuses) {
        if (typeof excuse === "string" && excuse.trim()) {
          const excuseText = excuse.trim();
          const pattern = this.categorizeExcuse(excuseText);
          const matchesFavorite = this.matchesFavoriteExcuse(excuseText, favoriteExcuse);
          const confidence = this.calculateExcuseConfidence(excuseText);

          // Store in excuse_patterns table
          const { error } = await supabase
            .from("excuse_patterns")
            .insert({
              user_id: userId,
              excuse_text: excuseText,
              excuse_pattern: pattern,
              matches_favorite: matchesFavorite,
              confidence: confidence,
              streak_day: currentStreak,
              call_type: dataResults.call_type || "evening",
              was_called_out: false,
            });

          if (error) {
            console.error("Failed to store excuse pattern:", error);
          } else {
            console.log(`🔍 Stored excuse pattern: "${pattern}" for "${excuseText.substring(0, 30)}..."`);
          }

          excusesDetected.push({
            excuse: excuseText,
            pattern: pattern,
            confidence: confidence,
          });
        }
      }

      // Update call_analytics with excuses_detected array
      if (excusesDetected.length > 0) {
        const { error: updateError } = await supabase
          .from("call_analytics")
          .update({ excuses_detected: excusesDetected })
          .eq("id", callAnalyticsId);

        if (updateError) {
          console.error("Failed to update call_analytics with excuses:", updateError);
        }
      }
    } catch (error) {
      console.error("Excuse data processing error:", error);
    }
  }

  /**
   * Process quotes data from calls
   * Stores in call_analytics.quotes_captured
   */
  private async processQuotesData(
    callAnalyticsId: string,
    dataResults: Record<string, any>,
    supabase: any,
  ): Promise<void> {
    try {
      const quotesData = 
        dataResults.memorable_quotes ||
        dataResults.user_quotes ||
        dataResults.quotes_captured;

      if (!quotesData) return;

      const quotes = Array.isArray(quotesData) ? quotesData : [quotesData];
      const quotesCaptured: Array<{ quote: string; context: string }> = [];

      for (const quote of quotes) {
        if (typeof quote === "string" && quote.trim()) {
          quotesCaptured.push({
            quote: quote.trim(),
            context: "from_call",
          });
        } else if (typeof quote === "object" && quote.quote) {
          quotesCaptured.push({
            quote: quote.quote,
            context: quote.context || "from_call",
          });
        }
      }

      if (quotesCaptured.length > 0) {
        const { error } = await supabase
          .from("call_analytics")
          .update({ quotes_captured: quotesCaptured })
          .eq("id", callAnalyticsId);

        if (error) {
          console.error("Failed to update call_analytics with quotes:", error);
        } else {
          console.log(`✅ Captured ${quotesCaptured.length} quotes`);
        }
      }
    } catch (error) {
      console.error("Quotes data processing error:", error);
    }
  }

  /**
   * Trigger follow-up actions based on call results
   */
  private async triggerFollowUpActions(
    userId: string | undefined,
    callOutcome: string,
    conversationId: string,
  ): Promise<void> {
    try {
      if (callOutcome === "failure" && userId) {
        console.log(
          `📧 Triggering follow-up for unsuccessful call: ${conversationId}`,
        );
        // Implement follow-up logic here (e.g., schedule retry call)
      }

      if (callOutcome === "success" && userId) {
        console.log(
          `✨ Positive call outcome for user: ${userId}`,
        );
        // Update engagement metrics, trigger celebration, etc.
      }
    } catch (error) {
      console.error("Follow-up actions error:", error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Infer mood from transcript
   */
  private inferMoodFromTranscript(transcript: any): string {
    // Simple keyword-based mood detection
    const text = JSON.stringify(transcript).toLowerCase();
    
    if (text.includes("tired") || text.includes("exhausted")) return "tired";
    if (text.includes("excited") || text.includes("pumped") || text.includes("ready")) return "energized";
    if (text.includes("failed") || text.includes("didn't") || text.includes("couldn't")) return "defeated";
    if (text.includes("excuse") || text.includes("but") || text.includes("because")) return "defensive";
    if (text.includes("honest") || text.includes("truth")) return "honest";
    
    return "motivated"; // Default
  }

  /**
   * Calculate call quality score from metadata
   */
  private calculateCallQualityScore(data: TranscriptionWebhookData): number {
    let score = 0.5; // Base score
    
    // Longer calls generally indicate engagement
    if (data.metadata.call_duration_secs > 60) score += 0.1;
    if (data.metadata.call_duration_secs > 180) score += 0.1;
    
    // Successful calls get a boost
    if (data.analysis.call_successful === "success") score += 0.2;
    
    // Evaluation criteria success
    const evaluations = Object.values(data.analysis.evaluation_criteria_results || {});
    const successCount = evaluations.filter(e => e.result === "success").length;
    if (evaluations.length > 0) {
      score += (successCount / evaluations.length) * 0.1;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Categorize an excuse into a pattern
   */
  private categorizeExcuse(excuseText: string): string {
    const lowerText = excuseText.toLowerCase();
    
    if (lowerText.includes("busy") || lowerText.includes("time") || lowerText.includes("schedule")) {
      return "too_busy";
    }
    if (lowerText.includes("tired") || lowerText.includes("exhausted") || lowerText.includes("sleep")) {
      return "too_tired";
    }
    if (lowerText.includes("forgot") || lowerText.includes("remember")) {
      return "forgot";
    }
    if (lowerText.includes("feel") || lowerText.includes("mood") || lowerText.includes("motivation")) {
      return "not_feeling_it";
    }
    if (lowerText.includes("sick") || lowerText.includes("ill") || lowerText.includes("health")) {
      return "health_issue";
    }
    if (lowerText.includes("work") || lowerText.includes("job") || lowerText.includes("office")) {
      return "work_interference";
    }
    if (lowerText.includes("family") || lowerText.includes("friend") || lowerText.includes("social")) {
      return "social_obligation";
    }
    
    return "other";
  }

  /**
   * Check if excuse matches user's stated favorite excuse
   */
  private matchesFavoriteExcuse(excuseText: string, favoriteExcuse: string | null): boolean {
    if (!favoriteExcuse) return false;
    
    const excuseLower = excuseText.toLowerCase();
    const favoriteLower = favoriteExcuse.toLowerCase();
    
    // Check for keyword overlap
    const favoriteWords = favoriteLower.split(/\s+/).filter(w => w.length > 3);
    const matchCount = favoriteWords.filter(word => excuseLower.includes(word)).length;
    
    return matchCount >= 2 || excuseLower.includes(favoriteLower.substring(0, 10));
  }

  /**
   * Calculate confidence score for excuse detection
   */
  private calculateExcuseConfidence(excuseText: string): number {
    // Longer, more detailed excuses are more confident detections
    const wordCount = excuseText.split(/\s+/).length;
    let confidence = 0.5;
    
    if (wordCount > 5) confidence += 0.1;
    if (wordCount > 10) confidence += 0.1;
    if (wordCount > 20) confidence += 0.1;
    
    // Excuses with "but" or "because" are more clearly excuses
    if (excuseText.toLowerCase().includes("but") || excuseText.toLowerCase().includes("because")) {
      confidence += 0.2;
    }
    
    return Math.min(1.0, confidence);
  }

  private detectTimeSpecific(text: string): boolean {
    const timePatterns = [
      /\d{1,2}:\d{2}/, // 5:30, 10:45
      /\d{1,2}(am|pm)/i, // 5pm, 10am
      /by \d/i, // by 5
      /at \d/i, // at 6
      /\b(morning|afternoon|evening|night)\b/i,
    ];

    return timePatterns.some((pattern) => pattern.test(text));
  }

  private extractTargetTime(text: string): string | null {
    const timeMatch = text.match(/(\d{1,2}:\d{2}|\d{1,2}(am|pm))/i);
    return timeMatch ? timeMatch[0] : null;
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
