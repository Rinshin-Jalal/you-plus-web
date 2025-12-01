import { ElevenLabsWebhookEvent } from "@/types/elevenlabs";
import { Env } from "@/index";
interface ElevenLabsWebhookEnv extends Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    ELEVENLABS_WEBHOOK_SECRET?: string;
}
export declare class ElevenLabsWebhookHandler {
    private env;
    constructor(env: ElevenLabsWebhookEnv);
    /**
     * Validate HMAC signature from ElevenLabs webhook
     */
    validateSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Process incoming ElevenLabs webhook
     */
    processWebhook(event: ElevenLabsWebhookEvent): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Handle transcription webhook with full conversation data
     */
    private handleTranscriptionWebhook;
    /**
     * Handle audio webhook with base64-encoded audio data and R2 storage
     */
    private handleAudioWebhook;
    /**
     * Process success evaluation results and store detailed metrics
     */
    private processEvaluationResults;
    /**
     * Process data collection results and extract structured information
     */
    private processDataCollection;
    /**
     * Process extracted data for business-specific logic
     */
    private processBusinessData;
    /**
     * Trigger follow-up actions based on call results
     */
    private triggerFollowUpActions;
    /**
     * Process promise-related data extracted from calls
     * This is where the AI magic happens - analyzing promises, excuses, and accountability
     */
    private processPromiseData;
    /**
     * Save promises made during calls with AI analysis
     */
    private saveCallPromises;
    /**
     * Update promise statuses based on call conversation
     */
    private updatePromisesFromCall;
    /**
     * Process excuses with AI analysis and pattern recognition
     */
    private processCallExcuses;
    /**
     * Update accountability metrics based on call insights
     */
    private updateAccountabilityMetrics;
    /**
     * Update psychological profile based on call analysis
     */
    private updatePsychologicalProfile;
    private inferPromisePriority;
    private categorizePromise;
    private detectTimeSpecific;
    private extractTargetTime;
    private normalizePromiseStatus;
    private findRelatedPromise;
    private inferDataType;
}
/**
 * Factory function for creating ElevenLabs webhook handler
 */
export declare function createElevenLabsWebhookHandler(env: ElevenLabsWebhookEnv): ElevenLabsWebhookHandler;
export {};
