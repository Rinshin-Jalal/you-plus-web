/**
 * VoIP Debug Endpoint
 * Captures debug information from iOS VoIP push handling for background debugging
 */
import { Context } from "hono";
/**
 * POST /debug/voip
 * Receives debug information from iOS VoIP push handling
 */
export declare function postVoIPDebug(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    events_count: number;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * GET /debug/voip
 * Returns recent VoIP debug events for viewing
 */
export declare function getVoIPDebugEvents(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    events: {
        event: string;
        app_state?: number | undefined;
        timestamp?: number | undefined;
        payload?: any;
        error?: string | undefined;
        device_id?: string | undefined;
        user_id?: string | undefined;
        additional_info?: any;
        received_at: string;
    }[];
    total_events: number;
    oldest_event: string | null;
    newest_event: string | null;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * DELETE /debug/voip
 * Clears all stored debug events
 */
export declare function clearVoIPDebugEvents(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    message: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
/**
 * GET /debug/voip/summary
 * Returns a summary of recent VoIP debug activity
 */
export declare function getVoIPDebugSummary(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    summary: {
        total_events: number;
        recent_events: number;
        event_types: {
            [x: string]: number;
        };
        app_states: {
            [x: string]: number;
        };
        recent_errors: number;
        last_event: string | null;
    };
    recent_errors: {
        error: string | undefined;
        event: string;
        received_at: string;
    }[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
