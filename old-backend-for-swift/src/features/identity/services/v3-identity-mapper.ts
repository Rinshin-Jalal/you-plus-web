/**
 * V3 Identity Mapper - Super MVP
 *
 * PURPOSE: Map 60-step iOS onboarding responses to Identity table schema
 *
 * FLOW:
 * 1. Receives raw responses from iOS app (step IDs → response data)
 * 2. Maps iOS dbField names to backend Identity schema fields
 * 3. Builds Identity record with:
 *    - Core fields (name, daily_commitment, chosen_path, call_time, strike_limit)
 *    - Voice URLs (uploaded to R2)
 *    - Onboarding context JSONB (all psychological data)
 *
 * iOS dbField → Backend Mapping:
 * - identity_name → name
 * - daily_non_negotiable → daily_commitment
 * - evening_call_time → call_time
 * - failure_threshold → strike_limit
 * - favorite_excuse → onboarding_context.favorite_excuse
 * - identity_goal → onboarding_context.goal
 * - external_judge → onboarding_context.witness
 * ... (see full mapping below)
 */

import { Env } from "@/types/environment";
import { createSupabaseClient } from "@/features/core/utils/database";
import { uploadAudioToR2 } from "@/features/voice/services/r2-upload";

interface V3Response {
  type: string;
  value: any;
  timestamp: string;
  voiceUri?: string;
  duration?: number;
  dbField?: string[];
  db_field?: string[]; // Backend uses db_field instead of dbField
}

interface V3ResponseMap {
  [stepId: string]: V3Response;
}

interface IdentityExtractionResult {
  success: boolean;
  identity?: {
    // Core fields
    name: string;
    daily_commitment: string;
    chosen_path: "hopeful" | "doubtful";
    call_time: string;
    strike_limit: number;

    // Voice URLs
    why_it_matters_audio_url?: string | null;
    cost_of_quitting_audio_url?: string | null;
    commitment_audio_url?: string | null;

    // Onboarding context
    onboarding_context: any;
  };
  error?: string;
}

export class V3IdentityMapper {
  private responses: V3ResponseMap;
  private env: Env;

  constructor(responses: V3ResponseMap, env: Env) {
    this.responses = responses;
    this.env = env;
  }

  /**
   * Find response by dbField name
   */
  private findResponseByDbField(fieldName: string): V3Response | null {
    for (const [stepId, response] of Object.entries(this.responses)) {
      const dbField = response.dbField || response.db_field || [];
      if (dbField.includes(fieldName)) {
        return response;
      }
    }
    return null;
  }

  /**
   * Extract string value from response
   */
  private extractStringValue(response: V3Response | null): string | null {
    if (!response) return null;

    if (typeof response.value === 'string') {
      return response.value;
    }

    return null;
  }

