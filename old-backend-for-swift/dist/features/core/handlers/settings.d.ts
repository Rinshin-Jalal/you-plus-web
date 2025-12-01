/**
 * Settings (trimmed): eligibility, schedule (GET), subscription status update
 */
import { Context } from "hono";
/**
 * GET /api/calls/eligibility
 */
export declare const getCallEligibility: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    data: {
        eligible: false;
        reason: string;
        subscriptionRequired: true;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        eligible: false;
        reason: string;
        subscriptionRequired: false;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        eligible: true;
        reason: string;
        subscriptionRequired: false;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * GET /api/settings/schedule
 */
export declare const getScheduleSettings: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    success: true;
    data: {
        timezone: any;
        call_window_start: any;
        call_window_timezone: any;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * PUT /api/settings/subscription-status
 */
export declare const updateSubscriptionStatus: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: any;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * PUT /api/settings/schedule
 * Update user's call schedule (call window start time and timezone)
 */
export declare const updateScheduleSettings: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        call_window_start: any;
        call_window_timezone: any;
        timezone: any;
    };
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
/**
 * PUT /api/settings/revenuecat-customer-id
 * Store RevenueCat customer ID for user after payment
 */
export declare const updateRevenueCatCustomerId: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: any;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
