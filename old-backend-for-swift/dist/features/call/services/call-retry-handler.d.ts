/**
 * Call Retry Handler Service
 *
 * This module manages to retry logic for missed, declined, or failed accountability calls.
 * It implements an intelligent escalation system that increases urgency and messaging
 * intensity based on user behavior patterns and retry attempt number.
 *
 * Key Features:
 * - Tracks missed calls with database storage (Supabase)
 * - Implements escalating urgency (high → critical → emergency)
 * - Uses behavioral intelligence to personalize retry messages
 * - Prevents spam with maximum retry limits
 * - Schedules retries with configurable delays
 *
 * Retry Flow:
 * 1. User misses/declines call
 * 2. System tracks miss and schedules retry
 * 3. Retry executes with escalated urgency
 * 4. If still missed, escalates further
 * 5. Clears tracking when user successfully answers
 */
import { CallType } from "@/types/database";
import { Env } from "@/index";
/**
 * Track when a user misses/declines a call and schedule retry
 *
 * This function is called when a user doesn't answer a call. It:
 * - Creates or updates a retry record in database
 * - Calculates escalating urgency based on attempt number
 * - Analyzes user behavior patterns for intelligent escalation
 * - Schedules retry with appropriate delay
 *
 * @param userId The user ID who missed call
 * @param callType The type of call that was missed
 * @param callUUID The original call UUID
 * @param reason Why call was missed (missed/declined/failed)
 * @param env Environment variables for database access
 */
export declare function handleMissedCall(userId: string, callType: CallType, callUUID: string, reason: "missed" | "declined" | "failed", env: Env): Promise<void>;
/**
 * Execute a retry call with escalated intensity
 *
 * This function is called by scheduled timeout and:
 * - Fetches fresh user data to ensure push token is still valid
 * - Sends an escalated VoIP push notification
 * - Handles push failures with additional retry logic
 * - Logs all outcomes for monitoring
 *
 * @param retryRecord The complete retry record for this user/callType
 * @param retryAttempt The specific attempt being executed
 * @param env Environment variables for database and API access
 */
export declare function clearCallRetries(userId: string, callType: CallType, env: Env): Promise<void>;
/**
 * Get retry status for debugging
 */
export declare function getRetryStatus(userId: string, callType: CallType, env: Env): Promise<any>;
