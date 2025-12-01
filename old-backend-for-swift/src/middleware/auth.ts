import { Context, Next } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { Env } from "@/index";
import { createRevenueCatService } from "@/features/webhook/services/revenuecat";

/**
 * Middleware to verify Supabase JWT tokens and extract user ID
 * NOTE: This only checks authentication, not subscription status
 */
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

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Token verification failed:", error?.message);
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Store user ID in context for use in route handlers
    c.set("userId", user.id);
    c.set("userEmail", user.email);

    return await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
};

/**
 * 🚀 PROPER REVENUECAT MIDDLEWARE: Requires BOTH authentication AND active subscription
 * Uses RevenueCat SDK for real-time validation with development bypass
 */
export const requireActiveSubscription = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  // 🔓 DEVELOPMENT BYPASS: Skip subscription checks entirely in development
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    console.warn("🔓 DEVELOPMENT MODE: Bypassing subscription requirement");

    // Still need basic auth to get user ID
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
    const supabase = createSupabaseClient(env);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return c.json(
          {
            error: "Invalid or expired token",
            requiresAuth: true,
          },
          401
        );
      }

      // Set context for development
      c.set("userId", user.id);
      c.set("userEmail", user.email);
      c.set("subscriptionStatus", "dev_bypass");
      c.set("activeEntitlement", "dev_override_premium");
      c.set("subscriptionInfo", {
        hasActiveSubscription: true,
        entitlement: "dev_override_premium",
        expirationDate: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        isTrial: false,
        error: "dev_bypass_active",
      });

      return await next();
    } catch (error) {
      console.error("Development auth error:", error);
      return c.json({ error: "Authentication failed" }, 500);
    }
  }

  // PRODUCTION LOGIC: Full subscription validation
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

    // 1. Verify JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

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

    // 2. Get user's RevenueCat customer ID from database (bypass RLS with service role)
    const supabaseService = createSupabaseClient(env);
    const { data: userData, error: userError } = await supabaseService
      .from("users")
      .select("revenuecat_customer_id")
      .eq("id", user.id)
      .limit(1);

    let revenueCatUserId = userData?.[0]?.revenuecat_customer_id || user.id; // Default fallback to Supabase user.id

    // 3. Check RevenueCat subscription status (REAL-TIME VALIDATION)
    const revenueCat = createRevenueCatService(env);

    const subscriptionInfo = await revenueCat.hasActiveSubscription(
      revenueCatUserId
    );
    console.log(
      `📊 RevenueCat subscription result:`,
      JSON.stringify(subscriptionInfo, null, 2)
    );

    // 4. Validate active subscription
    if (!subscriptionInfo.hasActiveSubscription) {
      console.warn(`🚫 No active subscription for user ${user.id}`);
      return c.json(
        {
          error: "Active subscription required",
          requiresSubscription: true,
          redirectToPaywall: true,
          subscriptionInfo: {
            hasActiveSubscription: false,
            isExpired: true,
          },
        },
        402
      ); // 402 Payment Required
    }

    // Store REAL user and subscription data in context
    c.set("userId", user.id);
    c.set("userEmail", user.email);
    c.set("subscriptionStatus", "active"); // RevenueCat confirmed
    c.set("activeEntitlement", subscriptionInfo.entitlement || "pro");
    c.set("subscriptionInfo", subscriptionInfo);

    console.log(
      `✅ Authenticated request with ACTIVE REVENUECAT subscription for user: ${user.id}`,
      `Entitlement: ${subscriptionInfo.entitlement}`,
      `Trial: ${subscriptionInfo.isTrial ? "Yes" : "No"}`
    );

    return await next();
  } catch (error) {
    console.error("RevenueCat subscription auth middleware error:", error);

    // Fail-safe: deny access on errors to prevent revenue leakage
    return c.json(
      {
        error: "Subscription verification failed",
        requiresAuth: true,
      },
      500
    );
  }
};

/**
 * Helper to get authenticated user ID from context
 */
export const getAuthenticatedUserId = (c: Context): string => {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error(
      "User ID not found in context. Ensure requireAuth middleware is used."
    );
  }
  return userId;
};

/**
 * 👻 GUEST AUTHENTICATION MIDDLEWARE
 * Allows access to routes with EITHER a valid user token OR a valid guest token
 * Used for onboarding flow where user hasn't signed up yet
 */
export const requireGuestOrUser = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  const authHeader = c.req.header("Authorization");
  const guestHeader = c.req.header("X-Guest-Token");

  // 1. Try User Auth first (standard Bearer token)
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

  // 2. Try Guest Auth (X-Guest-Token header)
  if (guestHeader) {
    // Verify guest token format (simple UUID check for now, could be JWT)
    // In a real prod env, we'd verify a signed JWT issued by our backend
    const isValidGuestToken = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestHeader);

    if (isValidGuestToken) {
      c.set("userId", `guest_${guestHeader}`); // Prefix to distinguish
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
