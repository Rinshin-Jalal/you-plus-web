/**
 * Prompt Engine Demo Endpoint
 *
 * This endpoint demonstrates the optimized prompt engine in action
 * and provides performance metrics for monitoring the 40% token reduction.
 */
import { Context } from "hono";
/**
 * Demo endpoint to showcase optimized vs legacy prompt generation
 *
 * Usage: GET /prompt-demo/:userId/:callType
 *
 * Returns comparison between optimized and legacy engines
 */
export declare const getPromptEngineDemo: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    demo: string;
    callType: string;
    userId: string;
    performance: {
        tokenReduction: string;
        speedImprovement: string;
        legacyTokens: number;
        optimizedTokens: number;
        tokensSaved: number;
        legacyGenerationTime: string;
        optimizedGenerationTime: string;
    };
    samples: {
        legacy: {
            firstMessage: string;
            systemPromptPreview: string;
            fullLength: number;
        };
        optimized: {
            firstMessage: string;
            systemPromptPreview: string;
            fullLength: number;
        };
    };
    summary: {
        optimizationAchieved: boolean;
        message: string;
        recommendation: string;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * Simplified demo endpoint for quick testing
 *
 * Usage: GET /prompt-demo-quick/:userId
 */
export declare const getQuickDemo: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    performance: {
        generationTime: string;
        estimatedTokens: number;
        optimization: string;
    };
    sample: {
        firstMessage: string;
        systemPromptLength: number;
        tone: import("../../../types/database").BigBruhhTone;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
