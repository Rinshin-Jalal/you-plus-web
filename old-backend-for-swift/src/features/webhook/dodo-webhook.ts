/**
 * DodoPayments Webhook Handler
 * Processes subscription events from DodoPayments
 */

import { Hono } from 'hono';
import type { Env } from '@/index';
import { createSupabaseClient } from '@/features/core/utils/database';

const dodoWebhook = new Hono<{ Bindings: Env }>();

/**
 * POST /webhook/dodopayments
 * Handle DodoPayments webhook events
 */
dodoWebhook.post('/', async (c) => {
  const env = c.env;

  try {
    // Get webhook payload
    const payload = await c.req.json();
    const signature = c.req.header('dodo-signature') || '';

    // Verify webhook signature (implement based on DodoPayments docs)
    // const isValid = verifyWebhookSignature(payload, signature, env.DODO_PAYMENTS_WEBHOOK_SECRET);
    // if (!isValid) {
    //   return c.json({ error: 'Invalid signature' }, 401);
    // }

    console.log('DodoPayments webhook received:', payload.type);

    // Handle different event types
    switch (payload.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(payload.data, env);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(payload.data, env);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(payload.data, env);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.data, env);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(payload.data, env);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.data, env);
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

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(data: any, env: Env) {
  const supabase = createSupabaseClient(env);
  const userId = data.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  console.log(`Checkout completed for user ${userId}`);

  // The subscription should be created by subscription.created event
  // This is just for logging
  await supabase.from('subscription_history').insert({
    user_id: userId,
    payment_provider: 'dodopayments',
    event_type: 'payment_succeeded',
    new_status: 'active',
    provider_transaction_id: data.payment_id || data.session_id,
    metadata: data,
  });
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  // Get user_id from metadata
  const userId = data.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  console.log(`Creating subscription for user ${userId}`);

  // Create or update subscription
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

  // Log event
  await supabase.from('subscription_history').insert({
    user_id: userId,
    payment_provider: 'dodopayments',
    event_type: 'subscription_created',
    new_status: 'active',
    provider_subscription_id: data.subscription_id,
    metadata: data,
  });

  console.log(`Subscription created successfully for user ${userId}`);
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  // Find subscription by provider ID
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

  // Update subscription
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

  // Log event
  await supabase.from('subscription_history').insert({
    user_id: existingSub.user_id,
    payment_provider: 'dodopayments',
    event_type: 'subscription_updated',
    previous_status: existingSub.status,
    new_status: data.status,
    provider_subscription_id: data.subscription_id,
    metadata: data,
  });
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  // Find subscription
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

  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Log event
  await supabase.from('subscription_history').insert({
    user_id: existingSub.user_id,
    payment_provider: 'dodopayments',
    event_type: 'subscription_cancelled',
    previous_status: existingSub.status,
    new_status: 'cancelled',
    provider_subscription_id: data.subscription_id,
    metadata: data,
  });
}

/**
 * Handle payment.succeeded event
 */
async function handlePaymentSucceeded(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  // Find subscription
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

  // Log event
  await supabase.from('subscription_history').insert({
    user_id: existingSub.user_id,
    payment_provider: 'dodopayments',
    event_type: 'payment_succeeded',
    new_status: 'active',
    provider_transaction_id: data.payment_id,
    provider_subscription_id: data.subscription_id,
    metadata: data,
  });

  // Update subscription to active if it was past_due
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id)
    .eq('status', 'past_due');
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  // Find subscription
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

  // Update subscription to past_due
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', data.subscription_id);

  // Log event
  await supabase.from('subscription_history').insert({
    user_id: existingSub.user_id,
    payment_provider: 'dodopayments',
    event_type: 'payment_failed',
    previous_status: existingSub.status,
    new_status: 'past_due',
    provider_transaction_id: data.payment_id,
    provider_subscription_id: data.subscription_id,
    metadata: data,
  });

  // TODO: Send email notification to user
  console.log(`User ${existingSub.user_id} needs to update payment method`);
}

export default dodoWebhook;