  /**
   * Extract number value from response
   */
  private extractNumberValue(response: V3Response | null): number | null {
    if (!response) return null;

    if (typeof response.value === 'number') {
      return response.value;
    }

    if (typeof response.value === 'string') {
      const parsed = parseFloat(response.value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  /**
   * Upload voice recording to R2 and return cloud URL
   */
  private async uploadVoiceRecording(
    response: V3Response,
    userId: string,
    filePrefix: string
  ): Promise<string | null> {
    if (!response || !response.value) return null;

    // Check if value is base64 audio
    if (typeof response.value === 'string' && response.value.startsWith('data:audio/')) {
      const base64Data = response.value.split(',')[1];
      if (!base64Data) {
        console.warn(`⚠️ Invalid base64 audio data for ${filePrefix}`);
        return null;
      }
      const audioBuffer = Buffer.from(base64Data, 'base64');
      const fileName = `${userId}_${filePrefix}_${Date.now()}.m4a`;

      const uploadResult = await uploadAudioToR2(
        this.env,
        audioBuffer,
        fileName,
        'audio/m4a'
      );

      if (uploadResult.success && uploadResult.cloudUrl) {
        console.log(`✅ Uploaded ${filePrefix}: ${uploadResult.cloudUrl}`);
        return uploadResult.cloudUrl;
      } else {
        console.warn(`⚠️ Failed to upload ${filePrefix}: ${uploadResult.error}`);
        return null;
      }
    }

    return null;
  }

  /**
   * Extract core Identity fields from responses
   */
  private async extractCoreFields(userId: string, userName: string): Promise<any> {
    // NAME: From user auth or identity_name step
    const identityNameResponse = this.findResponseByDbField('identity_name');
    const name = this.extractStringValue(identityNameResponse) || userName || 'User';

    // DAILY COMMITMENT: From daily_non_negotiable step (step 25)
    const dailyCommitmentResponse = this.findResponseByDbField('daily_non_negotiable');
    const daily_commitment = this.extractStringValue(dailyCommitmentResponse) ||
                            'Complete my daily goal';

    // CALL TIME: From evening_call_time step (step 55)
    const callTimeResponse = this.findResponseByDbField('evening_call_time');
    let call_time = '20:00:00'; // Default

    if (callTimeResponse && callTimeResponse.value) {
      const value = callTimeResponse.value;
      if (typeof value === 'string') {
        // Parse "20:30-21:00" format
        if (value.includes('-')) {
          const startTime = value.split('-')[0]?.trim();
          if (startTime) {
            call_time = startTime + ':00';
          }
        } else {
          call_time = value.trim();
          if (!call_time.includes(':')) {
            call_time = call_time + ':00:00';
          } else if (call_time.split(':').length === 2) {
            call_time = call_time + ':00';
          }
        }
      } else if (typeof value === 'object' && value.start) {
        call_time = value.start + ':00';
      }
    }

    // STRIKE LIMIT: From failure_threshold step (step 57)
    const strikeLimitResponse = this.findResponseByDbField('failure_threshold');
    let strike_limit = 3; // Default

    if (strikeLimitResponse && strikeLimitResponse.value) {
      const value = strikeLimitResponse.value;
      if (typeof value === 'string') {
        // Parse "3 strikes" format
        const match = value.match(/(\d+)/);
        if (match && match[1]) {
          strike_limit = parseInt(match[1], 10);
        }
      } else if (typeof value === 'number') {
        strike_limit = value;
      }
    }

    // CHOSEN PATH: Infer from responses (not directly collected in 60-step flow)
    // If user has high motivation and positive language, they're "hopeful"
    // Otherwise, "doubtful"
    const motivationResponse = this.findResponseByDbField('motivation_desire_intensity');
    const motivationLevel = this.extractNumberValue(motivationResponse);
    const chosen_path: "hopeful" | "doubtful" = (motivationLevel && motivationLevel >= 7) ? "hopeful" : "doubtful";

    return {
      name,
      daily_commitment,
      chosen_path,
      call_time,
      strike_limit
    };
  }

  /**
   * Extract and upload voice recordings
   */
  private async extractVoiceUrls(userId: string): Promise<any> {
    const voiceUrls: any = {
      why_it_matters_audio_url: null,
      cost_of_quitting_audio_url: null,
      commitment_audio_url: null
    };

    // Voice commitment (step 2) → commitment_audio_url
    const voiceCommitmentResponse = this.findResponseByDbField('voice_commitment');
    if (voiceCommitmentResponse) {
      voiceUrls.commitment_audio_url = await this.uploadVoiceRecording(
        voiceCommitmentResponse,
        userId,
        'commitment'
      );
    }

    // Fear version (step 18) → cost_of_quitting_audio_url (what you'll become if you quit)
    const fearVersionResponse = this.findResponseByDbField('fear_version');
    if (fearVersionResponse) {
      voiceUrls.cost_of_quitting_audio_url = await this.uploadVoiceRecording(
        fearVersionResponse,
        userId,
        'cost_of_quitting'
      );
    }

    // Identity goal (step 36) → why_it_matters_audio_url (WHO you want to become)
    const identityGoalResponse = this.findResponseByDbField('identity_goal');
    if (identityGoalResponse) {
      voiceUrls.why_it_matters_audio_url = await this.uploadVoiceRecording(
        identityGoalResponse,
        userId,
        'why_it_matters'
      );
    }

    return voiceUrls;
  }

  /**
   * Build onboarding context JSONB from all responses
   */
  private buildOnboardingContext(): any {
    const context: any = {
      permissions: {
        notifications: true, // Assume granted if they completed onboarding
        calls: true
      },
      completed_at: new Date().toISOString(),
      time_spent_minutes: 0 // Could calculate from response timestamps
    };

    // GOAL: From identity_goal (step 36)
    const goalResponse = this.findResponseByDbField('identity_goal');
    context.goal = this.extractStringValue(goalResponse) || 'Achieve my goals';

    // MOTIVATION LEVEL: Average of motivation_fear_intensity and motivation_desire_intensity (step 14)
    const fearResponse = this.findResponseByDbField('motivation_fear_intensity');
    const desireResponse = this.findResponseByDbField('motivation_desire_intensity');
    const fearValue = this.extractNumberValue(fearResponse) || 5;
    const desireValue = this.extractNumberValue(desireResponse) || 5;
    context.motivation_level = Math.round((fearValue + desireValue) / 2);

    // ATTEMPT HISTORY: From quit_counter (step 24)
    const quitCounterResponse = this.findResponseByDbField('quit_counter');
    const quitCount = this.extractNumberValue(quitCounterResponse) || 0;
    context.attempt_history = `Failed ${quitCount} times before. Starting fresh.`;

    // FAVORITE EXCUSE: From favorite_excuse (step 8)
    const favoriteExcuseResponse = this.findResponseByDbField('favorite_excuse');
    context.favorite_excuse = this.extractStringValue(favoriteExcuseResponse);

    // WHO DISAPPOINTED: From relationship_damage (step 19)
    const relationshipDamageResponse = this.findResponseByDbField('relationship_damage');
    context.who_disappointed = this.extractStringValue(relationshipDamageResponse);

    // QUIT PATTERN: From weakness_window (step 11) and quit data
    const weaknessWindowResponse = this.findResponseByDbField('weakness_window');
    const weaknessWindow = this.extractStringValue(weaknessWindowResponse);
    if (weaknessWindow) {
      context.quit_pattern = `Usually quits during: ${weaknessWindow}`;
    }

    // FUTURE IF NO CHANGE: From fear_version (step 18)
    const fearVersionResponse = this.findResponseByDbField('fear_version');
    context.future_if_no_change = this.extractStringValue(fearVersionResponse) ||
                                   'Someone who wasted their potential';

    // WITNESS: From external_judge (step 56)
    const externalJudgeResponse = this.findResponseByDbField('external_judge');
    context.witness = this.extractStringValue(externalJudgeResponse);

    // WILL DO THIS: Always true if they completed onboarding
    context.will_do_this = true;

    // Additional context fields for richer personalization
    const biggestLieResponse = this.findResponseByDbField('biggest_lie');
    if (biggestLieResponse) {
      context.biggest_lie = this.extractStringValue(biggestLieResponse);
    }

    const lastFailureResponse = this.findResponseByDbField('last_failure');
    if (lastFailureResponse) {
      context.last_failure = this.extractStringValue(lastFailureResponse);
    }

    const timeWasterResponse = this.findResponseByDbField('time_waster');
    if (timeWasterResponse) {
      context.time_waster = this.extractStringValue(timeWasterResponse);
    }

    const accountabilityStyleResponse = this.findResponseByDbField('accountability_style');
    if (accountabilityStyleResponse) {
      context.accountability_style = this.extractStringValue(accountabilityStyleResponse);
    }

    const breakingPointResponse = this.findResponseByDbField('breaking_point');
    if (breakingPointResponse) {
      context.breaking_point = this.extractStringValue(breakingPointResponse);
    }

    const emotionalQuitTriggerResponse = this.findResponseByDbField('emotional_quit_trigger');
    if (emotionalQuitTriggerResponse) {
      context.emotional_quit_trigger = this.extractStringValue(emotionalQuitTriggerResponse);
    }

    return context;
  }

  /**
   * Extract complete Identity record from V3 responses
   */
  async extractIdentity(userId: string, userName: string): Promise<IdentityExtractionResult> {
    try {
      console.log(`\n🧬 === V3 IDENTITY EXTRACTION START ===`);
      console.log(`👤 User: ${userId}`);
      console.log(`📊 Total responses: ${Object.keys(this.responses).length}`);

      // Extract core fields
      const coreFields = await this.extractCoreFields(userId, userName);
      console.log(`✅ Core fields extracted:`, coreFields);

      // Extract and upload voice recordings
      const voiceUrls = await this.extractVoiceUrls(userId);
      console.log(`✅ Voice URLs extracted:`, voiceUrls);

      // Build onboarding context
      const onboarding_context = this.buildOnboardingContext();
      console.log(`✅ Onboarding context built with ${Object.keys(onboarding_context).length} fields`);

      // Combine into complete Identity record
      const identity = {
        ...coreFields,
        ...voiceUrls,
        onboarding_context
      };

      console.log(`✅ V3 Identity extraction complete`);
      console.log(`🧬 === V3 IDENTITY EXTRACTION END ===\n`);

      return {
        success: true,
        identity
      };
    } catch (error) {
      console.error(`❌ V3 Identity extraction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Extract and save Identity from V3 onboarding responses
 */
export async function extractAndSaveV3Identity(
  userId: string,
  userName: string,
  responses: V3ResponseMap,
  env: Env
): Promise<{
  success: boolean;
  identity?: any;
  error?: string;
}> {
  const mapper = new V3IdentityMapper(responses, env);
  const extractionResult = await mapper.extractIdentity(userId, userName);

  if (!extractionResult.success || !extractionResult.identity) {
    return {
      success: false,
      error: extractionResult.error || 'Failed to extract identity'
    };
  }

  // Save to database
  const supabase = createSupabaseClient(env);

  const { error: insertError } = await supabase
    .from('identity')
    .insert({
      user_id: userId,
      ...extractionResult.identity
    });

  if (insertError) {
    console.error(`❌ Failed to save identity:`, insertError);
    return {
      success: false,
      error: insertError.message
    };
  }

  console.log(`✅ V3 Identity saved to database`);

  return {
    success: true,
    identity: extractionResult.identity
  };
}
