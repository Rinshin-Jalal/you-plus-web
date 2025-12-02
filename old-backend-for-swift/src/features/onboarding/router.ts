import { Hono } from 'hono';
import { requireActiveSubscription, requireAuth } from '@/middleware/auth';

// Import onboarding handlers
import { postConversionOnboardingComplete } from './handlers/conversion-complete';
import { postOnboardingAnalyzeVoice } from '../voice/handlers/voice';
import { getReturningUserOnboarding } from './handlers/returning-user';

const onboardingRouter = new Hono();

// Conversion Onboarding Routes (Authenticated - New 42-step flow)
onboardingRouter.post('/conversion/complete', requireActiveSubscription, postConversionOnboardingComplete);

// Voice analysis for onboarding (Pre-auth onboarding)
onboardingRouter.post('/analyze-voice', postOnboardingAnalyzeVoice);

// Returning user onboarding (Authenticated - personalized with Gemini)
onboardingRouter.get('/returning', requireAuth, getReturningUserOnboarding);

export default onboardingRouter;