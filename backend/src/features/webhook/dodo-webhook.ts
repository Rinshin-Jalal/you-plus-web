import { Hono } from 'hono';
import type { Env } from '@/index';
import { createSupabaseClient } from '@/features/core/utils/database';

const dodoWebhook = new Hono<{ Bindings: Env }>();

dodoWebhook.post('/', async (c) => {
  const env = c.env;

  try {
    const secret = env.DODO_PAYMENTS_WEBHOOK_SECRET;
    if (!secret) {
      console.error('Webhook secret not configured');
      return c.json({ error: 'Server not configured' }, 500);
    }

    // Standard Webhooks headers
    const id = c.req.header('webhook-id') || '';
    const timestamp = c.req.header('webhook-timestamp') || '';
    const signatureHeader = c.req.header('webhook-signature') || '';

    if (!id || !timestamp || !signatureHeader) {
      return c.json({ error: 'Missing webhook signature headers' }, 400);
    }

    const rawBody = await c.req.text();

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const toSign = `${id}.${timestamp}.${rawBody}`;
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
    const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');

    const provided = parseProvidedSignature(signatureHeader);
    if (!provided || !timingSafeEqual(expected, provided)) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const payload = JSON.parse(rawBody);
    console.log('DodoPayments webhook received:', payload.type);

    switch (payload.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data, env);
        break;
      case 'payment.failed':
        await handlePaymentFailed(payload.data, env);
        break;

      case 'subscription.active':
        await handleSubscriptionCreated(payload.data, env);
        break;
      case 'subscription.renewed':
        await handleSubscriptionUpdated(payload.data, env);
        break;
      case 'subscription.on_hold':
        await handleSubscriptionOnHold(payload.data, env);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.data, env);
        break;
      case 'subscription.failed':
        await handleSubscriptionFailed(payload.data, env);
        break;
      case 'subscription.expired':
        await handleSubscriptionExpired(payload.data, env);
        break;
      case 'subscription.plan_changed':
        await handleSubscriptionUpdated(payload.data, env);
        break;

      default:
        console.log('Unhandled webhook event type:', payload.type);
    }

    return c.json({ received: true }, 200);
  } catch (error) {
    console.error('Error processing DodoPayments webhook:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

function parseProvidedSignature(header: string): string | null {
  try {
    if (header.includes('=')) {
      const parts = header.split(',').map((p) => p.trim());
      for (const p of parts) {
        const [k, v] = p.split('=');
        if (k === 'v1' && v) return v;
      }
      return null;
    }
    return header.trim();
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function handleSubscriptionCreated(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const userId = data.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  console.log(`Creating subscription for user ${userId}`);

  // Upsert into subscriptions table
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    payment_provider: 'dodopayments',
    status: 'active',
    provider_subscription_id: data.subscription_id,
    provider_customer_id: data.customer_id,
    plan_id: data.product_id,
    plan_name: data.product_name || 'Pro Plan',
    amount_cents: data.amount_cents,
    currency: data.currency || 'INR',
    started_at: data.created_at || new Date().toISOString(),
    current_period_start: data.current_period_start,
    current_period_end: data.current_period_end,
    metadata: data.metadata,
  });

  // Also update the user's subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .eq('id', userId);

  console.log(`Subscription created successfully for user ${userId}`);
}

async function handleSubscriptionUpdated(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) {
    console.error('Subscription not found:', data.subscription_id);
    return;
  }

  console.log(`Updating subscription ${data.subscription_id}`);

  await supabase
    .from('subscriptions')
    .update({
      status: data.status,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      metadata: data.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: data.status })
    .eq('id', existingSub.user_id);
}

async function handleSubscriptionCancelled(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) {
    console.error('Subscription not found:', data.subscription_id);
    return;
  }

  console.log(`Cancelling subscription ${data.subscription_id}`);

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'cancelled' })
    .eq('id', existingSub.user_id);
}

async function handleSubscriptionOnHold(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'on_hold',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'on_hold' })
    .eq('id', existingSub.user_id);
}

async function handleSubscriptionFailed(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'failed' })
    .eq('id', existingSub.user_id);
}

async function handleSubscriptionExpired(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) return;

  await supabase
    .from('subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'expired' })
    .eq('id', existingSub.user_id);
}

async function handlePaymentSucceeded(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) {
    console.log('Payment succeeded for unknown subscription');
    return;
  }

  console.log(`Payment succeeded for subscription ${data.subscription_id}`);

  // Reactivate subscription if it was past_due
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id)
    .eq('status', 'past_due');

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .eq('id', existingSub.user_id);
}

async function handlePaymentFailed(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_subscription_id', data.subscription_id)
    .single();

  if (!existingSub) {
    console.log('Payment failed for unknown subscription');
    return;
  }

  console.log(`Payment failed for subscription ${data.subscription_id}`);

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Update user subscription_status
  await supabase
    .from('users')
    .update({ subscription_status: 'past_due' })
    .eq('id', existingSub.user_id);

  console.log(`User ${existingSub.user_id} needs to update payment method`);
}

export default dodoWebhook;
