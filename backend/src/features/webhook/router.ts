import { Hono } from 'hono';

// Import webhook handlers
import {
  postElevenLabsWebhook,
  postElevenLabsAudioWebhook,
  getElevenLabsWebhookTest,
} from './handlers/elevenlabs-webhooks';

import {
  postRevenueCatWebhook,
} from './handlers/revenuecat-webhooks';

import {
  postLiveKitWebhook,
  getLiveKitWebhookTest,
} from './handlers/livekit-webhooks';

const webhookRouter = new Hono();

// ElevenLabs Webhook Routes
webhookRouter.post('/elevenlabs', postElevenLabsWebhook);
webhookRouter.post('/elevenlabs/audio', postElevenLabsAudioWebhook);
webhookRouter.get('/elevenlabs/test', getElevenLabsWebhookTest);

// RevenueCat Webhook Routes
webhookRouter.post('/revenuecat', postRevenueCatWebhook);

// LiveKit Webhook Routes
webhookRouter.post('/livekit', postLiveKitWebhook);
webhookRouter.get('/livekit/test', getLiveKitWebhookTest);

export default webhookRouter;