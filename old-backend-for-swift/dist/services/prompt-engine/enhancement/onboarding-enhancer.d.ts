import { Identity } from "@/types/database";
/**
 * Enhance system prompt with Identity data
 * This adds weaponized personal data for devastating accountability
 */
export declare function enhancePromptWithOnboardingData(basePrompt: string, identity: Partial<Identity>): string;
/**
 * Enhance first message with Identity data
 */
export declare function enhanceFirstMessageWithOnboardingData(baseMessage: string, identity: Partial<Identity>, callType: string): string;
