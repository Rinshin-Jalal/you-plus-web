/**
 * VoIP Delivery Handler Service
 *
 * This module handles delivery receipts from VoIP push notifications and manages
 * call acknowledgment logic. It processes status updates from iOS/Android devices
 * and determines whether calls were successfully received and acknowledged.
 *
 * Key Features:
 * - Processes delivery receipts from push notification services
 * - Determines call acknowledgment status
 * - Saves delivery data to database for analytics
 * - Integrates with retry tracking system
 * - Validates receipt data integrity
 *
 * Delivery Status Types:
 * - "delivered": Push notification was delivered to device
 * - "answered": User answered to call
 * - "connected": Call was connected successfully
 * - "failed": Push notification failed to deliver
 * - "declined": User declined to call
 */
/**
 * Determine if a delivery status indicates successful acknowledgment
 *
 * This function interprets various delivery status strings to determine
 * whether a call was successfully acknowledged by user. Different
 * push notification services may use different status strings.
 *
 * @param status The delivery status string from to push service
 * @returns True if status indicates successful acknowledgment
 */
export function isCallAcknowledged(status) {
    const acknowledgedStatuses = ["delivered", "answered", "connected"];
    return acknowledgedStatuses.includes(status.toLowerCase());
}
/**
 * Save delivery receipt to database
 *
 * This function stores delivery receipt data in database for analytics
 * and debugging purposes. It handles database connection errors and provides
 * detailed error reporting.
 *
 * @param receipt The delivery receipt object to save
 * @param env Environment variables for database connection
 * @returns Object indicating success or failure with error details
 */
export async function saveDeliveryReceipt(receipt, env) {
    try {
        // Import dynamically to avoid bundling issues
        // This prevents issues when module is used in different environments
        const { createSupabaseClient } = await import("@/utils/database");
        if (!env.SUPABASE_URL) {
            return {
                success: false,
                error: "Supabase configuration not available in environment",
            };
        }
        const supabase = createSupabaseClient(env);
        // Insert delivery receipt into database
        // This provides a permanent record of all delivery attempts
        const { error } = await supabase
            .from("voip_delivery_receipts")
            .insert({
            user_id: receipt.userId,
            call_uuid: receipt.callUUID,
            status: receipt.status,
            received_at: receipt.receivedAt,
            device_info: receipt.deviceInfo || null,
        });
        if (error) {
            console.error("Failed to insert delivery receipt:", error);
            return {
                success: false,
                error: error.message,
            };
        }
        console.log(`📥 VoIP delivery receipt saved: user=${receipt.userId}, callUUID=${receipt.callUUID}, status=${receipt.status}`);
        return { success: true };
    }
    catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : "Unknown error";
        console.error("Error saving delivery receipt:", errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
}
/**
 * Process delivery receipt and handle acknowledgment
 *
 * This is main function for processing delivery receipts. It:
 * - Determines if the call was acknowledged
 * - Clears retry tracking if call was acknowledged
 * - Saves the receipt to database
 * - Logs device information for debugging
 *
 * @param receipt The delivery receipt to process
 * @param env Environment variables for database operations
 * @param acknowledgeCallback Optional callback to clear retry tracking
 * @returns Object with processing results and acknowledgment status
 */
export async function processDeliveryReceipt(receipt, env, acknowledgeCallback) {
    // Determine if this delivery receipt indicates acknowledgment
    const isAcknowledged = isCallAcknowledged(receipt.status);
    let retryTrackingCleared = false;
    // Call acknowledgment callback if provided
    if (acknowledgeCallback) {
        const acknowledged = acknowledgeCallback(receipt.callUUID);
        if (acknowledged) {
            // Clear retry tracking
            const { clearCallRetries } = await import("@/services/call-retry-handler");
            await clearCallRetries(receipt.userId, receipt.callType, env);
            return {
                success: true,
                acknowledged: true,
                retryTrackingCleared: true,
            };
        }
    }
    // Save to database for analytics and debugging
    const saveResult = await saveDeliveryReceipt(receipt, env);
    if (!saveResult.success) {
        return {
            success: false,
            acknowledged: isAcknowledged,
            retryTrackingCleared,
            error: saveResult.error || "Failed to save receipt",
        };
    }
    // Log device info if available for debugging
    // This helps identify device-specific issues
    if (receipt.deviceInfo) {
        console.log("Device info:", receipt.deviceInfo);
    }
    return {
        success: true,
        acknowledged: isAcknowledged,
        retryTrackingCleared,
    };
}
/**
 * Validate delivery receipt data
 *
 * This function validates that incoming delivery receipt data contains
 * all required fields and is properly formatted. It's used to ensure
 * data integrity before processing.
 *
 * @param data Raw delivery receipt data to validate
 * @returns Object with validation results and parsed receipt if valid
 */
export function validateDeliveryReceiptData(data) {
    const requiredFields = ["userId", "callUUID", "status", "receivedAt"];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
        return {
            isValid: false,
            missingFields,
        };
    }
    return {
        isValid: true,
        receipt: {
            userId: data.userId,
            callUUID: data.callUUID,
            status: data.status,
            receivedAt: data.receivedAt,
            deviceInfo: data.deviceInfo,
        },
    };
}
