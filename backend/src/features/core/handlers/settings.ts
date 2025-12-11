import { Context } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";
import { getAuthenticatedUserId } from "@/middleware/auth";

export const getCallEligibility = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select(
        `
        subscription_status,
        onboarding_completed,
        created_at
      `
      )
      .eq("id", userId)
      .single();

    if (error) throw error;

    if (
      userData.subscription_status !== "active" &&
      userData.subscription_status !== "trialing"
    ) {
      return c.json({
        success: true,
        data: {
          eligible: false,
          reason: "Active subscription required for accountability calls",
          subscriptionRequired: true,
        },
      });
    }

    // Note: Expiration checking is handled by the payment provider
    // No need to check expiry date here since subscription_status reflects current state

    if (!userData.onboarding_completed) {
      return c.json({
        success: true,
        data: {
          eligible: false,
          reason: "Complete onboarding first to enable calls",
          subscriptionRequired: false,
        },
      });
    }

    return c.json({
      success: true,
      data: {
        eligible: true,
        reason: "Ready for accountability calls",
        subscriptionRequired: false,
      },
    });
  } catch (error) {
    console.error("Error checking call eligibility:", error);
    return c.json(
      {
        success: false,
        error: "Failed to check call eligibility",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const getScheduleSettings = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        timezone,
        call_window_start,
        call_window_timezone
      `
      )
      .eq("id", userId)
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching schedule settings:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch schedule settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const updateSubscriptionStatus = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const { isActive, isEntitled } = await c.req.json();

  if (typeof isActive !== "boolean" || typeof isEntitled !== "boolean") {
    return c.json({ error: "Invalid subscription status data" }, 400);
  }

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    // Map boolean values to enum values that match the database schema
    let subscriptionStatus: "active" | "trialing" | "cancelled" | "past_due";

    if (isActive && isEntitled) {
      subscriptionStatus = "active";
    } else if (isActive && !isEntitled) {
      subscriptionStatus = "trialing";
    } else if (!isActive && isEntitled) {
      subscriptionStatus = "past_due"; // Was active but expired
    } else {
      subscriptionStatus = "cancelled";
    }

    const updateData: any = {
      subscription_status: subscriptionStatus,
    };

    // For now, we'll only update the core subscription status
    // TODO: Add additional subscription fields to database schema if needed

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return c.json({
      success: true,
      data,
      message: "Subscription status synchronized",
    });
  } catch (error) {
    console.error("Subscription status update failed:", error);
    return c.json(
      {
        error: "Failed to update subscription status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};

export const updateScheduleSettings = async (c: Context) => {
  const userId = getAuthenticatedUserId(c);
  const body = await c.req.json();
  const { callWindowStart, timezone } = body;

  // Validate input
  if (!callWindowStart || typeof callWindowStart !== 'string') {
    return c.json({ error: 'callWindowStart is required (HH:MM:SS format)' }, 400);
  }

  // Validate time format (HH:MM:SS or HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(callWindowStart)) {
    return c.json({ error: 'Invalid time format. Use HH:MM:SS or HH:MM' }, 400);
  }

  // Ensure HH:MM:SS format (add :00 if only HH:MM provided)
  const formattedTime = callWindowStart.split(':').length === 2
    ? `${callWindowStart}:00`
    : callWindowStart;

  const env = c.env as Env;
  const supabase = createSupabaseClient(env);

  try {
    const updateData: any = {
      call_window_start: formattedTime,
      updated_at: new Date().toISOString(),
    };

    // Update timezone if provided
    if (timezone && typeof timezone === 'string') {
      updateData.call_window_timezone = timezone;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('call_window_start, call_window_timezone, timezone')
      .single();

    if (error) throw error;

    console.log(`✅ Updated call schedule for user ${userId}: ${formattedTime}`);

    return c.json({
      success: true,
      data,
      message: 'Call schedule updated successfully',
    });
  } catch (error) {
    console.error('Schedule update failed:', error);
    return c.json(
      {
        error: 'Failed to update call schedule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};