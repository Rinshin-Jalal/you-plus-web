import { Context } from "hono";
export declare const getHealth: (c: Context) => Response & import("hono").TypedResponse<{
    status: string;
    timestamp: string;
    version: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">;
export declare const getStats: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    users_needing_daily_reckoning_calls: number;
    current_time: string;
    system_status: string;
    note: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
export declare const getDebugSchedules: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    users: {
        id: string;
        name: string;
        timezone: string;
        nextCall: string | null;
        callWindow: string;
    }[];
    message: string;
    current_time: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
