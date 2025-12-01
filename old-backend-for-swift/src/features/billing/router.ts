/**
 * Billing Routes
 * Handles DodoPayments integration for web subscriptions
 */

import { Hono } from 'hono';
import type { Env } from '@/index';
import { requireAuth } from '@/middleware/auth';
import { createDodoPaymentsService } from '@/services/dodopayments-service';
import { createSupabaseClient } from '@/features/core/utils/database';

const billing = new Hono<{ Bindings: Env }>();

/**
 * GET /api/billing/subscription
 * Get current subscription status for user
 */
billing.get('/subscription', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

    // Get subscription from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return c.json({
        subscription: {
          hasActiveSubscription: false,
          status: 'inactive',
          paymentProvider: 'dodopayments',
          planId: null,
          planName: null,
          currentPeriodEnd: null,
          cancelledAt: null,
          amountCents: null,
          currency: 'INR',
        },
      });
    }

    // Check if subscription is truly active
    const isActive =
      subscription.status === 'active' &&
      (!subscription.current_period_end ||
        new Date(subscription.current_period_end) > new Date());

    return c.json({
      subscription: {
        hasActiveSubscription: isActive,
        status: subscription.status,
        paymentProvider: subscription.payment_provider,
        planId: subscription.plan_id,
        planName: subscription.plan_name,
        currentPeriodEnd: subscription.current_period_end,
        cancelledAt: subscription.cancelled_at,
        amountCents: subscription.amount_cents,
        currency: subscription.currency || 'INR',
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: 'Failed to fetch subscription status' }, 500);
  }
});

/**
 * GET /api/billing/history
 * Get subscription event history
 */
billing.get('/history', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

    const { data: history, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return c.json({ history: history || [] });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return c.json({ error: 'Failed to fetch billing history' }, 500);
  }
});

/**
 * POST /api/billing/checkout/create
 * Create DodoPayments checkout session
 */
billing.post('/checkout/create', requireAuth, async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { planId, returnUrl } = body;

    if (!planId) {
      return c.json({ error: 'Plan ID is required' }, 400);
    }

    const dodo = createDodoPaymentsService(env);
    const supabase = createSupabaseClient(env);

    // Get or create DodoPayments customer
    const { data: userData } = await supabase
      .from('users')
      .select('dodo_customer_id')
      .eq('id', userId)
      .single();

    let customerId = userData?.dodo_customer_id;

    if (!customerId) {
      // Create new customer
      const customer = await dodo.ensureCustomer(userId, userEmail || '');
      customerId = customer.customer_id;

      // Store customer ID
      await supabase
        .from('users')
        .update({
          dodo_customer_id: customerId,
          payment_provider: 'dodopayments',
        })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await dodo.createCheckoutSession({
      customerId,
      productId: planId,
      returnUrl: returnUrl || `${env.FRONTEND_URL}/billing/success`,
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
    });

    return c.json({
      sessionId: session.session_id,
      checkoutUrl: session.url,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

/**
 * POST /api/billing/checkout/verify
 * Verify checkout session and retrieve subscription
 */
billing.post('/checkout/verify', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    const dodo = createDodoPaymentsService(env);
    const supabase = createSupabaseClient(env);

    // Retrieve session
    const session = await dodo.retrieveCheckoutSession(sessionId);

    if (session.status !== 'complete') {
      return c.json({
        success: false,
        error: 'Checkout not completed',
      });
    }

    // Get subscription from database (should be created by webhook)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    return c.json({
      success: true,
      subscription: subscription
        ? {
            hasActiveSubscription: subscription.status === 'active',
            status: subscription.status,
            paymentProvider: subscription.payment_provider,
            planId: subscription.plan_id,
            planName: subscription.plan_name,
            currentPeriodEnd: subscription.current_period_end,
          }
        : null,
    });
  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return c.json({ error: 'Failed to verify checkout session' }, 500);
  }
});

/**
 * POST /api/billing/cancel
 * Cancel subscription
 */
billing.post('/cancel', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { reason } = body;

    const supabase = createSupabaseClient(env);

    // Get subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Cancel based on provider
    if (subscription.payment_provider === 'dodopayments') {
      const dodo = createDodoPaymentsService(env);
      const success = await dodo.cancelSubscription(subscription.provider_subscription_id);

      if (!success) {
        return c.json({ error: 'Failed to cancel subscription' }, 500);
      }
    }
    // RevenueCat cancellation handled differently

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Log event
    await supabase.from('subscription_history').insert({
      user_id: userId,
      payment_provider: subscription.payment_provider,
      event_type: 'subscription_cancelled',
      previous_status: subscription.status,
      new_status: 'cancelled',
      metadata: { reason: reason || 'User requested' },
    });

    return c.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

/**
 * GET /api/billing/portal
 * Get customer portal URL
 */
billing.get('/portal', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

    // Get customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('dodo_customer_id')
      .eq('id', userId)
      .single();

    if (!userData?.dodo_customer_id) {
      return c.json({ error: 'No customer account found' }, 404);
    }

    const dodo = createDodoPaymentsService(env);
    const portalUrl = await dodo.getCustomerPortalUrl(
      userData.dodo_customer_id,
      `${env.FRONTEND_URL}/dashboard`
    );

    return c.json({ portalUrl });
  } catch (error) {
    console.error('Error creating customer portal:', error);
    return c.json({ error: 'Failed to create customer portal' }, 500);
  }
});

/**
 * GET /api/billing/plans
 * Get available plans
 */
billing.get('/plans', async (c) => {
  const env = c.env;

  try {
    const dodo = createDodoPaymentsService(env);
    const products = await dodo.listProducts();

    return c.json({ plans: products });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return c.json({ error: 'Failed to fetch plans' }, 500);
  }
});

export default billing;
