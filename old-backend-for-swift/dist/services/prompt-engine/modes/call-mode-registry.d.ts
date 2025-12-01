import { TransmissionMood, UserContext } from "@/types/database";
import { CallModeResult } from "../types";
import { Env } from "@/index";
/**
 * Main entry point - automatically routes to correct mode function
 * Includes V3 onboarding data enhancement for advanced personalization
 *
 * NEW: Includes option to use optimized template engine for better performance
 */
export declare function getPromptForCall(callType: string, userContext: UserContext, toneAnalysis: {
    recommended_mood: TransmissionMood;
}, env: Env, useOptimizedEngine?: boolean): Promise<CallModeResult>;
/**
 * Utility function to get all available call modes (useful for debugging and documentation)
 */
export declare function getAvailableCallModes(): string[];
/**
 * Utility function to check if a call mode exists
 */
export declare function isValidCallMode(callType: string): boolean;
