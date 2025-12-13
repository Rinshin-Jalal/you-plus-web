import { Hono } from "hono";
import { z } from "zod";
import { requireActiveSubscription, requireAuth } from "@/middleware/auth";
import { zodJson } from "@/middleware/zod";
import { getHealth, getStats } from "./handlers/health";
import { getScheduleSettings, updateScheduleSettings, updateSubscriptionStatus } from "./handlers/settings";
import { getPhoneNumber, updatePhoneNumber } from "./handlers/phone";
import { postGuestToken } from "./handlers/auth";
import { createSupabaseClient } from "./utils/database";
import type { Env } from "@/index";

const UpdateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    timezone: z.string().min(1).optional(),
  })
  .refine((data) => data.name !== undefined || data.timezone !== undefined, {
    message: "At least one field (name or timezone) must be provided",
  });

const UpdateScheduleSettingsSchema = z.object({
  // HH:MM:SS or HH:MM
  callWindowStart: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
      "Invalid time format. Use HH:MM:SS or HH:MM"
    ),
  timezone: z.string().min(1).optional(),
});

const UpdateSubscriptionStatusSchema = z.object({
  isActive: z.boolean(),
  isEntitled: z.boolean(),
});

const UpdatePhoneNumberSchema = z.object({
  phone_number: z
    .string()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Invalid phone number format. Must be E.164 format (e.g., +14155551234)"
    ),
});

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
router.put(
  "/api/core/profile",
  requireAuth,
  zodJson(UpdateProfileSchema, { errorMessage: "Invalid profile update payload" }),
  async (c) => {
  const userId = c.get("userId");
  const env = c.env;
  const body = c.get("validatedJson") as z.infer<typeof UpdateProfileSchema>;
  
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
router.put(
  "/api/settings/schedule",
  requireAuth,
  zodJson(UpdateScheduleSettingsSchema, { errorMessage: "Invalid schedule settings payload" }),
  updateScheduleSettings
);
router.put(
  "/api/settings/subscription-status",
  requireAuth,
  zodJson(UpdateSubscriptionStatusSchema, { errorMessage: "Invalid subscription status data" }),
  updateSubscriptionStatus
);

// Phone number endpoints
router.get("/api/settings/phone", requireAuth, getPhoneNumber);
router.put(
  "/api/settings/phone",
  requireAuth,
  zodJson(UpdatePhoneNumberSchema, { errorMessage: "Invalid phone number payload" }),
  updatePhoneNumber
);

export default router;
