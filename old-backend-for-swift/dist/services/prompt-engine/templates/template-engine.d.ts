/**
 * Simplified Template Engine
 *
 * Streamlined template engine that generates AI prompts using direct Identity table access.
 * No complex adapters or optimization layers - just pure Identity data enhancement.
 *
 * Key Features:
 * - Direct Identity table field access
 * - Simplified prompt generation
 * - Identity data enhancement integration
 * - Performance monitoring for the simplified system
 *
 * NEW: Works directly with Identity table - no legacy format conversions!
 */
import { TransmissionMood, UserContext } from "@/types/database";
import { CallModeResult } from "../types";
import { CALL_CONFIGURATIONS } from "./call-configs";
interface TemplateMetrics {
    tokenCount: number;
    generationTime: number;
    intelligenceRelevance: number;
    compressionRatio: number;
}
export declare class OptimizedTemplateEngine {
    private static metrics;
    /**
     * Generate optimized call prompt using template system
     *
     * @param callType Type of call (first, morning, evening, etc.)
     * @param userContext Complete user context and behavioral data
     * @param tone AI personality tone for this call
     * @returns Optimized CallModeResult with minimal tokens
     */
    static generateCall(callType: keyof typeof CALL_CONFIGURATIONS, userContext: UserContext, tone: TransmissionMood): CallModeResult;
    /**
     * Generate call with custom configuration override
     */
    static generateCustomCall(callType: keyof typeof CALL_CONFIGURATIONS, userContext: UserContext, tone: TransmissionMood, overrides: {
        customOpener?: string;
        additionalGoals?: string[];
        toolSetOverride?: "basic" | "commitment_extraction" | "consequence_delivery";
        forceDetailedIntelligence?: boolean;
    }): CallModeResult;
    /**
     * Get performance metrics for optimization analysis
     */
    static getMetrics(): TemplateMetrics[];
    /**
     * Get average metrics by call type
     */
    static getAverageMetrics(callType?: string): Partial<TemplateMetrics>;
    /**
     * Clear metrics (for testing or reset)
     */
    static clearMetrics(): void;
    private static getCallDescription;
    private static getCallDuration;
    private static getToolDescription;
    private static generateSimpleOpener;
    private static estimateTokenCount;
    private static calculateRelevanceScore;
    private static calculateCompressionRatio;
}
export declare class TemplatePerformanceMonitor {
    static logMetrics(): void;
    static getOptimizationReport(): string;
}
export {};
