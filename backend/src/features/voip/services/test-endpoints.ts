/**
 * VoIP Test Endpoints Service
 *
 * This module provides test endpoints for VoIP functionality,
 * allowing administrators to test VoIP push notifications and
 * certificate configurations.
 */

import { Env } from "@/index";
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { generateCallUUID } from "@/features/core/utils/uuid";

// Define valid VoIP push types
type VoipPushType = 
  | "accountability_call" 
  | "accountability_call_retry" 
  | "apology_call_notification" 
  | "apology_ritual_required" 
  | "first_call_notification" 
  | "first_call_notification_retry";

/**
 * Execute a simple VoIP test with just a token
 *
 * This function performs a basic VoIP push test using only
 * the device token. It's useful for quick connectivity tests
 * without requiring full user data.
 *
 * @param voipToken The device's VoIP push token
 * @param env Environment variables for push service
 * @returns Object with test results and success status
 */
export async function executeSimpleVoipTest(
  voipToken: string,
  env: Env,
): Promise<{
  success: boolean;
  message: string;
  error?: string;
  callUUID?: string;
}> {
  try {
    // Generate a test call UUID
    const callUUID = generateCallUUID("test");

    // Create a minimal test payload
    const testPayload = {
      userId: "test-user",
      callType: "morning" as const,
      type: "accountability_call" as VoipPushType,
      callUUID,
      urgency: "low" as const,
      message: "This is a test VoIP push notification",
    };

    // Send the test push notification
    const pushSent = await sendVoipPushNotification(
      voipToken,
      testPayload,
      {
        IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
        IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
        IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
      },
    );

    if (pushSent) {
      return {
        success: true,
        message: "✅ VoIP push test sent successfully",
        callUUID,
      };
    } else {
      return {
        success: false,
        message: "❌ Failed to send VoIP push test",
        error: "Push notification service returned failure",
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Simple VoIP test failed:", errorMessage);

    return {
      success: false,
      message: "❌ VoIP push test failed",
      error: errorMessage,
    };
  }
}

/**
 * Execute an advanced VoIP test with full user context
 *
 * This function performs a comprehensive VoIP push test using
 * the device token, user ID, and call type. It simulates
 * a real call scenario for more thorough testing.
 *
 * @param voipToken The device's VoIP push token
 * @param userId The user ID for the test
 * @param callType The type of call to simulate
 * @param env Environment variables for push service
 * @returns Object with test results and success status
 */
export async function executeAdvancedVoipTest(
  voipToken: string,
  userId: string,
  callType: string,
  env: Env,
): Promise<{
  success: boolean;
  message: string;
  error?: string;
  callUUID?: string;
}> {
  try {
    // Generate a test call UUID
    const callUUID = generateCallUUID(callType);

    // Create a realistic test payload
    const testPayload = {
      userId,
      callType: callType as any,
      type: "accountability_call" as VoipPushType,
      callUUID,
      urgency: "high" as const,
      message: `This is a test ${callType} call for user ${userId}`,
    };

    // Send the test push notification
    const pushSent = await sendVoipPushNotification(
      voipToken,
      testPayload,
      {
        IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
        IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
        IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
      },
    );

    if (pushSent) {
      return {
        success: true,
        message: `✅ VoIP push test sent successfully for ${callType} call`,
        callUUID,
      };
    } else {
      return {
        success: false,
        message: `❌ Failed to send VoIP push test for ${callType} call`,
        error: "Push notification service returned failure",
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Advanced VoIP test failed for ${callType}:`, errorMessage);

    return {
      success: false,
      message: `❌ VoIP push test failed for ${callType} call`,
      error: errorMessage,
    };
  }
}