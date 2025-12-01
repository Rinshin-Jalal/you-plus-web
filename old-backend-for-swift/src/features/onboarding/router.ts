import { Hono } from 'hono';
import { requireActiveSubscription } from '@/middleware/auth';

// Import onboarding handlers
import { postConversionOnboardingComplete } from './handlers/conversion-complete';
import { postOnboardingAnalyzeVoice } from '../voice/handlers/voice';

const onboardingRouter = new Hono();

// Conversion Onboarding Routes (Authenticated - New 42-step flow)
onboardingRouter.post('/conversion/complete', requireActiveSubscription, postConversionOnboardingComplete);

// Voice analysis for onboarding (Pre-auth onboarding)
onboardingRouter.post('/analyze-voice', postOnboardingAnalyzeVoice);

export default onboardingRouter;