import { Hono } from 'hono';
import { getCallConfig } from './handlers/call-config';
import { requireActiveSubscription } from '@/middleware/auth';
const router = new Hono();
// Generate call configuration for 11labs Convo AI calls
// GET /call/config/:userId/:callType
router.get('/config/:userId/:callType', requireActiveSubscription, getCallConfig);
export default router;
