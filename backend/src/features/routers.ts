import { Hono } from "hono";
import identityRouter from "./identity/router";
import onboardingRouter from "./onboarding/router";
import webhookRouter from "./webhook/router";
import triggerRouter from "./trigger/router";
import voipRouter from "./voip/router";
import callRouter from "./call/router";
import coreRouter from "./core/router";
import billingRouter from "./billing/router";
import dodoWebhook from "./webhook/dodo-webhook";

// Create a combined router that includes all feature routers
const combinedRouter = new Hono();

// Mount all feature routers with their respective paths
combinedRouter.route("/identity", identityRouter);
combinedRouter.route("/api/onboarding", onboardingRouter);
combinedRouter.route("/api/billing", billingRouter);
combinedRouter.route("/api/calls", callRouter);  // Cartesia agent calls /api/calls/report
combinedRouter.route("/webhook", webhookRouter);
combinedRouter.route("/webhook/dodopayments", dodoWebhook);
combinedRouter.route("/trigger", triggerRouter);
combinedRouter.route("/voip", voipRouter);
combinedRouter.route("/call", callRouter);  // Legacy path for backwards compatibility

// NOTE: LiveKit removed (migration 003) - using Cartesia Line SDK for calls

// Core router mounted at root to handle /api/*, /debug/*, etc.
combinedRouter.route("/", coreRouter);

// Note: Voice endpoints are mounted directly in index.ts:
// - /voice/clone (voice cloning)
// - /transcribe/audio (transcription)

export default combinedRouter;