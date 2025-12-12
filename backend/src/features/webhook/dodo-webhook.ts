/**
 * DodoPayments Webhook Handler
 *
 * This webhook is now a thin layer that:
 * 1. Validates the webhook signature
 * 2. Parses the payload
 * 3. Emits domain events to the event bus
 *
 * All business logic has been moved to event handlers in @/features/billing/handlers/events.ts
 */

import { Hono } from 'hono';
import DodoPayments from 'dodopayments';
import type { Env } from '@/index';
import { eventBus } from '@/events';

const dodoWebhook = new Hono<{ Bindings: Env }>();

dodoWebhook.post('/', async (c) => {
  const env = c.env;

  try {
    // ═══════════════════════════════════════════════════════════════
    // VALIDATE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    const secret = env.DODO_PAYMENTS_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[Webhook] Webhook secret not configured');
      return c.json({ error: 'Server not configured' }, 500);
    }

    // ═══════════════════════════════════════════════════════════════
    // VERIFY SIGNATURE
    // ═══════════════════════════════════════════════════════════════
    const id = c.req.header('webhook-id') || '';
    const timestamp = c.req.header('webhook-timestamp') || '';
    const signatureHeader = c.req.header('webhook-signature') || '';

    if (!id || !timestamp || !signatureHeader) {
      return c.json({ error: 'Missing webhook signature headers' }, 400);
    }

    const rawBody = await c.req.text();

    // Create DodoPayments client for webhook verification
    let environment: 'test_mode' | 'live_mode' = 'test_mode';
    const envValue = env.DODO_PAYMENTS_ENVIRONMENT?.toLowerCase();
    if (
      envValue === 'live' ||
      envValue === 'live_mode' ||
      envValue === 'production'
    ) {
      environment = 'live_mode';
    }

    const client = new DodoPayments({
      bearerToken: env.DODO_PAYMENTS_API_KEY,
      environment: environment,
    });

    // Use SDK's unwrap method for signature verification
    let payload;
    try {
      payload = client.webhooks.unwrap(rawBody, {
        headers: {
          'webhook-id': id,
          'webhook-signature': signatureHeader,
          'webhook-timestamp': timestamp,
        },
        key: secret,
      });
    } catch (verifyError) {
      console.error('[Webhook] Signature verification failed:', verifyError);
      return c.json({ error: 'Invalid signature' }, 401);
    }

    console.log('[Webhook] DodoPayments webhook received:', payload.type);

    // ═══════════════════════════════════════════════════════════════
    // EMIT DOMAIN EVENTS
    // ═══════════════════════════════════════════════════════════════
    const eventType = payload.type as string;
    const eventData = (payload as any).data;

    // Extract common fields
    const userId = eventData.metadata?.user_id;
    const customerId = eventData.customer?.customer_id;
    const customerEmail = eventData.customer?.email;
    const customerName = eventData.customer?.name;
    const subscriptionId = eventData.subscription_id;

    switch (eventType) {
      // ─────────────────────────────────────────────────────────────────
      // SUBSCRIPTION EVENTS
      // ─────────────────────────────────────────────────────────────────
      case 'subscription.active':
        if (!userId) {
          console.error('[Webhook] No user_id in subscription metadata');
          break;
        }
        if (!customerId) {
          console.error('[Webhook] No customer_id in payload');
          break;
        }
        await eventBus.emit(
          {
            type: 'subscription.created',
            userId,
            customerId,
            plan: eventData.product_id || 'unknown',
            email: customerEmail,
            customerName,
          },
          env
        );
        break;

      case 'subscription.renewed':
      case 'subscription.updated':
      case 'subscription.plan_changed':
        if (userId) {
          await eventBus.emit(
            {
              type: 'subscription.renewed',
              userId,
              subscriptionId,
            },
            env
          );
        } else {
          console.log(`[Webhook] ${eventType}: No userId, skipping event`);
        }
        break;

      case 'subscription.on_hold':
        if (userId) {
          await eventBus.emit(
            {
              type: 'subscription.on_hold',
              userId,
              subscriptionId,
            },
            env
          );
        } else {
          console.log('[Webhook] subscription.on_hold: No userId, skipping event');
        }
        break;

      case 'subscription.cancelled':
        if (userId) {
          await eventBus.emit(
            {
              type: 'subscription.cancelled',
              userId,
              subscriptionId,
            },
            env
          );
        } else {
          console.log('[Webhook] subscription.cancelled: No userId, skipping event');
        }
        break;

      case 'subscription.failed':
        if (userId) {
          await eventBus.emit(
            {
              type: 'subscription.failed',
              userId,
              subscriptionId,
            },
            env
          );
        } else {
          console.log('[Webhook] subscription.failed: No userId, skipping event');
        }
        break;

      case 'subscription.expired':
        if (userId) {
          await eventBus.emit(
            {
              type: 'subscription.expired',
              userId,
              subscriptionId,
            },
            env
          );
        } else {
          console.log('[Webhook] subscription.expired: No userId, skipping event');
        }
        break;

      // ─────────────────────────────────────────────────────────────────
      // PAYMENT EVENTS
      // ─────────────────────────────────────────────────────────────────
      case 'payment.succeeded':
        await eventBus.emit(
          {
            type: 'payment.succeeded',
            userId,
            subscriptionId,
            amountCents: eventData.amount,
          },
          env
        );
        break;

      case 'payment.failed':
        await eventBus.emit(
          {
            type: 'payment.failed',
            userId,
            subscriptionId,
          },
          env
        );
        break;

      default:
        console.log('[Webhook] Unhandled event type:', eventType);
    }

    return c.json({ received: true }, 200);
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export default dodoWebhook;
