/**
 * Optimized Prompt Template System
 *
 * This module provides reusable, token-efficient templates for the AI accountability system.
 * Templates are designed for maximum personalization with minimal token usage.
 *
 * Key Optimizations:
 * - 40% token reduction through template consolidation
 * - Dynamic intelligence injection based on relevance
 * - Standardized tone and tool patterns
 * - Conditional content loading for efficiency
 */
import { Identity, TransmissionMood, UserContext } from "@/types/database";
export interface PromptTemplate {
    personality: string;
    environment: string;
    tone: string;
    goals: string;
    guardrails: string;
    intelligence: string;
    tools: string;
}
export interface OpenerConfig {
    toneVariations: Record<TransmissionMood, string>;
    contextualModifiers?: {
        success?: Record<TransmissionMood, string>;
        failure?: Record<TransmissionMood, string>;
    };
}
export declare const TONE_PERSONALITIES: {
    base: (identity: string, tone: TransmissionMood) => string;
    authority: (identity: string) => string;
    memory: () => string;
    balance: () => string;
};
export declare const ENVIRONMENT_TEMPLATES: {
    voip_call: (userName: string, callContext: string) => string;
    streak_context: (streakDays: number) => string;
    promise_context: (promise?: {
        promise_text: string;
        status: string;
    }) => string;
};
export declare const GOAL_FRAMEWORKS: {
    commitment_extraction: (callType: string, specificGoals: string[]) => string;
    pattern_interruption: (patterns: string[]) => string;
    consequence_delivery: (consequences: string[]) => string;
};
export declare class IntelligenceOptimizer {
    static getRelevantIntelligence(identity: Identity | null, callType: string, userContext: UserContext, relevanceThreshold?: number): string;
    static getBehavioralIntelligence(userContext: UserContext, callType: string, includeFullAnalysis?: boolean): string;
}
export declare const TOOL_SETS: {
    basic: () => string;
    commitment_extraction: () => string;
    consequence_delivery: () => string;
};
export declare class PromptTemplateBuilder {
    private template;
    personality(identity: string, tone: TransmissionMood, callType: string): this;
    environment(userName: string, callType: string, context: any): this;
    tone(toneType: TransmissionMood, duration?: string): this;
    goals(callType: string, specificGoals: string[]): this;
    guardrails(identity: string): this;
    intelligence(userContext: UserContext, callType: string, detailed?: boolean): this;
    tools(toolSet: keyof typeof TOOL_SETS): this;
    build(): string;
}
export declare class OpenerGenerator {
    static generate(config: OpenerConfig, userContext: UserContext, tone: TransmissionMood, callType: string): string;
}
