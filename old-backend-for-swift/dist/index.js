import { Hono } from "hono";
// Import feature routers
import { combinedRouter } from "@/features";
// Import individual route handlers from features (only for routes in index.ts)
import { getHealth, getStats } from "@/features/core/handlers/health";
import { postVoiceClone } from "@/features/voice/handlers/voice";
import { postDemoCall } from "@/features/voice/handlers/demo-call";
import { postCommitmentAudio } from "@/features/voice/handlers/commitment-audio";
import { postTranscribeAudio } from "@/features/voice/handlers/transcription";
import { requireActiveSubscription, requireGuestOrUser } from "@/middleware/auth";
import { corsMiddleware, debugProtection, securityHeaders, } from "@/middleware/security";
import { validateEnv } from "@/types/environment";
// Validate environment at startup
const validateEnvironment = (env) => {
    try {
        return validateEnv(env);
    }
    catch (error) {
        console.error("Environment validation failed:", error);
        throw error;
    }
};
const app = new Hono();
// Global security middleware
app.use("*", securityHeaders());
app.use("*", corsMiddleware());
// Health & Status Routes
app.get("/", getHealth);
app.get("/stats", getStats);
// Debug routes - Development only with enhanced protection
app.use("/debug/*", debugProtection());
app.use("/trigger/*", debugProtection());
// Voice & Audio Routes - Mounted directly (no router)
// These endpoints don't fit well in a feature router since they're used standalone
app.post("/voice/clone", requireGuestOrUser, postVoiceClone);
app.post("/voice/demo", requireGuestOrUser, postDemoCall);
app.post("/voice/commitment", requireGuestOrUser, postCommitmentAudio);
app.post("/transcribe/audio", requireActiveSubscription, postTranscribeAudio);
// Note: Most routes moved to feature routers:
// - Core/API routes → core/router (via combinedRouter at root)
// - Call routes → call/router
// - All others → respective feature routers
// Cron job handler for scheduled triggers
async function handleScheduledEvent(env) {
    // Validate environment before processing
    const validatedEnv = validateEnvironment(env);
    const now = new Date();
    console.log(`Cron triggered at ${now.toISOString()}`);
    try {
        const { createScheduler } = await import("@/features/trigger/services/scheduler-engine");
        const scheduler = createScheduler(validatedEnv);
        console.log("Checking for users who need a call and processing them...");
        await scheduler.processScheduledCalls();
        console.log("Scheduled check complete.");
        // NEW: Process call timeouts and retries
        const { processAllRetries } = await import("@/features/trigger/services/retry-processor");
        await processAllRetries(validatedEnv);
        // Nightly pattern profile updates removed (bloat elimination)
    }
    catch (error) {
        console.error("Cron job error:", error);
    }
}
// Export worker
export default {
    fetch: app.fetch,
    scheduled: handleScheduledEvent,
};
// Error handling middleware
app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
    }, 500);
});
// 404 handler
app.notFound((c) => {
    return c.json({
        error: "Endpoint not found",
        available_endpoints: [
            "GET /",
            "POST /trigger/morning",
            "POST /trigger/evening",
            "POST /trigger/user/:userId/:callType",
            "POST /trigger/voip",
            "POST /voice/clone",
            "GET /stats",
            "GET /debug/schedules",
            "GET /test",
            "GET /test-r2-connection",
            "GET /test-r2-upload",
            "POST /call/:userId/:callType",
            "GET /prompt-demo/:userId/:callType",
            "GET /prompt-demo-quick/:userId",
            "POST /transcribe/audio",
            "GET /api/history/calls",
            "PUT /api/device/push-token",
            "POST /api/device/push-token",
            "GET /api/settings/schedule",
            "PUT /api/settings/subscription-status",
            "PUT /api/settings/revenuecat-customer-id",
            "GET /api/calls/eligibility",
            "## Feature-based Routes",
            "GET /webhook/elevenlabs",
            "POST /webhook/elevenlabs",
            "POST /webhook/elevenlabs/audio",
            "POST /api/onboarding/conversion/complete",
            "POST /api/onboarding/analyze-voice",
            "GET /api/identity/:userId",
            "PUT /api/identity/:userId",
            "PUT /api/identity/status/:userId",
            "PUT /api/identity/final-oath/:userId",
            "GET /api/identity/stats/:userId",
        ],
    }, 404);
});
// Feature-level routers - All routes now handled by combinedRouter
app.route("/", combinedRouter);
// 🔍 CATCH-ALL HANDLER: For debugging wrong URLs (MUST BE LAST!)
app.all("*", (c) => {
    const url = c.req.url;
    const method = c.req.method;
    console.log(`🚨 CATCH-ALL: ${method} ${url} - Endpoint not found!`);
    return c.json({
        success: false,
        error: "Endpoint not found",
        details: `No route matches ${method} ${url}`,
        availableRoutes: [
            "GET /test",
            "GET /test-r2-connection",
            "GET /test-r2-upload",
            "POST /call/:userId/:callType",
            "GET /prompt-demo/:userId/:callType",
            "GET /prompt-demo-quick/:userId",
            "POST /voice/clone",
            "POST /transcribe/audio",
            "GET /api/history/calls",
            "PUT /api/device/push-token",
            "POST /api/device/push-token",
            "GET /api/settings/schedule",
            "PUT /api/settings/subscription-status",
            "PUT /api/settings/revenuecat-customer-id",
            "GET /api/calls/eligibility",
            "## Feature-based Routes",
            "GET /webhook/elevenlabs",
            "POST /webhook/elevenlabs",
            "POST /webhook/elevenlabs/audio",
            "POST /api/onboarding/conversion/complete",
            "POST /api/onboarding/analyze-voice",
            "GET /api/identity/:userId",
            "PUT /api/identity/:userId",
            "PUT /api/identity/status/:userId",
            "PUT /api/identity/final-oath/:userId",
            "GET /api/identity/stats/:userId",
        ],
        timestamp: new Date().toISOString(),
        backendUrl: c.req.url.split("/")[2], // Extract domain
    }, 404);
});
