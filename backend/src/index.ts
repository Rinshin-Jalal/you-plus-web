import { Hono } from "hono";

// Import feature routers
import { combinedRouter } from "@/features";

// Import individual route handlers from features
import { getHealth, getStats } from "@/features/core/handlers/health";
import { corsMiddleware, securityHeaders } from "@/middleware/security";

import { Env, validateEnv } from "@/types/environment";
// Re-export Env type so other modules can import from "@/index"
export type { Env } from "@/types/environment";

const app = new Hono<{ Bindings: Env }>();

// Global security middleware
app.use("*", securityHeaders());
app.use("*", corsMiddleware());

// Health & Status Routes
app.get("/", getHealth);
app.get("/stats", getStats);

// Error handling middleware
app.onError((err, c) => {
  console.error("Unhandled error:", err);
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
        "POST /webhook/revenuecat",
        "POST /webhook/dodopayments",
      ],
    },
    404
  );
});

// Feature-level routers - All routes handled by combinedRouter
app.route("/", combinedRouter);

// Export worker (no scheduled handler - calls handled by agent)
export default {
  fetch: app.fetch,
};
