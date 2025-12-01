/**
 * Call Trigger Service
 *
 * This module handles the initiation of proactive accountability calls to users.
 * It's responsible for validating call conditions, generating unique call IDs,
 * and sending VoIP push notifications to trigger calls on user devices.
 *
 * The call flow:
 * 1. Validate user has push token
 * 2. Check if call already exists today (prevent spam)
 * 3. Generate unique call UUID
 * 4. Send VoIP push notification
 * 5. Track sent call for timeout detection
 */
import { CallType, User } from "@/types/database";
import type { Env } from "@/index";
/**
 * Result of a call trigger attempt
 */
interface CallTriggerResult {
    success: boolean;
    error?: string;
}
/**
 * Triggers a VoIP push notification to a user's device to initiate a call.
 * This is the first step in the proactive call flow. The frontend will handle
 * the rest upon receiving the push.
 *
 * The function performs several validations:
 * - Ensures user has a valid push token
 * - Prevents duplicate calls on the same day
 * - Generates unique call identifiers
 * - Tracks sent calls for monitoring
 *
 * @param user The full user object, must include push_token.
 * @param callType The type of call to initiate ('daily_reckoning').
 * @param env The environment variables containing API keys and database config.
 * @returns A result object indicating success or failure with error details.
 */
export declare function processUserCall(user: User, callType: CallType, env: Env): Promise<CallTriggerResult>;
export {};
