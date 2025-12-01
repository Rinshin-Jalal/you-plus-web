import { Env } from "@/index";
/**
 * 🌙 Nightly Pattern Profile Updater (scaffold)
 * For each active user, compute a compact pattern profile and upsert to identity_status
 */
export declare function updateNightlyPatternProfiles(env: Env): Promise<void>;
/**
 * 🔍 Detect Behavioral Patterns Across Call History
 *
 * Advanced pattern recognition that analyzes call transcripts over time to
 * identify recurring behavioral themes, psychological patterns, and evolution
 * of user behavior. Powers predictive accountability interventions.
 */
export declare function detectBehavioralPatterns(userId: string, env: Env): Promise<{
    success: boolean;
    behavioralPatterns: {
        recurringExcuses: Array<{
            pattern: string;
            frequency: number;
            lastSeen: string;
        }>;
        triggerEvolution: Array<{
            trigger: string;
            trend: "increasing" | "decreasing" | "stable" | "emerging";
        }>;
        breakthroughCatalysts: Array<{
            catalyst: string;
            successRate: number;
        }>;
        emotionalPatterns: Array<{
            emotion: string;
            frequency: number;
            context: string[];
        }>;
        languageEvolution: {
            confidenceLevel: "increasing" | "decreasing" | "stable";
            vocabularyComplexity: "increasing" | "decreasing" | "stable";
            selfAwarenessIndicators: string[];
        };
    };
    insights: string[];
    recommendations: string[];
    error?: string;
}>;
/**
 * 📊 Comprehensive Call Success Analysis Engine
 *
 * Analyzes call outcomes using multiple data points from the calls table to provide
 * intelligent insights into user behavior patterns, accountability effectiveness,
 * and areas for improvement. Powers smart IdentityStatus updates.
 */
export declare function analyzeCallSuccess(userId: string, env: Env): Promise<{
    success: boolean;
    callAnalysis: {
        totalCalls: number;
        successRate: number;
        recentTrend: "improving" | "declining" | "stable";
        averageCallDuration: number;
        mostEffectiveTone: string;
        psychologicalInsights: {
            excuseFrequency: number;
            breakthroughMoments: number;
            commitmentsMade: number;
            triggerPatternsIdentified: string[];
        };
        recommendedActions: string[];
    };
    error?: string;
}>;
/**
 * 📋 Track User Promise Patterns with Call Integration
 *
 * Analyzes UserPromise data and correlates it with call outcomes to provide
 * intelligent insights into promise-making patterns, success rates, and
 * behavioral trends. Powers the smart accountability system.
 */
export declare function trackUserPromisePatterns(userId: string, env: Env): Promise<{
    success: boolean;
    promiseAnalysis: {
        totalPromises: number;
        successRate: number;
        recentTrend: "improving" | "declining" | "stable";
        promiseTypes: Record<string, {
            total: number;
            kept: number;
            broken: number;
        }>;
        callCorrelation: {
            promisesAfterSuccessfulCalls: number;
            promisesAfterFailedCalls: number;
            callSuccessToPromiseKeeping: number;
        };
        behavioralInsights: {
            mostReliablePromiseType: string;
            leastReliablePromiseType: string;
            commonFailureReasons: string[];
            timingPatterns: string[];
        };
        recommendations: string[];
    };
    error?: string;
}>;
/**
 * 🔗 Correlate Identity Patterns with Real Call Behaviors
 *
 * Revolutionary integration that compares static identity data (onboarding baseline)
 * with dynamic call patterns to identify consistency, evolution, and areas where
 * real behavior differs from stated identity. Powers hyper-personalized accountability.
 */
export declare function correlateIdentityWithCalls(userId: string, env: Env): Promise<{
    success: boolean;
    correlation: {
        identityConsistency: {
            score: number;
            consistentAreas: string[];
            inconsistentAreas: string[];
        };
        behavioralEvolution: {
            growthIndicators: string[];
            regressionIndicators: string[];
            newPatternsDiscovered: string[];
        };
        hiddenPatterns: {
            callOnlyInsights: string[];
            identityGaps: string[];
        };
        contradictions: {
            majorContradictions: string[];
            minorContradictions: string[];
        };
    };
    recommendations: string[];
    identityUpdateSuggestions: string[];
    error?: string;
}>;
