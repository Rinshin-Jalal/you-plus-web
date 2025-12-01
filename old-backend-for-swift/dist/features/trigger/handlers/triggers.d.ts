import { Context } from "hono";
/**
 * Trigger a VoIP call for a specific user immediately
 * POST /trigger/user/:userId/:callType
 */
export declare const triggerUserCallAdmin: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    callType: string;
    userId: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * Send immediate VoIP push with custom payload
 * POST /trigger/voip
 * Body: { userId: string, callType: string, message?: string, urgency?: "high" | "medium" | "low" }
 */
export declare const triggerVoipPushAdmin: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    message: string;
    callUUID: string;
    callType: any;
    userId: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * Process scheduled calls
 * POST /trigger/scheduled-calls
 */
export declare const processScheduledCallsAdmin: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        dailyReckoning: {
            processed: number;
            errors: number;
            results: any[];
        };
        firstDay: {
            processed: number;
            errors: number;
            results: any[];
        };
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * Process retry queue
 * POST /trigger/retry-queue
 */
export declare const processRetryQueueAdmin: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * Trigger onboarding call for a specific user
 * POST /trigger/onboarding/:userId
 * Development only - for testing onboarding flow
 */
export declare const triggerOnboardingCallAdmin: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
