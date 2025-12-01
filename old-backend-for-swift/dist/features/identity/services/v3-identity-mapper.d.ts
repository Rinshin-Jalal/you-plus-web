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
interface V3Response {
    type: string;
    value: any;
    timestamp: string;
    voiceUri?: string;
    duration?: number;
    dbField?: string[];
    db_field?: string[];
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
export declare class V3IdentityMapper {
    private responses;
    private env;
    constructor(responses: V3ResponseMap, env: Env);
    /**
     * Find response by dbField name
     */
    private findResponseByDbField;
    /**
     * Extract string value from response
     */
    private extractStringValue;
    /**
     * Extract number value from response
     */
    private extractNumberValue;
    /**
     * Upload voice recording to R2 and return cloud URL
     */
    private uploadVoiceRecording;
    /**
     * Extract core Identity fields from responses
     */
    private extractCoreFields;
    /**
     * Extract and upload voice recordings
     */
    private extractVoiceUrls;
    /**
     * Build onboarding context JSONB from all responses
     */
    private buildOnboardingContext;
    /**
     * Extract complete Identity record from V3 responses
     */
    extractIdentity(userId: string, userName: string): Promise<IdentityExtractionResult>;
}
/**
 * Extract and save Identity from V3 onboarding responses
 */
export declare function extractAndSaveV3Identity(userId: string, userName: string, responses: V3ResponseMap, env: Env): Promise<{
    success: boolean;
    identity?: any;
    error?: string;
}>;
export {};
