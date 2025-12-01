/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🔥 PSYCHOLOGICAL INTELLIGENCE BUILDER - SUPER MVP
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * Transforms Super MVP identity data into actionable intelligence for AI accountability calls.
 * Uses simplified core fields and onboarding_context JSONB for psychological data.
 *
 * SUPER MVP PHILOSOPHY:
 * - Simple, focused accountability
 * - Core fields + JSONB context
 * - Clear, direct prompts
 * - No bloated psychological weapons
 *
 * ════════════════════════════════════════════════════════════════════════════════
 */
import { Identity, MemoryInsights } from "@/types/database";
/**
 * Builds intelligence profile from Super MVP identity data
 *
 * @param identity - Super MVP identity (12 columns with onboarding_context JSONB)
 * @param memoryInsights - Behavioral patterns from call/interaction history (optional)
 * @returns Formatted intelligence string for prompt injection in AI calls
 */
export declare function buildOnboardingIntelligence(identity: Identity | null, memoryInsights?: MemoryInsights | null): string;
export declare const generateOnboardingIntelligence: typeof buildOnboardingIntelligence;
