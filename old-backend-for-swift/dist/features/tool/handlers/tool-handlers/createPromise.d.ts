/**
 * Handler: POST /tool/create-promise
 *
 * Creates a morning promise and generates its embedding.
 *
 * Request body:
 *   - userId: string
 *   - promiseText: string
 *
 * Response:
 *   - success: boolean
 *   - promiseId?: string
 *   - message: string
 */
import { Context } from "hono";
export declare const postToolCreatePromise: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    promiseId: string;
    timestamp?: string | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
export declare const postToolCreatePromiseWithValidation: (((c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    promiseId: string;
    timestamp?: string | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>) | ((c: Context, next: import("hono").Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 500, "json">) | undefined>))[];
