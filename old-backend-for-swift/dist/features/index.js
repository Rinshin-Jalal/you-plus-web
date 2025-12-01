// Feature routers
export { default as identityRouter } from "./identity/router";
export { default as onboardingRouter } from "./onboarding/router";
export { default as webhookRouter } from "./webhook/router";
export { default as triggerRouter } from "./trigger/router";
export { default as voipRouter } from "./voip/router";
export { default as callRouter } from "./call/router";
export { default as coreRouter } from "./core/router";
// Note: Voice feature has no router - endpoints mounted directly in index.ts
// Combined router
export { default as combinedRouter } from "./routers";
