import { Hono } from 'hono';
import { requireActiveSubscription } from '@/middleware/auth';

// Import identity handlers
import {
  getCurrentIdentity,
  getIdentityStats,
  updateIdentity,
  updateIdentityStatus,
} from './handlers/identity';

const identityRouter = new Hono();

// Identity Routes (Subscription Required)
identityRouter.get('/:userId', requireActiveSubscription, getCurrentIdentity);
identityRouter.put('/:userId', requireActiveSubscription, updateIdentity);
identityRouter.put('/status/:userId', requireActiveSubscription, updateIdentityStatus);
identityRouter.get('/stats/:userId', requireActiveSubscription, getIdentityStats);

export default identityRouter;