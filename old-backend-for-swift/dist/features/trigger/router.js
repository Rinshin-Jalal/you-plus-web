import { Hono } from 'hono';
import { requireAuth } from '@/middleware/auth';
import { triggerUserCallAdmin, triggerVoipPushAdmin, processScheduledCallsAdmin, processRetryQueueAdmin, triggerOnboardingCallAdmin } from './handlers/triggers';
const router = new Hono();
// ===================================================================
// Manual Trigger Routes (@admin-only)
// ===================================================================
// These endpoints are for ADMIN USE ONLY - not called by iOS app
// Used for manual intervention, testing, and system operations
// Protected by requireAuth middleware - token required
// Protected by debugProtection middleware in index.ts
// ===================================================================
// @admin-only - Trigger a call for a specific user (testing/manual intervention)
router.post('/user/:userId/:callType', requireAuth, triggerUserCallAdmin);
// @admin-only - Send immediate VoIP push with custom payload (testing)
router.post('/voip', requireAuth, triggerVoipPushAdmin);
// @admin-only - Trigger onboarding call for testing
router.post('/onboarding/:userId', triggerOnboardingCallAdmin);
// @admin-only - Process scheduled calls (system operation)
router.post('/scheduled-calls', requireAuth, processScheduledCallsAdmin);
// @admin-only - Process retry queue (system operation)
router.post('/retry-queue', requireAuth, processRetryQueueAdmin);
export default router;
