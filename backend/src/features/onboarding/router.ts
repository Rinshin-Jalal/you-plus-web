import { Hono } from 'hono';
import { requireActiveSubscription, requireAuth } from '@/middleware/auth';
import { z } from "zod";
import { zodJson, zodParams } from "@/middleware/zod";

// Import onboarding handlers
import { postConversionOnboardingComplete, getOnboardingJobStatus } from './handlers/conversion-complete';
import { getReturningUserOnboarding } from './handlers/returning-user';
import { ConversionCompleteSchema } from "./schemas";

const onboardingRouter = new Hono();

// Conversion Onboarding Routes (Authenticated - New 42-step flow)
// POST triggers async processing, returns jobId immediately
onboardingRouter.post(
  "/conversion/complete",
  requireActiveSubscription,
  zodJson(ConversionCompleteSchema, { errorMessage: "Invalid onboarding payload" }),
  postConversionOnboardingComplete
);

// Poll for job status (frontend calls this after POST)
onboardingRouter.get(
  "/status/:jobId",
  requireAuth,
  zodParams(z.object({ jobId: z.string().min(1) })),
  getOnboardingJobStatus
);

// Returning user onboarding (Authenticated - personalized with Gemini)
onboardingRouter.get('/returning', requireAuth, getReturningUserOnboarding);

export default onboardingRouter;