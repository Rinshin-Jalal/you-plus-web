import { Hono } from "hono";

// Import feature routers
import { combinedRouter } from "@/features";

// Import individual route handlers from features
import { getHealth, getStats } from "@/features/core/handlers/health";
import { corsMiddleware, securityHeaders } from "@/middleware/security";
import { sentryMiddleware, captureExceptionFromContext } from "@/lib/sentry";

// Event-driven architecture
import { registerAllEventHandlers } from "@/events";

import { Env, validateEnv } from "@/types/environment";
// Re-export Env type so other modules can import from "@/index"
export type { Env } from "@/types/environment";

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════
// This runs once when the worker is initialized
registerAllEventHandlers();

const app = new Hono<{ Bindings: Env }>();

// Sentry middleware (must be first to capture all errors)
app.use("*", sentryMiddleware());

// Global security middleware
app.use("*", securityHeaders());
app.use("*", corsMiddleware());

// Health & Status Routes
app.get("/", getHealth);
app.get("/stats", getStats);

// Error handling middleware
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  // Capture unhandled errors in Sentry
  captureExceptionFromContext(c, err, {
    path: c.req.path,
    method: c.req.method,
    url: c.req.url,
  });
  return c.json(
    {
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Endpoint not found",
      available_endpoints: [
        "GET /",
        "GET /stats",
        "GET /health",
        "GET /api/core/profile",
        "PUT /api/core/profile",
        "DELETE /api/core/profile",
        "GET /api/settings/schedule",
        "PUT /api/settings/schedule",
        "PUT /api/settings/subscription-status",
        "GET /api/settings/phone",
        "PUT /api/settings/phone",
        "POST /api/onboarding/conversion/complete",
        "GET /api/onboarding/returning",
        "POST /api/billing/checkout/create",
        "POST /api/billing/checkout/create-guest",
        "GET /api/billing/subscription",
        "GET /api/billing/plans",
        "POST /api/billing/cancel",
        "POST /webhook/dodopayments",
        "POST /webhook/call/completed",
        "POST /webhook/call/started",
        "POST /webhook/call/missed",
      ],
    },
    404
  );
});

// Feature-level routers - All routes handled by combinedRouter
app.route("/", combinedRouter);

// Export worker
// Note: Daily call scheduling is now handled by AWS EventBridge Scheduler
// Each user gets their own schedule at their preferred call time
// See: /lambda/daily-call-trigger/ and /backend/src/services/scheduler.ts
export default {
  fetch: app.fetch,
};
