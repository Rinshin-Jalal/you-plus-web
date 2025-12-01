import { Context } from "hono";
export declare const processedEvents: Map<string, number>;
export declare const RATE_LIMIT_WINDOW = 30000;
/**
 * Handles incoming webhooks from RevenueCat.
 * See: https://www.revenuecat.com/docs/webhooks
 */
export declare const postRevenueCatWebhook: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
