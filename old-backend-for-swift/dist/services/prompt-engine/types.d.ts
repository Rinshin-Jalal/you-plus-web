/**
 * Prompt Engine Type Definitions
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the prompt engine system. These types define the structure for call
 * generation, mode configuration, and result handling.
 */
import { TransmissionMood, UserContext } from "@/types/database";
/**
 * Context object passed to prompt generation functions
 * Contains all the data needed to generate personalized call prompts
 */
export interface PromptContext {
    /** User's behavioral and onboarding data for personalization */
    userContext: UserContext;
    /** Type of call being generated (morning, evening, first, etc.) */
    callType: string;
    /** Tone/mood for the AI personality (Kind, Firm, Ruthless, etc.) */
    tone: TransmissionMood;
}
/**
 * Result object returned by call mode generation functions
 * Contains the complete prompt configuration for an AI call
 */
export interface CallModeResult {
    /** The first message the AI will speak to the user */
    firstMessage: string;
    /** The system prompt that defines the AI's personality and behavior */
    systemPrompt: string;
}
/**
 * Configuration object for defining a call mode
 * This structure allows for flexible creation of different call types
 * with varying personalities, goals, and behaviors
 */
export interface CallModeConfig {
    /** Unique identifier for this call mode */
    modeName: string;
    /** Opening messages for different tones/personalities */
    openers: {
        /** Encouraging, supportive tone */
        Encouraging: string;
        /** Direct, challenging tone */
        Confrontational: string;
        /** Harsh, no-nonsense tone */
        Ruthless: string;
        /** Cold, analytical mirror tone */
        ColdMirror: string;
        /** Legacy: maps to Encouraging */
        Kind: string;
        /** Legacy: maps to Confrontational */
        Firm: string;
        /** Legacy: maps to ColdMirror */
        Ascension: string;
    };
    /** Description of the AI's personality and role */
    personalityDescription: string;
    /** Context about the call environment and situation */
    environmentContext: string;
    /** Optional modifications to apply to the tone */
    toneModifications?: string;
    /** What the AI should accomplish during the call */
    goals: string;
    /** What the AI should never do or say */
    guardrails: string;
    /** Available tools and capabilities for the AI */
    tools: string;
    /** Instructions for how to begin the call */
    closingLine: string;
}
/**
 * Function type for call mode generators
 * Each call mode implements this function to generate its specific prompts
 *
 * @param userContext User's behavioral and onboarding data
 * @param tone The desired tone/personality for this call
 * @returns CallModeResult with the generated prompt
 */
export type CallModeFunction = (userContext: UserContext, tone: TransmissionMood) => CallModeResult;
