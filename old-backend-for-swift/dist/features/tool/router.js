import { Hono } from 'hono';
import { requireActiveSubscription } from '@/middleware/auth';
// Import tool handlers
import { postToolAnalyzeBehavioralPatterns, postToolAnalyzeExcusePattern, postToolCompletePromise, postToolCreatePromise, postToolDeliverConsequence, postToolDetectBreakthroughMoments, postToolGetExcuseHistory, postToolGetOnboardingIntelligence, postToolGetPsychologicalProfile, postToolGetUserContext, postToolSearchMemories, } from './handlers/tool-handlers';
// Import trigger handlers
import { triggerEveningCallsAdmin, triggerMorningCallsAdmin, triggerUserCallAdmin, triggerVoipPushAdmin, } from './handlers/triggers';
const toolRouter = new Hono();
// Tool Routes (Subscription Required)
toolRouter.post('/search-memories', requireActiveSubscription, postToolSearchMemories);
toolRouter.post('/create-promise', requireActiveSubscription, postToolCreatePromise);
toolRouter.post('/complete-promise', requireActiveSubscription, postToolCompletePromise);
toolRouter.post('/get-user-context', requireActiveSubscription, postToolGetUserContext);
toolRouter.post('/get-excuse-history', requireActiveSubscription, postToolGetExcuseHistory);
toolRouter.post('/get-onboarding-intelligence', requireActiveSubscription, postToolGetOnboardingIntelligence);
toolRouter.post('/deliver-consequence', requireActiveSubscription, postToolDeliverConsequence);
toolRouter.post('/analyze-behavioral-patterns', requireActiveSubscription, postToolAnalyzeBehavioralPatterns);
toolRouter.post('/get-psychological-profile', requireActiveSubscription, postToolGetPsychologicalProfile);
toolRouter.post('/analyze-excuse-pattern', requireActiveSubscription, postToolAnalyzeExcusePattern);
toolRouter.post('/detect-breakthrough-moments', requireActiveSubscription, postToolDetectBreakthroughMoments);
// Trigger Routes (Admin Only)
toolRouter.post('/trigger/morning-calls', triggerMorningCallsAdmin);
toolRouter.post('/trigger/evening-calls', triggerEveningCallsAdmin);
toolRouter.post('/trigger/user/:userId/:callType', triggerUserCallAdmin);
toolRouter.post('/trigger/voip', triggerVoipPushAdmin);
export default toolRouter;
