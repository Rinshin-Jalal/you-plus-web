/**
 * Handler: POST /tool/detect-breakthrough-moments
 *
 * Finds past breakthrough moments for positive reinforcement.
 *
 * Request body:
 *   - userId: string
 *   - currentChallenge: string
 *
 * Response:
 *   - success: boolean
 *   - breakthroughAnalysis: object
 *   - motivationScript: string
 *   - reinforcementTechnique: string
 *   - message: string
 */
import { Context } from "hono";
export declare const postToolDetectBreakthroughMoments: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    breakthroughAnalysis: {
        hasSimilarBreakthroughs: boolean;
        relevantMoments: any;
        successPattern: string;
        confidenceBooster: string;
        lastSuccess: any;
    };
    motivationScript: string;
    reinforcementTechnique: string;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
