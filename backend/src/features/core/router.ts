import { Hono } from "hono";
import { requireActiveSubscription, requireAuth } from "@/middleware/auth";
import { getHealth, getStats } from "./handlers/health";
import { getScheduleSettings, updateScheduleSettings, updateSubscriptionStatus } from "./handlers/settings";
import { getPhoneNumber, updatePhoneNumber } from "./handlers/phone";
import { postGuestToken } from "./handlers/auth";
import { createSupabaseClient } from "./utils/database";
import type { Env } from "@/index";

const router = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

// Health endpoints (no auth required)
router.get("/health", getHealth);
router.get("/stats", getStats);

// Auth routes
router.post("/auth/guest", postGuestToken);

// Get current user profile
router.get("/api/core/profile", requireAuth, async (c) => {
  const userId = c.get("userId");
  const env = c.env;
  
  try {
    const supabase = createSupabaseClient(env);
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, timezone, onboarding_completed, onboarding_completed_at, created_at")
      .eq("id", userId)
      .single();
    
    if (error || !user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Update user profile
router.put("/api/core/profile", requireAuth, async (c) => {
  const userId = c.get("userId");
  const env = c.env;
  const body = await c.req.json();
  
  try {
    const supabase = createSupabaseClient(env);
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    
    const { data: user, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, name, timezone")
      .single();
    
    if (error) {
      return c.json({ error: "Failed to update profile" }, 500);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// Delete user account
router.delete("/api/core/profile", requireAuth, async (c) => {
  const userId = c.get("userId");
  const env = c.env;
  
  try {
    const supabase = createSupabaseClient(env);
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);
    
    if (error) {
      return c.json({ error: "Failed to delete account" }, 500);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Failed to delete account" }, 500);
  }
});

// Settings endpoints
router.get("/api/settings/schedule", requireActiveSubscription, getScheduleSettings);
router.put("/api/settings/schedule", requireAuth, updateScheduleSettings);
router.put("/api/settings/subscription-status", requireAuth, updateSubscriptionStatus);

// Phone number endpoints
router.get("/api/settings/phone", requireAuth, getPhoneNumber);
router.put("/api/settings/phone", requireAuth, updatePhoneNumber);

export default router;
