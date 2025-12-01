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
import { CallType } from "@/types/database";
import { Env } from "@/index";
/**
 * Represents a delivery receipt from a VoIP push notification
 */
interface DeliveryReceipt {
    userId: string;
    callUUID: string;
    status: string;
    receivedAt: string;
    deviceInfo?: any;
    callType?: CallType;
}
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
export declare function isCallAcknowledged(status: string): boolean;
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
export declare function saveDeliveryReceipt(receipt: DeliveryReceipt, env: Env): Promise<{
    success: boolean;
    error?: string;
}>;
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
export declare function processDeliveryReceipt(receipt: DeliveryReceipt, env: Env, acknowledgeCallback?: (callUUID: string) => boolean): Promise<{
    success: boolean;
    acknowledged: boolean;
    retryTrackingCleared: boolean;
    error?: string;
}>;
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
export declare function validateDeliveryReceiptData(data: any): {
    isValid: boolean;
    receipt?: DeliveryReceipt;
    missingFields?: string[];
};
export {};
