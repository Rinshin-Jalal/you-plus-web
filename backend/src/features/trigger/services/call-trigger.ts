/**
 * Call Trigger Service
 *
 * This module handles the initiation of proactive accountability calls to users.
 * It's responsible for validating call conditions, generating unique call IDs,
 * and triggering calls via Cartesia Line (telephony).
 *
 * Note: This is being deprecated in favor of cartesia-call-trigger.ts
 * which handles real phone calls via Cartesia Line.
 *
 * The call flow:
 * 1. Validate user has phone number
 * 2. Check if call already exists today (prevent spam)
 * 3. Generate unique call UUID
 * 4. Trigger Cartesia Line call
 * 5. Track sent call for timeout detection
 */

import { CallType, User } from "@/types/database";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { checkCallExists, saveCallAnalytics } from "@/features/core/utils/database";
import { trackSentCall } from "@/features/voip/services/call-tracker";
import { format } from "date-fns";
import type { Env } from "@/index";
import { processCartesiaCall } from "@/features/trigger/services/cartesia-call-trigger";


/**
 * Result of a call trigger attempt
 */
interface CallTriggerResult {
  success: boolean;
  callId?: string;
  error?: string;
}

/**
 * Triggers a phone call to a user's device to initiate an accountability call.
 * This uses Cartesia Line for real telephony calls.
 *
 * The function performs several validations:
 * - Ensures user has a valid phone number
 * - Prevents duplicate calls on the same day
 * - Generates unique call identifiers
 * - Tracks sent calls for monitoring
 *
 * @param user The full user object, must include phone_number.
 * @param callType The type of call to initiate ('daily_reckoning').
 * @param env The environment variables containing API keys and database config.
 * @returns A result object indicating success or failure with error details.
 */
export async function processUserCall(
  user: User & { phone_number?: string },
  callType: CallType,
  env: Env,
): Promise<CallTriggerResult> {
  try {
    const { id: userId, phone_number } = user;

    if (!phone_number) {
      const errorMessage =
        `User ${userId} does not have a phone number. Cannot initiate call.`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const callExists = await checkCallExists(env, userId, today);
    if (callExists) {
      const errorMessage =
        `Call already exists for user ${userId} today.`;
      console.warn(errorMessage);
      return { success: false, error: errorMessage };
    }

    // Use Cartesia Line to trigger the actual phone call
    const result = await processCartesiaCall(user, callType, env);

    if (result.success) {
      console.log(`✅ Cartesia call successfully triggered for user ${userId}.`);
      return { success: true, callId: result.callId };
    }

    const errorMessage = result.error || `Failed to trigger call for user ${userId}.`;
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  } catch (error) {
    const errorMessage = `❌ processUserCall failed: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}
