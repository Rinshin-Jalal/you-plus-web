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
    name: string;
    daily_commitment: string;
    chosen_path: "hopeful" | "doubtful";
    call_time: string;
    strike_limit: number;
    why_it_matters_audio_url?: string | null;
    cost_of_quitting_audio_url?: string | null;
    commitment_audio_url?: string | null;
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

  private findResponseByDbField(fieldName: string): V3Response | null {
    for (const [stepId, response] of Object.entries(this.responses)) {
      const dbField = response.dbField || response.db_field || [];
      if (dbField.includes(fieldName)) {
        return response;
      }
    }
    return null;
  }

  private extractStringValue(response: V3Response | null): string | null {
    if (!response) return null;

    if (typeof response.value === 'string') {
      return response.value;
    }

    return null;
  }

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

  private async uploadVoiceRecording(
    response: V3Response,
    userId: string,
    filePrefix: string
  ): Promise<string | null> {
    if (!response || !response.value) return null;

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

  private async extractCoreFields(userId: string, userName: string) {
    const identityNameResponse = this.findResponseByDbField('identity_name');
    const name = this.extractStringValue(identityNameResponse) || userName || 'User';

    const dailyCommitmentResponse = this.findResponseByDbField('daily_non_negotiable');
    const daily_commitment = this.extractStringValue(dailyCommitmentResponse) ||
                            'Complete my daily goal';

    const callTimeResponse = this.findResponseByDbField('evening_call_time');
    let call_time = '20:00:00';

    if (callTimeResponse && callTimeResponse.value) {
      const value = callTimeResponse.value;
      if (typeof value === 'string') {
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

    const strikeLimitResponse = this.findResponseByDbField('failure_threshold');
    let strike_limit = 3;

    if (strikeLimitResponse && strikeLimitResponse.value) {
      const value = strikeLimitResponse.value;
      if (typeof value === 'string') {
        const match = value.match(/(\d+)/);
        if (match && match[1]) {
          strike_limit = parseInt(match[1], 10);
        }
      } else if (typeof value === 'number') {
        strike_limit = value;
      }
    }

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

  private async extractVoiceUrls(userId: string) {
    const voiceUrls: {
      why_it_matters_audio_url: string | null;
      cost_of_quitting_audio_url: string | null;
      commitment_audio_url: string | null;
    } = {
      why_it_matters_audio_url: null,
      cost_of_quitting_audio_url: null,
      commitment_audio_url: null
    };

    const voiceCommitmentResponse = this.findResponseByDbField('voice_commitment');
    if (voiceCommitmentResponse) {
      voiceUrls.commitment_audio_url = await this.uploadVoiceRecording(
        voiceCommitmentResponse,
        userId,
        'commitment'
      );
    }

    const fearVersionResponse = this.findResponseByDbField('fear_version');
    if (fearVersionResponse) {
      voiceUrls.cost_of_quitting_audio_url = await this.uploadVoiceRecording(
        fearVersionResponse,
        userId,
        'cost_of_quitting'
      );
    }

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

  private buildOnboardingContext() {
    const context: Record<string, unknown> = {
      permissions: {
        notifications: true,
        calls: true
      },
      completed_at: new Date().toISOString(),
      time_spent_minutes: 0
    };

    const goalResponse = this.findResponseByDbField('identity_goal');
    context.goal = this.extractStringValue(goalResponse) || 'Achieve my goals';

    const fearResponse = this.findResponseByDbField('motivation_fear_intensity');
    const desireResponse = this.findResponseByDbField('motivation_desire_intensity');
    const fearValue = this.extractNumberValue(fearResponse) || 5;
    const desireValue = this.extractNumberValue(desireResponse) || 5;
    context.motivation_level = Math.round((fearValue + desireValue) / 2);

    const quitCounterResponse = this.findResponseByDbField('quit_counter');
    const quitCount = this.extractNumberValue(quitCounterResponse) || 0;
    context.attempt_history = `Failed ${quitCount} times before. Starting fresh.`;

    const favoriteExcuseResponse = this.findResponseByDbField('favorite_excuse');
    context.favorite_excuse = this.extractStringValue(favoriteExcuseResponse);

    const relationshipDamageResponse = this.findResponseByDbField('relationship_damage');
    context.who_disappointed = this.extractStringValue(relationshipDamageResponse);

    const weaknessWindowResponse = this.findResponseByDbField('weakness_window');
    const weaknessWindow = this.extractStringValue(weaknessWindowResponse);
    if (weaknessWindow) {
      context.quit_pattern = `Usually quits during: ${weaknessWindow}`;
    }

    const fearVersionResponse = this.findResponseByDbField('fear_version');
    context.future_if_no_change = this.extractStringValue(fearVersionResponse) ||
                                   'Someone who wasted their potential';

    const externalJudgeResponse = this.findResponseByDbField('external_judge');
    context.witness = this.extractStringValue(externalJudgeResponse);

    context.will_do_this = true;

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

  async extractIdentity(userId: string, userName: string): Promise<IdentityExtractionResult> {
    try {
      console.log(`\n🧬 === V3 IDENTITY EXTRACTION START ===`);
      console.log(`👤 User: ${userId}`);
      console.log(`📊 Total responses: ${Object.keys(this.responses).length}`);

      const coreFields = await this.extractCoreFields(userId, userName);
      console.log(`✅ Core fields extracted:`, coreFields);

      const voiceUrls = await this.extractVoiceUrls(userId);
      console.log(`✅ Voice URLs extracted:`, voiceUrls);

      const onboarding_context = this.buildOnboardingContext();
      console.log(`✅ Onboarding context built with ${Object.keys(onboarding_context).length} fields`);

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
