/**
 * Handler: POST /tool/analyze-excuse-pattern
 *
 * Detects smart excuse patterns for user confrontation.
 *
 * Request body:
 *   - userId: string
 *   - currentExcuse: string
 *
 * Response:
 *   - success: boolean
 *   - excuseAnalysis: object
 *   - confrontationScript: string
 *   - message: string
 */
import { Context } from "hono";
export declare const postToolAnalyzeExcusePattern: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    excuseAnalysis: {
        isRepeatedPattern: boolean;
        timesPreviouslyUsed: any;
        severity: string;
        similarExcuses: any;
        patternCategory: string;
        confrontationStrength: string;
        lastUsed: any;
    };
    confrontationScript: string;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
