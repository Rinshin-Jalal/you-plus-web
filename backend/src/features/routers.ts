import { Hono } from "hono";
import onboardingRouter from "./onboarding/router";
import webhookRouter from "./webhook/router";
import coreRouter from "./core/router";
import billingRouter from "./billing/router";
import cartesiaRouter from "./cartesia/router";
import dodoWebhook from "./webhook/dodo-webhook";
import callWebhook from "./webhook/call-webhook";
import livekitRouter from "./livekit/router";

// Create a combined router that includes all feature routers
const combinedRouter = new Hono();

// Mount all feature routers with their respective paths
combinedRouter.route("/api/onboarding", onboardingRouter);
combinedRouter.route("/api/billing", billingRouter);
combinedRouter.route("/api/cartesia", cartesiaRouter);
combinedRouter.route("/api/livekit", livekitRouter);
combinedRouter.route("/webhook", webhookRouter);
combinedRouter.route("/webhook/dodopayments", dodoWebhook);
combinedRouter.route("/webhook/call", callWebhook);
combinedRouter.route("/api/livekit", livekitRouter);

// Core router mounted at root to handle /api/*, /health, etc.
combinedRouter.route("/", coreRouter);

export default combinedRouter;
