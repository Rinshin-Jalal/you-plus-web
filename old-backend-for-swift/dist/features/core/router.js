import { Hono } from "hono";
import { requireActiveSubscription, requireAuth } from "@/middleware/auth";
import { getHealth, getStats, getDebugSchedules } from "./handlers/health";
import { getCallEligibility, getScheduleSettings, updateScheduleSettings, updateSubscriptionStatus, updateRevenueCatCustomerId } from "./handlers/settings";
import { postUserPushToken } from "./handlers/token-init-push";
import { testR2Upload, testR2Connection } from "./handlers/test-r2";
import { postTestIdentityExtraction, deleteTestIdentityData } from "./handlers/debug/identity-test";
import { postGuestToken } from "./handlers/auth"; // Added import for postGuestToken
import identityRouter from "../identity/router";
const router = new Hono();
// Health and stats endpoints (no auth required)
router.get("/health", getHealth);
router.get("/stats", getStats);
router.get("/debug/schedules", getDebugSchedules);
// Auth routes
router.post("/auth/guest", postGuestToken); // Added guest token endpoint
// API Settings endpoints
router.get("/api/calls/eligibility", requireAuth, getCallEligibility);
router.get("/api/settings/schedule", requireActiveSubscription, getScheduleSettings);
router.put("/api/settings/schedule", requireAuth, updateScheduleSettings);
router.put("/api/settings/subscription-status", requireAuth, updateSubscriptionStatus);
router.put("/api/settings/revenuecat-customer-id", requireAuth, updateRevenueCatCustomerId);
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
