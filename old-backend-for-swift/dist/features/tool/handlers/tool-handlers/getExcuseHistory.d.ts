/**
 * Handler: POST /tool/get-excuse-history
 *
 * Retrieves recent excuse memories for confrontation suggestions.
 *
 * Request body:
 *   - userId: string
 *   - limit?: number
 *
 * Response:
 *   - success: boolean
 *   - excuses: Array<{ text: string; date: string; timesUsed: number }>
 *   - totalCount: number
 *   - message: string
 *   - confrontationSuggestion?: string
 */
import { Context } from "hono";
export declare function postToolGetExcuseHistory(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    excuses: {
        text: string;
        date: string;
        timesUsed: number;
        growthFactor: number;
    }[];
    totalCount: number;
    excuseTypeCount: number;
    message: string;
    confrontationSuggestion: string | null;
    insights: {
        countsByType: {
            [x: string]: number;
        };
        topExcuseCount7d: number;
        emergingPatterns: {
            sampleText: string;
            recentCount: number;
            baselineCount: number;
            growthFactor: number;
        }[];
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
