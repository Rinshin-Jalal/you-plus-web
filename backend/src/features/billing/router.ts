import { Hono } from 'hono';
import type { Env } from '@/index';
import { requireAuth } from '@/middleware/auth';
import { createDodoPaymentsService } from '@/services/dodopayments-service';
import { createSupabaseClient } from '@/features/core/utils/database';

const billing = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

// Link a guest checkout to the authenticated user and sync onboarding data
billing.post('/link-guest-checkout', requireAuth, async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { guestId, onboardingData } = body;
    
    console.log('[link-guest-checkout] Linking guest checkout:', { userId, guestId, hasOnboardingData: !!onboardingData });

    const supabase = createSupabaseClient(env);
    const dodo = createDodoPaymentsService(env);

    const customer = await dodo.ensureCustomer(userId, userEmail || '');
    console.log('[link-guest-checkout] User customer:', customer.customer_id);

    await supabase
      .from('users')
      .update({
        dodo_customer_id: customer.customer_id,
        payment_provider: 'dodopayments',
      })
      .eq('id', userId);

    // Save onboarding data if provided
    if (onboardingData && Object.keys(onboardingData).length > 0) {
      console.log('[link-guest-checkout] Saving onboarding data...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[link-guest-checkout] Failed to update user:', updateError);
      } else {
        console.log('[link-guest-checkout] User marked as onboarding complete');
      }

      if (onboardingData.goal || onboardingData.dailyCommitment) {
        const identityData = {
          user_id: userId,
          name: onboardingData.name || 'User',
          daily_commitment: onboardingData.dailyCommitment || onboardingData.daily_commitment || 30,
          call_time: onboardingData.callTime || onboardingData.call_time || '09:00:00',
          onboarding_context: onboardingData,
        };

        const { error: identityError } = await supabase
          .from('identity')
          .upsert(identityData, { onConflict: 'user_id' });

        if (identityError) {
          console.error('[link-guest-checkout] Failed to create identity:', identityError);
        } else {
          console.log('[link-guest-checkout] Identity record created/updated');
        }
      }
    }

    return c.json({
      success: true,
      message: 'Guest checkout linked successfully',
      customerId: customer.customer_id,
    });
  } catch (error) {
    console.error('Error linking guest checkout:', error);
    return c.json({ error: 'Failed to link guest checkout' }, 500);
  }
});

billing.get('/subscription', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

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

    const isActive = subscription.status === 'active' &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

    return c.json({
      subscription: {
        hasActiveSubscription: isActive,
        status: subscription.status,
        paymentProvider: subscription.payment_provider || 'dodopayments',
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

// Public checkout - no auth required
// Creates a guest checkout session, user links account after payment
billing.post('/checkout/create-guest', async (c) => {
  const env = c.env;

  try {
    const body = await c.req.json();
    const { planId, returnUrl, email } = body;
    console.log('[guest-checkout] Request body:', { planId, returnUrl, email });

    if (!planId) {
      return c.json({ error: 'Plan ID is required' }, 400);
    }

    const dodo = createDodoPaymentsService(env);

    // For guest checkout, we create a temporary customer or use email if provided
    // The customer will be linked to a user account after they sign in
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const guestEmail = email || `${guestId}@guest.youplus.app`;
    console.log('[guest-checkout] Creating customer:', { guestId, guestEmail });

    const customer = await dodo.ensureCustomer(guestId, guestEmail);
    console.log('[guest-checkout] Customer created:', customer);

    const session = await dodo.createCheckoutSession({
      customerId: customer.customer_id,
      productId: planId,
      returnUrl: returnUrl || `${env.FRONTEND_URL}/billing/success`,
      metadata: {
        guest_id: guestId,
        plan_id: planId,
        requires_account_link: 'true',
      },
    });
    console.log('[guest-checkout] Session created:', session);

    return c.json({
      sessionId: session.session_id,
      checkoutUrl: session.url,
      expiresAt: session.expires_at,
      guestId: guestId,
    });
  } catch (error) {
    console.error('Error creating guest checkout session:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

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

    const { data: userData } = await supabase
      .from('users')
      .select('dodo_customer_id')
      .eq('id', userId)
      .single();

    let customerId = userData?.dodo_customer_id;

    if (!customerId) {
      const customer = await dodo.ensureCustomer(userId, userEmail || '');
      customerId = customer.customer_id;

      await supabase
        .from('users')
        .update({
          dodo_customer_id: customerId,
          payment_provider: 'dodopayments',
        })
        .eq('id', userId);
    }

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

    const session = await dodo.retrieveCheckoutSession(sessionId);
    const paymentStatus = session?.payment_status ?? session?.status;

    if (paymentStatus !== 'succeeded') {
      return c.json({
        success: false,
        error: 'Checkout not completed',
      });
    }

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

billing.post('/cancel', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { reason } = body;

    const supabase = createSupabaseClient(env);

    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    if (subscription.payment_provider === 'dodopayments') {
      const dodo = createDodoPaymentsService(env);
      const success = await dodo.cancelSubscription(subscription.provider_subscription_id);

      if (!success) {
        return c.json({ error: 'Failed to cancel subscription' }, 500);
      }
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

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

billing.get('/portal', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const supabase = createSupabaseClient(env);

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

billing.get('/plans', async (c) => {
  const env = c.env;

  try {
    const dodo = createDodoPaymentsService(env);
    const products = await dodo.listProductsForCheckout();

    const plans = products.map((p) => ({
      id: p.product_id,
      product_id: p.product_id,
      name: p.name,
      description: p.description,
      price_cents: p.price_cents,
      price: p.price_cents, // Alias for compatibility
      currency: p.currency,
      interval: p.interval,
      interval_count: p.interval_count,
      is_recurring: p.is_recurring,
      features: p.features,
      image: p.image,
      tax_inclusive: p.tax_inclusive,
    }));

    return c.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return c.json({ error: 'Failed to fetch plans' }, 500);
  }
});

export default billing;
