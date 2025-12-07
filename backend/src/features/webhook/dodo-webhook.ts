import { Hono } from 'hono';
import DodoPayments from 'dodopayments';
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

    // Create DodoPayments client for webhook verification
    let environment: 'test_mode' | 'live_mode' = 'test_mode';
    const envValue = env.DODO_PAYMENTS_ENVIRONMENT?.toLowerCase();
    if (envValue === 'live' || envValue === 'live_mode' || envValue === 'production') {
      environment = 'live_mode';
    }

    const client = new DodoPayments({
      bearerToken: env.DODO_PAYMENTS_API_KEY,
      environment: environment,
    });

    // Use SDK's unwrap method for signature verification (handles base64 encoding correctly)
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
      console.error('Webhook signature verification failed:', verifyError);
      return c.json({ error: 'Invalid signature' }, 401);
    }

    console.log('DodoPayments webhook received:', payload.type);

    // Handle events based on type
    // The SDK's unwrap returns typed events, but DodoPayments may send additional event types
    // not yet in the SDK type definitions (e.g., subscription.updated)
    const eventType = payload.type as string;
    const eventData = (payload as any).data;

    switch (eventType) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(eventData, env);
        break;
      case 'payment.failed':
        await handlePaymentFailed(eventData, env);
        break;

      case 'subscription.active':
        await handleSubscriptionCreated(eventData, env);
        break;
      case 'subscription.renewed':
      case 'subscription.updated':
        await handleSubscriptionUpdated(eventData, env);
        break;
      case 'subscription.on_hold':
        await handleSubscriptionOnHold(eventData, env);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(eventData, env);
        break;
      case 'subscription.failed':
        await handleSubscriptionFailed(eventData, env);
        break;
      case 'subscription.expired':
        await handleSubscriptionExpired(eventData, env);
        break;
      case 'subscription.plan_changed':
        await handleSubscriptionUpdated(eventData, env);
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    return c.json({ received: true }, 200);
  } catch (error) {
    console.error('Error processing DodoPayments webhook:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

async function handleSubscriptionCreated(data: any, env: Env) {
  const supabase = createSupabaseClient(env);

  // Get user_id from metadata (checkout session metadata)
  const userId = data.metadata?.user_id;

  // DodoPayments customer object has the customer_id
  const customerId = data.customer?.customer_id;
  const customerEmail = data.customer?.email;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  if (!customerId) {
    console.error('No customer_id found in payload for user:', userId);
    return;
  }

  console.log(`Subscription active for user ${userId}, customer ${customerId}`);

  // Check if user exists in public.users
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, dodo_customer_id')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking user:', fetchError);
  }

  // If user doesn't exist in public.users, create them
  if (!existingUser) {
    console.log('User not found in public.users, creating...', userId);
    
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: customerEmail || 'unknown@example.com',
        name: data.customer?.name || 'User',
        dodo_customer_id: customerId,
        payment_provider: 'dodopayments',
        subscription_status: 'active',
      });

    if (insertError) {
      console.error('Failed to create user:', insertError);
      return;
    }
    
    console.log(`User ${userId} created with dodo_customer_id ${customerId}`);
    return;
  }

  // User exists, update with dodo_customer_id
  const { data: updateResult, error: updateUserError } = await supabase
    .from('users')
    .update({
      dodo_customer_id: customerId,
      payment_provider: 'dodopayments',
      subscription_status: 'active',
    })
    .eq('id', userId)
    .select();

  if (updateUserError) {
    console.error('Failed to update user with dodo_customer_id:', updateUserError);
  } else if (!updateResult || updateResult.length === 0) {
    console.error('Update returned no rows:', userId);
  } else {
    console.log(`User ${userId} updated with dodo_customer_id ${customerId}`);
  }
}

// For other subscription events, we just log them since we check DodoPayments API directly
async function handleSubscriptionUpdated(data: any, _env: Env) {
  console.log(`Subscription updated: ${data.subscription_id}, status: ${data.status}`);
}

async function handleSubscriptionCancelled(data: any, _env: Env) {
  console.log(`Subscription cancelled: ${data.subscription_id}`);
}

async function handleSubscriptionOnHold(data: any, _env: Env) {
  console.log(`Subscription on hold: ${data.subscription_id}`);
}

async function handleSubscriptionFailed(data: any, _env: Env) {
  console.log(`Subscription failed: ${data.subscription_id}`);
}

async function handleSubscriptionExpired(data: any, _env: Env) {
  console.log(`Subscription expired: ${data.subscription_id}`);
}

async function handlePaymentSucceeded(data: any, _env: Env) {
  console.log(`Payment succeeded for subscription: ${data.subscription_id}`);
}

async function handlePaymentFailed(data: any, _env: Env) {
  console.log(`Payment failed for subscription: ${data.subscription_id}`);
}

export default dodoWebhook;
