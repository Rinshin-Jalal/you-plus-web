/**
 * Handler: POST /tool/analyze-behavioral-patterns
 *
 * Performs advanced behavioral pattern analysis for a user.
 *
 * Request body:
 *   - userId: string
 *
 * Response:
 *   - success: boolean
 *   - behavioralAnalysis: object | null
 *   - message: string
 *   - details?: string
 */
import { Context } from "hono";
export declare const postToolAnalyzeBehavioralPatterns: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    behavioralAnalysis: {
        recurringExcuses: {
            pattern: string;
            frequency: number;
            lastSeen: string;
        }[];
        triggerEvolution: {
            trigger: string;
            trend: "increasing" | "decreasing" | "stable" | "emerging";
        }[];
        breakthroughCatalysts: {
            catalyst: string;
            successRate: number;
        }[];
        emotionalPatterns: {
            emotion: string;
            frequency: number;
            context: string[];
        }[];
        languageEvolution: {
            confidenceLevel: "increasing" | "decreasing" | "stable";
            vocabularyComplexity: "increasing" | "decreasing" | "stable";
            selfAwarenessIndicators: string[];
        };
        aiInsights: string[];
        recommendedActions: string[];
    } | null;
    message: string;
    details: string | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
