import { Context } from "hono";
import { handleManualCallTrigger, processCartesiaCall } from "@/features/trigger/services/cartesia-call-trigger";
import { generateCallUUID } from "@/features/core/utils/uuid";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";
import { createScheduler } from "@/features/trigger/services/scheduler-engine";
import { processAllRetries } from "@/features/trigger/services/retry-processor";
import { CallType } from "@/types/database";

/**
 * Trigger a Cartesia Line call for a specific user immediately
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
      .select("id, name, phone_number")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!user.phone_number) {
      return c.json({ error: "User has no phone number configured" }, 400);
    }

    // Use Cartesia Line to trigger the call
    const result = await processCartesiaCall(user as any, callType as CallType, env);

    if (result.success) {
      return c.json({
        success: true,
        message: `Cartesia call triggered successfully for user ${userId}`,
        callType: callType,
        userId: userId,
        callId: result.callId,
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
        error: "Missing userId parameter",
      },
      400
    );
  }

  try {
    const supabase = createSupabaseClient(env);
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, phone_number")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!user.phone_number) {
      return c.json({ error: "User has no phone number configured" }, 400);
    }

    const result = await processCartesiaCall(user as any, "onboarding_call", env);
    
    return c.json({
      success: result.success,
      message: result.success 
        ? "Onboarding call triggered - user will receive phone call"
        : result.error,
      callId: result.callId,
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