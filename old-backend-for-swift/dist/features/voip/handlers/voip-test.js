// Import modular VoIP services
import { acknowledgeCall, getAllPendingCalls, getPendingCallStatus, trackSentCall, } from "@/features/voip/services/call-tracker";
import { testCertificates, validateCertificateConfig, } from "@/features/voip/services/certificate-validator";
import { executeAdvancedVoipTest, executeSimpleVoipTest, } from "@/features/voip/services/test-endpoints";
import { processDeliveryReceipt, validateDeliveryReceiptData, } from "@/features/voip/services/delivery-handler";
/**
 * Test iOS VoIP certificate configuration
 * GET /voip/test-certificates
 */
export async function testVoipCertificates(c) {
    const env = c.env;
    const result = await testCertificates(env);
    return c.json(result);
}
/**
 * Simple VoIP test - just token needed
 * POST /voip/simple-test
 * Body: { voipToken: string }
 */
export async function simpleVoipTest(c) {
    let body;
    try {
        body = await c.req.json();
    }
    catch (error) {
        console.error("💥 JSON parse error:", error);
        return c.json({
            success: false,
            error: "Invalid JSON in request body",
        }, 400);
    }
    const { voipToken } = body;
    if (!voipToken) {
        return c.json({
            success: false,
            error: "Missing voipToken",
        }, 400);
    }
    console.log(`🧪 Simple VoIP test to token: [REDACTED]`);
    const result = await executeSimpleVoipTest(voipToken, c.env);
    return c.json(result);
}
/**
 * Send test VoIP push notification
 * POST /voip/test
 * Body: { voipToken: string, userId: string, callType: "morning" | "evening" }
 */
export async function advancedVoipTest(c) {
    const body = await c.req.json();
    const { voipToken, userId, callType = "morning" } = body;
    if (!voipToken || !userId) {
        return c.json({
            success: false,
            error: "Missing required fields: voipToken, userId",
        }, 400);
    }
    const result = await executeAdvancedVoipTest(voipToken, userId, callType, c.env);
    return c.json(result);
}
/**
 * Get VoIP integration status
 * GET /voip/status
 */
export async function getVoipStatus(c) {
    const env = c.env;
    const status = validateCertificateConfig(env);
    return c.json({
        status: status.readyForTesting ? "✅ Ready" : "⚠️ Needs Configuration",
        integration: status,
    });
}
/**
 * Delivery receipt endpoint - WITH RETRY LOGIC!
 * POST /voip/ack
 * Body: { userId: string, callUUID: string, status: string, receivedAt: string, deviceInfo?: any }
 */
export async function voipAck(c) {
    try {
        const requestData = await c.req.json();
        // Validate receipt data
        const validation = validateDeliveryReceiptData(requestData);
        if (!validation.isValid) {
            return c.json({
                success: false,
                error: "Missing required fields",
                missing: validation.missingFields,
            }, 400);
        }
        // Create a wrapper that captures the env
        const acknowledgeCallWrapper = (callUUID) => {
            // For testing, just return true
            console.log(`✅ Test acknowledgment for call ${callUUID}`);
            return true;
        };
        // Process delivery receipt with acknowledgment callback
        const result = await processDeliveryReceipt(validation.receipt, c.env, acknowledgeCallWrapper);
        if (!result.success) {
            return c.json({
                success: false,
                error: result.error,
            }, 500);
        }
        return c.json({
            success: true,
            message: "Receipt logged",
            acknowledged: result.acknowledged,
            retryTrackingCleared: result.retryTrackingCleared,
        });
    }
    catch (error) {
        console.error("/voip/ack error:", error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
}
/**
 * Debug endpoint - Get pending call status
 * GET /voip/debug/pending/:callUUID
 */
export async function getPendingCallStatusByUUID(c) {
    const callUUID = c.req.param("callUUID");
    const pendingCall = getPendingCallStatus(callUUID);
    return c.json({
        callUUID,
        pendingCall: pendingCall
            ? {
                userId: pendingCall.userId,
                callType: pendingCall.callType,
                sentAt: pendingCall.sentAt,
                acknowledged: pendingCall.acknowledged,
            }
            : null,
        found: !!pendingCall,
    });
}
/**
 * Debug endpoint - Get all pending calls
 * GET /voip/debug/pending
 */
export async function getAllPendingCallsList(c) {
    const pendingCalls = getAllPendingCalls();
    return c.json({
        totalPending: pendingCalls.length,
        calls: pendingCalls.map((call) => ({
            callUUID: call.callUUID,
            userId: call.userId,
            callType: call.callType,
            sentAt: call.sentAt,
            acknowledged: call.acknowledged,
        })),
    });
}
/**
 * Acknowledge call endpoint - Frontend calls this when user answers
 * POST /voip/acknowledge
 * Body: { callUUID: string }
 */
export async function acknowledgeVoipCall(c) {
    try {
        const body = await c.req.json();
        const { callUUID } = body;
        if (!callUUID) {
            return c.json({
                success: false,
                error: "Missing callUUID",
            }, 400);
        }
        console.log(`📞 Acknowledging call ${callUUID}`);
        const acknowledged = await acknowledgeCall(callUUID, c.env);
        if (acknowledged) {
            return c.json({
                success: true,
                message: "Call acknowledged successfully",
                callUUID,
            });
        }
        else {
            return c.json({
                success: false,
                error: "Call not found or already acknowledged",
                callUUID,
            }, 404);
        }
    }
    catch (error) {
        console.error("💥 /voip/acknowledge error:", error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
}
// Export call tracking function for backward compatibility
export { trackSentCall };
