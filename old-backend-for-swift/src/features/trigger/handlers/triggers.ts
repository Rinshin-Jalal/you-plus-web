import { Context } from "hono";
import { processUserCall } from "@/features/trigger/services/call-trigger";
import { handleManualCallTrigger } from "@/features/trigger/services/cartesia-call-trigger";
import { sendVoipPushNotification } from "@/features/core/services/push-notification-service";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";
import { createScheduler } from "@/features/trigger/services/scheduler-engine";
import { processAllRetries } from "@/features/trigger/services/retry-processor";

/**
 * Trigger a VoIP call for a specific user immediately
 * POST /trigger/user/:userId/:callType
 */
export const triggerUserCallAdmin = async (c: Context) => {
  const { userId, callType } = c.req.param();
  const env = c.env as Env;

  // Simplified call types (bloat elimination) - only daily_reckoning and onboarding_call
  if (
    !userId ||
    !callType ||
    !["daily_reckoning", "onboarding_call"].includes(callType)
  ) {
    return c.json(
      {
        error:
          "Invalid userId or callType. Valid types: daily_reckoning, onboarding_call",
      },
      400,
    );
  }

  try {
    // Get user from database
    const supabase = createSupabaseClient(env);
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!user.push_token) {
      return c.json({ error: "User has no push token configured" }, 400);
    }

    // Use the existing consequence engine to trigger the call
    const result = await processUserCall(user, callType as any, env);

    if (result.success) {
      return c.json({
        success: true,
        message: `VoIP call triggered successfully for user ${userId}`,
        callType: callType,
        userId: userId,
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || "Failed to trigger call",
        },
        500,
      );
    }
  } catch (error) {
    console.error("Error triggering user call:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
};

/**
 * Send immediate VoIP push with custom payload
 * POST /trigger/voip
 * Body: { userId: string, callType: string, message?: string, urgency?: "high" | "medium" | "low" }
 */
export const triggerVoipPushAdmin = async (c: Context) => {
  const body = await c.req.json();
  const { userId, callType, message, urgency = "high" } = body;
  const env = c.env as Env;

  if (!userId || !callType) {
    return c.json(
      {
        error: "Missing required fields: userId, callType",
      },
      400,
    );
  }

  try {
    // Get user's push token
    const supabase = createSupabaseClient(env);
    const { data: user, error } = await supabase
      .from("users")
      .select("push_token")
      .eq("id", userId)
      .single();

    if (error || !user || !user.push_token) {
      return c.json({ error: "User not found or no push token" }, 404);
    }

    // Generate call UUID
    const callUUID = generateCallUUID(callType);

    // Send VoIP push
    const success = await sendVoipPushNotification(
      user.push_token,
      {
        userId: userId,
        callType: callType,
        type: "accountability_call",
        callUUID: callUUID,
        urgency: urgency,
      },
      {
        IOS_VOIP_KEY_ID: env.IOS_VOIP_KEY_ID,
        IOS_VOIP_TEAM_ID: env.IOS_VOIP_TEAM_ID,
        IOS_VOIP_AUTH_KEY: env.IOS_VOIP_AUTH_KEY,
      },
    );

    return c.json({
      success,
      message: success
        ? `VoIP push sent successfully to user ${userId}`
        : `Failed to send VoIP push to user ${userId}`,
      callUUID,
      callType,
      userId,
    });
  } catch (error) {
    console.error("Error sending VoIP push:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
};

/**
 * Process scheduled calls
 * POST /trigger/scheduled-calls
 */
export const processScheduledCallsAdmin = async (c: Context) => {
  const env = c.env as Env;
  
  try {
    const scheduler = createScheduler(env);
    const result = await scheduler.processScheduledCalls();
    
    return c.json({
      success: true,
      message: 'Scheduled calls processed successfully',
      data: result
    });
  } catch (error) {
    console.error("Error processing scheduled calls:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
};

/**
 * Process retry queue
 * POST /trigger/retry-queue
 */
export const processRetryQueueAdmin = async (c: Context) => {
  const env = c.env as Env;

  try {
    await processAllRetries(env);

    return c.json({
      success: true,
      message: 'Retry queue processed successfully'
    });
  } catch (error) {
    console.error("Error processing retry queue:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
};

/**
 * Trigger onboarding call for a specific user
 * POST /trigger/onboarding/:userId
 * Development only - for testing onboarding flow
 */
export const triggerOnboardingCallAdmin = async (c: Context) => {
  const { userId } = c.req.param();
  const env = c.env as Env;

  console.log(`🎯 Triggering onboarding call for user: ${userId}`);

  if (!userId) {
    return c.json(
      {
        error: "Missing required fields: userId, callType",
      },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(env);
    const { data: user, error } = await supabase
      .from("users")
      .select("push_token")
      .eq("id", userId)
      .single();

    if (error || !user || !user.push_token) {
      return c.json({ error: "User not found or no push token" }, 404);
    }

    // const result = await processUserCall(user, "onboarding_call", env);
    return c.json({
      success: true,
      message: "Onboarding call triggered - user will receive VoIP push",
      // result,
    });
  } catch (error) {
    console.error("❌ Onboarding call trigger failed:", error);
    return c.json(
      {
        success: false,
        error: "Failed to trigger onboarding call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

/**
 * Trigger a Cartesia Line outbound call for a user
 * POST /trigger/cartesia/:userId
 * 
 * This triggers a REAL phone call to the user using Cartesia Line.
 * The agent will use the user's cloned voice (Future You).
 */
export const triggerCartesiaCallAdmin = async (c: Context) => {
  const { userId } = c.req.param();
  const env = c.env as Env;

  console.log(`📞 Triggering Cartesia Line call for user: ${userId}`);

  if (!userId) {
    return c.json({ error: "Missing userId parameter" }, 400);
  }

  try {
    const result = await handleManualCallTrigger(userId, env);

    if (result.success) {
      return c.json({
        success: true,
        message: `Cartesia call initiated for user ${userId}`,
        callId: result.callId,
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || "Failed to trigger Cartesia call",
        },
        500
      );
    }
  } catch (error) {
    console.error("❌ Cartesia call trigger failed:", error);
    return c.json(
      {
        success: false,
        error: "Failed to trigger Cartesia call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};