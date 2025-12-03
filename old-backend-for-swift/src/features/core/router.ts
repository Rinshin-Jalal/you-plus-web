import { Hono } from "hono";
import { requireActiveSubscription, requireAuth } from "@/middleware/auth";
import { getHealth, getStats, getDebugSchedules } from "./handlers/health";
import { getCallEligibility, getScheduleSettings, updateScheduleSettings, updateSubscriptionStatus, updateRevenueCatCustomerId } from "./handlers/settings";
import { getPhoneNumber, updatePhoneNumber } from "./handlers/phone";
import { postUserPushToken } from "./handlers/token-init-push";
import { testR2Upload, testR2Connection } from "./handlers/test-r2";
import { postTestIdentityExtraction, deleteTestIdentityData } from "./handlers/debug/identity-test";
import { postGuestToken } from "./handlers/auth"; // Added import for postGuestToken
import identityRouter from "../identity/router";
import { createSupabaseClient } from "./utils/database";
import type { Env } from "@/index";

const router = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

// Health and stats endpoints (no auth required)
router.get("/health", getHealth);
router.get("/stats", getStats);
router.get("/debug/schedules", getDebugSchedules);

// Auth routes
router.post("/auth/guest", postGuestToken); // Added guest token endpoint

// Get current user info
router.get("/api/users/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const env = c.env;
  
  try {
    const supabase = createSupabaseClient(env);
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, onboarding_completed, onboarding_completed_at, created_at")
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

// API Settings endpoints
router.get("/api/calls/eligibility", requireAuth, getCallEligibility);
router.get("/api/settings/schedule", requireActiveSubscription, getScheduleSettings);
router.put("/api/settings/schedule", requireAuth, updateScheduleSettings);
router.put("/api/settings/subscription-status", requireAuth, updateSubscriptionStatus);
router.put("/api/settings/revenuecat-customer-id", requireAuth, updateRevenueCatCustomerId);

// Phone number endpoints (for Cartesia Line telephony)
router.get("/api/settings/phone", requireAuth, getPhoneNumber);
router.put("/api/settings/phone", requireAuth, updatePhoneNumber);

// API Device push token endpoints
router.put("/api/device/push-token", requireAuth, postUserPushToken);
router.post("/api/device/push-token", requireAuth, postUserPushToken);

// Test endpoints
router.get("/test-r2-upload", testR2Upload);
router.get("/test-r2-connection", testR2Connection);

// Debug endpoints
router.post("/debug/identity-test", postTestIdentityExtraction);
router.delete("/debug/identity-test/:userId", deleteTestIdentityData);

// Mount API routes
router.route("/api/identity", identityRouter);

export default router;