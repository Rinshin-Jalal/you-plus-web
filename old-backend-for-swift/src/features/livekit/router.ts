import { Hono } from 'hono';
import {
  postInitiateLiveKitCall,
} from './handlers/livekit-api';

const router = new Hono();

// LiveKit Call Management Routes
// POST /livekit/initiate - Initiate a new LiveKit call
router.post('/initiate', postInitiateLiveKitCall);

export default router;

