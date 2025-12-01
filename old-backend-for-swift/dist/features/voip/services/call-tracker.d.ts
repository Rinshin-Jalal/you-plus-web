/**
 * VoIP Call Tracker Service
 *
 * This module tracks sent VoIP calls and detects when users don't acknowledge them.
 * It implements a timeout-based system that automatically triggers retry logic
 * when calls go unanswered for a specified period.
 *
 * Key Features:
 * - Tracks all sent calls with unique UUIDs
 * - Implements 10-minute timeout for call acknowledgment
 * - Automatically triggers retry logic on timeout
 * - Clears tracking when calls are acknowledged
 * - Provides debugging and monitoring capabilities
 *
 * Call Lifecycle:
 * 1. Call sent → Tracked with timeout
 * 2. User answers → Acknowledged, tracking cleared
 * 3. User ignores → Timeout triggers retry logic
 * 4. Retry sent → New tracking cycle begins
 */
import { CallType } from "@/types/database";
/**
 * Represents a call that was sent and is being tracked for acknowledgment
 */
interface PendingCall {
    userId: string;
    callUUID: string;
    callType: CallType;
    sentAt: string;
    timeoutId: NodeJS.Timeout;
    acknowledged: boolean;
}
/**
 * Track a call that was sent and schedule timeout detection
 *
 * This function is called immediately after a VoIP push notification is sent.
 * It sets up a 10-minute timeout to detect if user doesn't acknowledge
 * call, which would trigger retry logic.
 *
 * Only certain call types are tracked (morning, evening, apology, emergency)
 * as these are ones that benefit from retry logic.
 *
 * @param userId The user ID who received call
 * @param callUUID The unique identifier for this call
 * @param callType The type of call that was sent
 * @param env Environment variables for retry handler
 */
export declare function trackSentCall(userId: string, callUUID: string, callType: CallType, env: any): Promise<void>;
/**
 * Mark call as acknowledged and cancel timeout
 *
 * This function should be called when frontend confirms that a user
 * has answered or acknowledged a call. It prevents unnecessary retries
 * and cleans up tracking resources.
 *
 * @param callUUID The UUID of call being acknowledged
 * @returns True if call was found and acknowledged, false otherwise
 */
export declare function acknowledgeCall(callUUID: string, env: any): Promise<boolean>;
/**
 * Get pending call status (for debugging)
 *
 * This function allows external systems to check if a specific call
 * is being tracked and its current status.
 *
 * @param callUUID The UUID of call to check
 * @returns The pending call object if found, null otherwise
 */
export declare function getPendingCallStatus(callUUID: string): PendingCall | null;
/**
 * Get all pending calls (for debugging/monitoring)
 *
 * This function returns all currently tracked calls, useful for
 * monitoring system health and debugging issues.
 *
 * @returns Array of all pending call objects
 */
export declare function getAllPendingCalls(): PendingCall[];
/**
 * Clear all pending calls (for testing/cleanup)
 *
 * This function clears all tracked calls and cancels their timeouts.
 * Useful for testing or system cleanup scenarios.
 */
export declare function clearAllPendingCalls(): void;
export {};
