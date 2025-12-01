/**
 * Prompt Engine - Single File Simplified Architecture
 *
 * PURPOSE: Generate "Future You" accountability prompts for daily calls.
 * ARCHITECTURE: Flat, single-file service. No registries, no complex templates.
 */
import { Identity, TransmissionMood, UserContext } from "@/types/database";
import { Env } from "@/types/environment";
export interface PromptContext {
    userContext: UserContext;
    callType: string;
    tone: TransmissionMood;
}
export interface CallModeResult {
    firstMessage: string;
    systemPrompt: string;
}
declare class IntelligenceService {
    static build(identity: Identity | null, userContext: UserContext): string;
}
export declare class PromptService {
    /**
     * Generate the Daily Reckoning prompt
     */
    static generatePrompt(userContext: UserContext, tone: TransmissionMood): CallModeResult;
    /**
     * Helper to get a consequence message (used by tools)
     */
    static getConsequenceMessage(isHarsh: boolean): string;
}
/**
 * Main entry point wrapper
 */
export declare function getPromptForCall(callType: string, userContext: UserContext, tone: TransmissionMood, env: Env): Promise<CallModeResult>;
export { IntelligenceService };
