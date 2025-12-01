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
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { checkCallExists, createSupabaseClient } from "@/features/core/utils/database";
import { trackSentCall } from "@/features/voip/services/call-tracker";
import { format } from "date-fns";
import type { Env } from "@/index";
import { createVoipCallPayload } from "@/features/voip/services/payload";
import { generateFullCallConfig } from "@/features/call/services/call-config";
import { initiateLiveKitCall } from "@/features/livekit/services/call-initiator";


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
export async function processUserCall(
  user: User,
  callType: CallType,
  env: Env,
): Promise<CallTriggerResult> {
  try {
    const { id: userId, push_token } = user;

    if (!push_token) {
      const errorMessage =
        `User ${userId} does not have a push token. Cannot initiate call.`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const callExists = await checkCallExists(env, userId, callType, today);
    if (callExists) {
      const errorMessage =
        `Call of type ${callType} already exists for user ${userId} today.`;
      console.warn(errorMessage);
      return { success: false, error: errorMessage };
    }

    const callUUID = generateCallUUID(callType);
    const config = await generateFullCallConfig(env, userId, callType, callUUID);

    // Initiate LiveKit call to create room and get token
    let liveKitResult;
    try {
      liveKitResult = await initiateLiveKitCall(env, {
        roomName: `youplus-${userId}-${callUUID}`.toLowerCase(),
        userId,
        callUUID,
        callType,
        mood: config.mood,
        prompts: config.prompts,
        cartesiaVoiceId: config.cartesiaVoiceId,
        supermemoryUserId: config.supermemoryUserId,
        metadata: {
          tone: config.toneAnalysis,
          schedulerRunAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Warning: LiveKit initiation failed, continuing without room:", error);
      // Continue without LiveKit room - client can retry later
    }

    const basePayload = {
      callUUID,
      userId,
      callType,
      mood: config.mood,
      ...(liveKitResult?.roomName && { roomName: liveKitResult.roomName }),
      ...(liveKitResult?.token && { liveKitToken: liveKitResult.token }),
      cartesiaVoiceId: config.cartesiaVoiceId,
      supermemoryUserId: config.supermemoryUserId,
      handoff: {
        initiatedBy: "scheduler" as const,
      },
      metadata: {
        tone: config.toneAnalysis,
        schedulerRunAt: new Date().toISOString(),
      },
    };
    const payload = createVoipCallPayload(basePayload);

    const pushSent = await sendVoipPushNotification(
      push_token,
      {
        userId,
        callType,
        type: "accountability_call",
        callUUID,
        urgency: "high",
        metadata: {
          cartesiaVoiceId: config.cartesiaVoiceId,
        },
      },
      env,
    );

    if (pushSent) {
      await trackSentCall(user.id, callUUID, callType, env);

      console.log(`✅ VoIP Push successfully sent to user ${user.id}.`);
      return { success: true };
    }

    const errorMessage = `Failed to send VoIP push to user ${userId}.`;
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
