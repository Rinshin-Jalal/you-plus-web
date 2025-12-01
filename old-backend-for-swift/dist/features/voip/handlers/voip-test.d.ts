import { Context } from "hono";
import { trackSentCall } from "@/features/voip/services/call-tracker";
/**
 * Test iOS VoIP certificate configuration
 * GET /voip/test-certificates
 */
export declare function testVoipCertificates(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: boolean;
    message: string;
    error: string;
    configStatus: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
    };
    instructions: string;
} | {
    success: boolean;
    message: string;
    certificates: boolean;
    configStatus: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
    };
} | {
    success: boolean;
    message: string;
    error: string;
    configStatus: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
/**
 * Simple VoIP test - just token needed
 * POST /voip/simple-test
 * Body: { voipToken: string }
 */
export declare function simpleVoipTest(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    message: string;
    error?: string | undefined;
    callUUID?: string | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
/**
 * Send test VoIP push notification
 * POST /voip/test
 * Body: { voipToken: string, userId: string, callType: "morning" | "evening" }
 */
export declare function advancedVoipTest(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: boolean;
    message: string;
    error?: string | undefined;
    callUUID?: string | undefined;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
/**
 * Get VoIP integration status
 * GET /voip/status
 */
export declare function getVoipStatus(c: Context): Promise<Response & import("hono").TypedResponse<{
    status: string;
    integration: {
        hasKeyId: boolean;
        hasTeamId: boolean;
        hasAuthKey: boolean;
        readyForTesting: boolean;
        missingConfiguration: string[];
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
/**
 * Delivery receipt endpoint - WITH RETRY LOGIC!
 * POST /voip/ack
 * Body: { userId: string, callUUID: string, status: string, receivedAt: string, deviceInfo?: any }
 */
export declare function voipAck(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    missing: string[] | undefined;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string | undefined;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    acknowledged: boolean;
    retryTrackingCleared: boolean;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
/**
 * Debug endpoint - Get pending call status
 * GET /voip/debug/pending/:callUUID
 */
export declare function getPendingCallStatusByUUID(c: Context): Promise<Response & import("hono").TypedResponse<{
    callUUID: string;
    pendingCall: {
        userId: string;
        callType: "daily_reckoning";
        sentAt: string;
        acknowledged: boolean;
    } | null;
    found: boolean;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
/**
 * Debug endpoint - Get all pending calls
 * GET /voip/debug/pending
 */
export declare function getAllPendingCallsList(c: Context): Promise<Response & import("hono").TypedResponse<{
    totalPending: number;
    calls: {
        callUUID: string;
        userId: string;
        callType: "daily_reckoning";
        sentAt: string;
        acknowledged: boolean;
    }[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
/**
 * Acknowledge call endpoint - Frontend calls this when user answers
 * POST /voip/acknowledge
 * Body: { callUUID: string }
 */
export declare function acknowledgeVoipCall(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    callUUID: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    callUUID: any;
}, 404, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 500, "json">)>;
export { trackSentCall };
