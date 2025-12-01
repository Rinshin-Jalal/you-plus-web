/**
 * Call configuration service
 * Generates LiveKit call configuration with Cartesia voice and Supermemory context
 */
import { Env } from "@/index";
import { CallType, UserContext, BigBruhhTone } from "@/types/database";
import { calculateOptimalTone } from "@/features/call/services/tone-engine";
export interface CallMetadataResult {
    mood: BigBruhhTone;
    callUUID: string;
    cartesiaVoiceId: string;
    supermemoryUserId: string;
    userContext: UserContext;
    toneAnalysis: BigBruhhTone;
}
export interface CallPromptResult {
    prompts: {
        systemPrompt: string;
        firstMessage: string;
    };
}
export interface CallFullConfigResult extends CallMetadataResult, CallPromptResult {
}
export declare function generateCallMetadata(env: Env, userId: string, callType: CallType, callUUID: string): Promise<CallMetadataResult>;
export declare function generateCallPrompts(env: Env, callType: CallType, userContext: UserContext, toneAnalysis: ReturnType<typeof calculateOptimalTone>): Promise<CallPromptResult>;
export declare function generateFullCallConfig(env: Env, userId: string, callType: CallType, callUUID: string): Promise<CallFullConfigResult>;
