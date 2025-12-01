/**
 * Handler: POST /tool/deliver-consequence
 *
 * Generates and delivers a personalized consequence script based on user context, identity data, and excuse pattern.
 *
 * Request body:
 *   - userId: string
 *   - excuseText: string
 *   - escalationLevel?: 'standard' | 'harsh' | 'nuclear'
 *
 * Response:
 *   - success: boolean
 *   - consequence: string
 *   - personalizedScript: string
 *   - escalationLevel: string
 *   - patternAnalysis: object
 *   - message: string
 *   - fullResponse: string
 */
import { Context } from "hono";
export declare const postToolDeliverConsequence: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    consequence: string;
    personalizedScript: string;
    escalationLevel: any;
    patternAnalysis: {
        isRepeatedExcuse: boolean;
        timesPreviouslyUsed: any;
        successRate: number;
        severity: string;
    };
    message: string;
    fullResponse: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
