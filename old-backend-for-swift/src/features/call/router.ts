import { Hono } from 'hono';
import { getCallConfig } from './handlers/call-config';
import { postCallReport } from './handlers/call-report';
import { requireActiveSubscription } from '@/middleware/auth';

const router = new Hono();

// Generate call configuration for 11labs Convo AI calls
// GET /call/config/:userId/:callType
router.get('/config/:userId/:callType', requireActiveSubscription, getCallConfig);

// Receive call completion reports from Cartesia agent
// POST /api/calls/report
// Note: No auth required - agent calls this with internal data
router.post('/report', postCallReport);

export default router;