/**
 * Handler: POST /tool/complete-promise
 *
 * Completes a user promise and optionally analyzes excuse patterns.
 *
 * Request body:
 *   - userId: string
 *   - promiseId: string
 *   - wasKept: boolean
 *   - excuseText?: string
 *
 * Response:
 *   - success: boolean
 *   - consequenceDelivered: boolean
 *   - excusePattern?: object
 *   - message: string
 */
import { Context } from "hono";
export declare const postToolCompletePromise: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    consequenceDelivered: boolean;
    excusePattern: {
        isRepeatPattern: boolean;
        occurrences: any;
        severity: string;
    } | null;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
