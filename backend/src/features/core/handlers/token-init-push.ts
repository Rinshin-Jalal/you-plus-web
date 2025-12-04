import { Context } from "hono";
import { upsertPushToken } from "@/features/core/utils/database";
import { getAuthenticatedUserId } from "@/middleware/auth";
import { Env } from "@/index";

// Endpoint for the frontend to register a user's push notification token
export const postUserPushToken = async (c: Context) => {
  const body = await c.req.json();
  const {
    token,
    type = "fcm",
    device_model,
    os_version,
    app_version,
    locale,
    timezone,
  } = body;
  const env = c.env as Env;

  if (!token) {
    return c.json({ error: "Missing required field: token" }, 400);
  }

  // Get authenticated user ID from JWT token
  const userId = getAuthenticatedUserId(c);

  try {
    await upsertPushToken(env, userId, {
      token,
      type,
      device_model,
      os_version,
      app_version,
      locale,
      timezone,
    });
    console.log(`✅ Successfully saved push token for user ${userId}.`);
    return c.json({ success: true, message: "Token saved successfully." });
  } catch (error) {
    console.error(`Failed to save push token for user ${userId}:`, error);
    return c.json(
      {
        success: false,
        error: "Failed to save push token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};