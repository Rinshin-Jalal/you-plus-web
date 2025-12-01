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
import { enhancePromptWithOnboardingData, enhanceFirstMessageWithOnboardingData, } from "../enhancement/onboarding-enhancer";
import { CALL_CONFIGURATIONS } from "./call-configs";
// === MAIN TEMPLATE ENGINE ===
export class OptimizedTemplateEngine {
    static metrics = new Map();
    /**
     * Generate optimized call prompt using template system
     *
     * @param callType Type of call (first, morning, evening, etc.)
     * @param userContext Complete user context and behavioral data
     * @param tone AI personality tone for this call
     * @returns Optimized CallModeResult with minimal tokens
     */
    static generateCall(callType, userContext, tone) {
        const startTime = performance.now();
        // Get call configuration
        const callConfig = CALL_CONFIGURATIONS[callType];
        if (!callConfig) {
            throw new Error(`Unknown call type: ${callType}`);
        }
        const { user, identity } = userContext;
        const userName = identity?.name || user?.name || "You";
        const bigBruhName = "BigBruh"; // Always use "BigBruh" as the BigBruh name
        // Generate optimized opener with Identity enhancement
        let firstMessage = this.generateSimpleOpener(userContext, tone);
        if (userContext.identity) {
            firstMessage = enhanceFirstMessageWithOnboardingData(firstMessage, userContext.identity, callType);
        }
        // Build optimized system prompt with Identity enhancement
        let systemPrompt = `
You are ${bigBruhName}. Not their friend. You're their older brother who's completely fed up with their excuses and failures.

## Environment
${callType} call - ${this.getCallDescription(callType)}
User: ${userName}
Current streak: ${userContext.identityStatus?.current_streak_days || 0} days
Today's promise: ${userContext.todayPromises?.[0]?.promise_text || "None set"}

## Goals
${callConfig.goals.join("\n- ")}

## Tools Available
${this.getToolDescription(callConfig.toolSet)}

## Guardrails
- Never comfort or encourage excuses
- Always demand binary accountability
- Use their data against them when they lie
- Cut off ALL excuses with "NAH" or "Stop"
- Reference exact numbers and patterns
- Strategic pauses after accusations
`;
        // Add Identity intelligence directly
        if (userContext.identity) {
            systemPrompt +=
                "\n" + enhancePromptWithOnboardingData("", userContext.identity);
        }
        // Calculate metrics
        const generationTime = performance.now() - startTime;
        const tokenCount = this.estimateTokenCount(systemPrompt + firstMessage);
        this.metrics.set(`${callType}-${Date.now()}`, {
            tokenCount,
            generationTime,
            intelligenceRelevance: this.calculateRelevanceScore(userContext, callType),
            compressionRatio: this.calculateCompressionRatio(callType, tokenCount),
        });
        return {
            firstMessage,
            systemPrompt,
        };
    }
    /**
     * Generate call with custom configuration override
     */
    static generateCustomCall(callType, userContext, tone, overrides) {
        const baseResult = this.generateCall(callType, userContext, tone);
        // Apply overrides
        if (overrides.customOpener) {
            baseResult.firstMessage = overrides.customOpener;
            // Re-enhance with Identity data if available
            if (userContext.identity) {
                baseResult.firstMessage = enhanceFirstMessageWithOnboardingData(baseResult.firstMessage, userContext.identity, callType);
            }
        }
        if (overrides.additionalGoals || overrides.toolSetOverride) {
            // Rebuild with overrides using simplified system
            const callConfig = CALL_CONFIGURATIONS[callType];
            const { user, identity } = userContext;
            const userName = identity?.name || user?.name || "You";
            const bigBruhName = "BigBruh"; // Always use "BigBruh" as the BigBruh name
            const goals = [...callConfig.goals, ...(overrides.additionalGoals || [])];
            const toolSet = overrides.toolSetOverride || callConfig.toolSet;
            baseResult.systemPrompt = `
You are ${bigBruhName}. Not their friend. You're their older brother who's completely fed up with their excuses and failures.

## Environment
${callType} call - ${this.getCallDescription(callType)}
User: ${userName}
Current streak: ${userContext.identityStatus?.current_streak_days || 0} days
Today's promise: ${userContext.todayPromises?.[0]?.promise_text || "None set"}

## Goals
${goals.map((goal) => `- ${goal}`).join("\n")}

## Tools Available
${this.getToolDescription(toolSet)}

## Guardrails
- Never comfort or encourage excuses
- Always demand binary accountability
- Use their data against them when they lie
- Cut off ALL excuses with "NAH" or "Stop"
- Reference exact numbers and patterns
- Strategic pauses after accusations
`;
            // Add Identity intelligence directly
            if (userContext.identity) {
                baseResult.systemPrompt +=
                    "\n" + enhancePromptWithOnboardingData("", userContext.identity);
            }
        }
        return baseResult;
    }
    /**
     * Get performance metrics for optimization analysis
     */
    static getMetrics() {
        return Array.from(this.metrics.values());
    }
    /**
     * Get average metrics by call type
     */
    static getAverageMetrics(callType) {
        const relevantMetrics = callType
            ? Array.from(this.metrics.entries())
                .filter(([key]) => key.startsWith(callType))
                .map(([, metrics]) => metrics)
            : Array.from(this.metrics.values());
        if (relevantMetrics.length === 0)
            return {};
        return {
            tokenCount: Math.round(relevantMetrics.reduce((sum, m) => sum + m.tokenCount, 0) /
                relevantMetrics.length),
            generationTime: relevantMetrics.reduce((sum, m) => sum + m.generationTime, 0) /
                relevantMetrics.length,
            intelligenceRelevance: relevantMetrics.reduce((sum, m) => sum + m.intelligenceRelevance, 0) /
                relevantMetrics.length,
            compressionRatio: relevantMetrics.reduce((sum, m) => sum + m.compressionRatio, 0) /
                relevantMetrics.length,
        };
    }
    /**
     * Clear metrics (for testing or reset)
     */
    static clearMetrics() {
        this.metrics.clear();
    }
    // === PRIVATE HELPERS ===
    static getCallDescription(callType) {
        const descriptions = {
            first: "foundation-setting introductory accountability session",
            morning: "commitment extraction to set daily trajectory",
            evening: "accountability assessment and consequence delivery",
            missed: "accountability avoidance intervention",
            apology: "redemption pathway after broken promises",
            emergency: "crisis intervention for destructive patterns",
        };
        return (descriptions[callType] ||
            "accountability session");
    }
    static getCallDuration(callType) {
        const durations = {
            first: "90-120 seconds",
            morning: "60-90 seconds",
            evening: "60-90 seconds",
            missed: "45-60 seconds",
            apology: "60-90 seconds",
            emergency: "120-180 seconds",
        };
        return durations[callType] || "60-90 seconds";
    }
    static getToolDescription(toolSet) {
        const toolDescriptions = {
            basic: "- Binary accountability enforcement\n- Excuse interruption\n- Pattern reference",
            commitment_extraction: "- Promise creation and tracking\n- Binary accountability\n- Excuse analysis",
            consequence_delivery: "- Consequence application\n- Pattern reinforcement\n- Motivation leverage",
        };
        return (toolDescriptions[toolSet] ||
            toolDescriptions.basic);
    }
    static generateSimpleOpener(userContext, tone) {
        const userName = userContext.user?.name || "you";
        const openers = {
            Encouraging: `Yo ${userName}. BigBruh here. Did you do it? YES or NO.`,
            Confrontational: `${userName}. Time to face the truth. Did you keep your promise?`,
            Ruthless: `${userName}. Judgment time. Did you do what you said you'd do?`,
            ColdMirror: `${userName}. Mirror doesn't lie. Did you do it?`,
            Kind: `Hi ${userName}. BigBruh calling. Did you follow through?`,
            Firm: `${userName}. Let's check in. Did you do it?`,
            Ascension: `${userName}. Ascension check. Did you level up today?`,
        };
        return openers[tone] || `Hello ${userName}, did you keep your promise?`;
    }
    static estimateTokenCount(text) {
        // Rough estimation: ~4 characters per token on average
        return Math.round(text.length / 4);
    }
    static calculateRelevanceScore(userContext, callType) {
        // Score based on how much relevant data is available
        const { identity, memoryInsights, recentStreakPattern } = userContext;
        let score = 0;
        // Core identity data (40% weight - Super MVP)
        if (identity?.name)
            score += 0.1;
        if (identity?.daily_commitment)
            score += 0.1;
        const context = identity?.onboarding_context;
        if (context?.goal)
            score += 0.1;
        if (context?.motivation_level)
            score += 0.1;
        // Behavioral data (40% weight)
        if (memoryInsights?.topExcuseCount7d)
            score += 0.2;
        if (recentStreakPattern && recentStreakPattern.length > 0)
            score += 0.2;
        // Call-specific data (20% weight)
        if (callType === "morning" && userContext.todayPromises?.length) {
            score += 0.1;
        }
        if (callType === "evening" && userContext.yesterdayPromises?.length) {
            score += 0.1;
        }
        return Math.min(score, 1.0);
    }
    static calculateCompressionRatio(callType, tokenCount) {
        // Estimated original token counts before optimization
        const originalEstimates = {
            first: 4500,
            morning: 3200,
            evening: 3200,
            missed: 2800,
            apology: 2600,
            emergency: 3800,
        };
        const originalCount = originalEstimates[callType] || 3000;
        return 1 - tokenCount / originalCount;
    }
}
// === PERFORMANCE MONITORING ===
export class TemplatePerformanceMonitor {
    static logMetrics() {
        const metrics = OptimizedTemplateEngine.getMetrics();
        if (metrics.length === 0)
            return;
        console.log("=== Template Engine Performance ===");
        console.log(`Total calls generated: ${metrics.length}`);
        console.log(`Average token count: ${Math.round(metrics.reduce((sum, m) => sum + m.tokenCount, 0) / metrics.length)}`);
        console.log(`Average generation time: ${(metrics.reduce((sum, m) => sum + m.generationTime, 0) / metrics.length).toFixed(2)}ms`);
        console.log(`Average compression ratio: ${((metrics.reduce((sum, m) => sum + m.compressionRatio, 0) /
            metrics.length) *
            100).toFixed(1)}%`);
        console.log(`Average intelligence relevance: ${((metrics.reduce((sum, m) => sum + m.intelligenceRelevance, 0) /
            metrics.length) *
            100).toFixed(1)}%`);
    }
    static getOptimizationReport() {
        const overall = OptimizedTemplateEngine.getAverageMetrics();
        return `
## Template Engine Optimization Report

**Performance Metrics:**
- Average Token Count: ${overall.tokenCount || "N/A"}
- Average Generation Time: ${overall.generationTime?.toFixed(2) || "N/A"}ms  
- Average Compression Ratio: ${((overall.compressionRatio || 0) * 100).toFixed(1)}%
- Intelligence Relevance: ${((overall.intelligenceRelevance || 0) * 100).toFixed(1)}%

**Optimization Achievements:**
- ${((overall.compressionRatio || 0) * 100).toFixed(0)}% reduction in token usage
- Maintained full personalization capability
- Dynamic intelligence loading for efficiency
- Standardized template system for consistency

**Call Type Breakdown:**
${Object.keys(CALL_CONFIGURATIONS)
            .map((type) => {
            const metrics = OptimizedTemplateEngine.getAverageMetrics(type);
            return `- ${type}: ${metrics.tokenCount || "N/A"} tokens (${((metrics.compressionRatio || 0) * 100).toFixed(1)}% compression)`;
        })
            .join("\n")}
`;
    }
}
