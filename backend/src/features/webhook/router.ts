import { Hono } from 'hono';

import {
  postRevenueCatWebhook,
} from './handlers/revenuecat-webhooks';

const webhookRouter = new Hono();

// RevenueCat Webhook Routes
webhookRouter.post('/revenuecat', postRevenueCatWebhook);

export default webhookRouter;
