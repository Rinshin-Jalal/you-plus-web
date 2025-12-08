import { Context, Next } from "hono";
import { createSupabaseClient } from "@/features/core/utils/database";
import { createDodoPaymentsService } from "@/features/billing/dodopayments-service";
import { Env } from "@/index";

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

    // Get user's DodoPayments customer ID from database
    const { data: userData } = await supabase
      .from("users")
      .select("dodo_customer_id")
      .eq("id", user.id)
      .single();

    if (!userData?.dodo_customer_id) {
      console.log("[requireActiveSubscription] No dodo_customer_id for user:", user.id);
      return c.json(
        {
          error: "Active subscription required",
          requiresSubscription: true,
        },
        403
      );
    }

    // Check DodoPayments directly for active subscription
    const dodo = createDodoPaymentsService(env);
    const subscriptions = await dodo.getCustomerSubscriptions(userData.dodo_customer_id);
    
    console.log("[requireActiveSubscription] Found subscriptions:", subscriptions.length);
    
    const activeSubscription = subscriptions.find(sub => 
      sub.status === "active" && 
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
    );

    if (!activeSubscription) {
      console.log("[requireActiveSubscription] No active subscription found for customer:", userData.dodo_customer_id);
      return c.json(
        {
          error: "Active subscription required",
          requiresSubscription: true,
        },
        403
      );
    }

    console.log("[requireActiveSubscription] Active subscription found:", activeSubscription.subscription_id);

    c.set("userId", user.id);
    c.set("userEmail", user.email);

    return await next();
  } catch (error) {
    console.error("Subscription auth middleware error:", error);

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
