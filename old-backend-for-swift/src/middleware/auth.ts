import { Context, Next } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";
import { createRevenueCatService } from "@/features/webhook/services/revenuecat";

export const requireAuth = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const env = c.env as Env;

  try {
    const supabase = createSupabaseClient(env);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Token verification failed:", error?.message);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    c.set("userId", user.id);
    c.set("userEmail", user.email);

    return await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
};

export const requireActiveSubscription = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "Authorization header required",
        requiresAuth: true,
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const env = c.env as Env;

  try {
    const supabase = createSupabaseClient(env);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Token verification failed:", authError?.message);
      return c.json(
        {
          error: "Invalid or expired token",
          requiresAuth: true,
        },
        401
      );
    }

    const supabaseService = createSupabaseClient(env);
    const { data: userData, error: userError } = await supabaseService
      .from("users")
      .select("revenuecat_customer_id")
      .eq("id", user.id)
      .limit(1);

    let revenueCatUserId = userData?.[0]?.revenuecat_customer_id || user.id;

    const revenueCat = createRevenueCatService(env);

    const subscriptionInfo = await revenueCat.hasActiveSubscription(
      revenueCatUserId
    );
    console.log(
      `📊 RevenueCat subscription result:`,
      JSON.stringify(subscriptionInfo, null, 2)
    );

    return await next();
  } catch (error) {
    console.error("RevenueCat subscription auth middleware error:", error);

    return c.json(
      {
        error: "Subscription verification failed",
        requiresAuth: true,
      },
      500
    );
  }
};

export const getAuthenticatedUserId = (c: Context): string => {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error(
      "User ID not found in context. Ensure requireAuth middleware is used."
    );
  }
  return userId;
};

export const requireGuestOrUser = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  const authHeader = c.req.header("Authorization");
  const guestHeader = c.req.header("X-Guest-Token");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const env = c.env as Env;
    const supabase = createSupabaseClient(env);

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (user) {
      c.set("userId", user.id);
      c.set("userEmail", user.email);
      c.set("authType", "user");
      return await next();
    }
  }

  if (guestHeader) {
    const isValidGuestToken = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestHeader);

    if (isValidGuestToken) {
      c.set("userId", `guest_${guestHeader}`);
      c.set("authType", "guest");
      c.set("guestToken", guestHeader);
      return await next();
    }
  }

  return c.json(
    {
      error: "Authentication required (User or Guest)",
      requiresAuth: true,
    },
    401
  );
};
