import { Hono } from 'hono';
import type { Env } from '@/index';
import { requireAuth } from '@/middleware/auth';
import { createDodoPaymentsService } from './dodopayments-service';
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

    const { data: userProfile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .maybeSingle();

    const preferredEmail = userProfile?.email || userEmail || '';
    const preferredName = userProfile?.name?.trim();

    const customer = await dodo.ensureCustomer(userId, preferredEmail, preferredName);
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

      // Create future_self record with 5 Pillars system
      if (onboardingData.futureSelfStatement || onboardingData.pillars) {
        const futureSelfData = {
          user_id: userId,
          future_self_statement: onboardingData.futureSelfStatement || '',
          favorite_excuse: onboardingData.favoriteExcuse || onboardingData.favorite_excuse || null,
          onboarding_context: onboardingData,
        };

        const { error: futureSelfError } = await supabase
          .from('future_self')
          .upsert(futureSelfData, { onConflict: 'user_id' });

        if (futureSelfError) {
          console.error('[link-guest-checkout] Failed to create future_self:', futureSelfError);
        } else {
          console.log('[link-guest-checkout] future_self record created/updated');
        }

        // Upsert pillars if provided
        if (onboardingData.pillars && Array.isArray(onboardingData.pillars)) {
          for (const pillar of onboardingData.pillars) {
            const { error: pillarError } = await supabase
              .from('future_self_pillars')
              .upsert({
                user_id: userId,
                pillar_type: pillar.type,
                current_state: pillar.currentState || '',
                future_state: pillar.futureState || '',
                next_action: pillar.nextAction || null,
                commitment_time: pillar.commitmentTime || null,
              }, { onConflict: 'user_id,pillar_type' });

            if (pillarError) {
              console.error(`[link-guest-checkout] Failed to create pillar ${pillar.type}:`, pillarError);
            }
          }
          console.log('[link-guest-checkout] Pillars created/updated');
        }
      }

      // Update users table with call_time if provided
      if (onboardingData.callTime || onboardingData.call_time) {
        const { error: callTimeError } = await supabase
          .from('users')
          .update({
            call_time: onboardingData.callTime || onboardingData.call_time || '21:00',
          })
          .eq('id', userId);

        if (callTimeError) {
          console.error('[link-guest-checkout] Failed to update call_time:', callTimeError);
        } else {
          console.log('[link-guest-checkout] call_time saved to users table');
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

    // Get user's dodo_customer_id
    const { data: userData } = await supabase
      .from('users')
      .select('dodo_customer_id')
      .eq('id', userId)
      .single();

    console.log('userData:', userData);
    console.log('userId:', userId);

    if (!userData?.dodo_customer_id) {
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
          currency: 'USD',
          subscriptionId: null,
        },
      });
    }

    console.log('userData.dodo_customer_id:', userData.dodo_customer_id);

    // Fetch subscriptions from DodoPayments API
    const dodo = createDodoPaymentsService(env);
    const subscriptions = await dodo.getCustomerSubscriptions(userData.dodo_customer_id);


    // Prefer truly active subscriptions; treat pending as not yet active to avoid false positives
    const activeSubscription = subscriptions
      .filter((sub) => sub.status === 'active')
      .sort((a, b) => {
        const aEnd = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
        const bEnd = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
        return bEnd - aEnd;
      })[0];
    const pendingSubscription = subscriptions.find((sub) => sub.status === 'pending');

    if (!activeSubscription) {
      if (pendingSubscription) {
        const products = await dodo.listProductsForCheckout();
        const pendingProduct = products.find((p) => p.product_id === pendingSubscription.product_id);

        return c.json({
          subscription: {
            hasActiveSubscription: false,
            status: pendingSubscription.status,
            paymentProvider: 'dodopayments',
            planId: pendingSubscription.product_id,
            planName: pendingProduct?.name || pendingSubscription.product_id,
            currentPeriodEnd: pendingSubscription.current_period_end,
            cancelledAt: null,
            amountCents: pendingProduct?.price_cents || null,
            currency: pendingProduct?.currency || 'USD',
            subscriptionId: pendingSubscription.subscription_id,
          },
        });
      }

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
          currency: 'USD',
          subscriptionId: null,
        },
      });
    }

    // Treat as active only if status is active AND we have a future period end
    const now = Date.now();
    const periodEndRaw = activeSubscription.current_period_end;
    const periodEnd = periodEndRaw ? new Date(periodEndRaw).getTime() : null;
    const periodValid = periodEnd !== null && periodEnd > now;
    const isActive = activeSubscription.status === 'active' && periodValid;

    // If Dodo says active but period is missing/expired, demote to inactive to avoid false banners
    if (!isActive) {
      return c.json({
        subscription: {
          hasActiveSubscription: false,
          status: 'inactive',
          paymentProvider: 'dodopayments',
          planId: null,
          planName: null,
          currentPeriodEnd: periodEndRaw ?? null,
          cancelledAt: null,
          amountCents: null,
          currency: 'USD',
          subscriptionId: null,
        },
      });
    }

    const products = await dodo.listProductsForCheckout();
    const product = products.find((p) => p.product_id === activeSubscription.product_id);

    return c.json({
      subscription: {
        hasActiveSubscription: isActive,
        status: isActive ? 'active' : activeSubscription.status,
        paymentProvider: 'dodopayments',
        planId: activeSubscription.product_id,
        planName: product?.name || activeSubscription.product_id,
        currentPeriodEnd: activeSubscription.current_period_end,
        cancelledAt: activeSubscription.cancel_at_period_end ? activeSubscription.current_period_end : null,
        amountCents: product?.price_cents || null,
        currency: product?.currency || 'USD',
        subscriptionId: activeSubscription.subscription_id,
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
      .select('dodo_customer_id, name, email')
      .eq('id', userId)
      .single();

    const preferredEmail = userData?.email || userEmail || '';
    const preferredName = userData?.name?.trim();

    let customerId = userData?.dodo_customer_id;

    if (!customerId) {
      const customer = await dodo.ensureCustomer(userId, preferredEmail, preferredName);
      customerId = customer.customer_id;

      await supabase
        .from('users')
        .update({
          dodo_customer_id: customerId,
          payment_provider: 'dodopayments',
        })
        .eq('id', userId);
    } else if (preferredName) {
      // Ensure the name in Dodo is up to date for existing customers
      try {
        await dodo.ensureCustomer(userId, preferredEmail, preferredName);
      } catch (updateError) {
        console.warn('[checkout/create] Failed to refresh customer name', updateError);
      }
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

// Change subscription plan (upgrade/downgrade)
billing.post('/change-plan', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const body = await c.req.json();
    const { newPlanId } = body;

    if (!newPlanId) {
      return c.json({ error: 'New plan ID is required' }, 400);
    }

    const supabase = createSupabaseClient(env);

    // Get user's dodo_customer_id
    const { data: userData } = await supabase
      .from('users')
      .select('dodo_customer_id')
      .eq('id', userId)
      .single();

    if (!userData?.dodo_customer_id) {
      return c.json({ error: 'No customer account found' }, 404);
    }

    const dodo = createDodoPaymentsService(env);

    // Fetch subscriptions from DodoPayments API
    const subscriptions = await dodo.getCustomerSubscriptions(userData.dodo_customer_id);

    // Find active subscription
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === 'active' || sub.status === 'pending'
    );

    if (!activeSubscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Check if trying to change to the same plan
    if (activeSubscription.product_id === newPlanId) {
      return c.json({ error: 'Already subscribed to this plan' }, 400);
    }

    // Change the plan in DodoPayments
    await dodo.changePlan(activeSubscription.subscription_id, newPlanId);

    // Get the new plan details
    const products = await dodo.listProductsForCheckout();
    const newPlan = products.find(p => p.product_id === newPlanId);

    return c.json({
      success: true,
      message: 'Plan changed successfully',
      newPlan: {
        id: newPlanId,
        name: newPlan?.name || newPlanId,
        price_cents: newPlan?.price_cents,
        currency: newPlan?.currency,
      },
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return c.json({ error: 'Failed to change plan' }, 500);
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
