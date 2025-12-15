import { Hono } from 'hono';
import type { ZodTypeAny } from 'zod';
import type { Env } from '@/index';
import { requireAuth } from '@/middleware/auth';
import { createDodoPaymentsService } from './dodopayments-service';
import { createSupabaseClient } from '@/features/core/utils/database';
import {
  BillingHistoryResponseSchema,
  BillingPlanSchema,
  CancelSubscriptionSchema,
  ChangePlanSchema,
  CheckoutCreateGuestSchema,
  CheckoutCreateSchema,
  CheckoutSessionSchema,
  CheckoutVerifySchema,
  LinkGuestCheckoutSchema,
  SubscriptionStatusSchema,
  SubscriptionResponseSchema,
} from './schemas';
import type {
  BillingHistoryResponse,
  BillingPlan,
  CancelSubscriptionBody,
  ChangePlanBody,
  CheckoutCreateBody,
  CheckoutCreateGuestBody,
  CheckoutVerifyBody,
  LinkGuestCheckoutBody,
  SubscriptionResponse,
} from './schemas';

async function parseBody<T>(c: any, schema: ZodTypeAny): Promise<{ data: T; error?: undefined } | { data?: undefined; error: Response }> {
  try {
    const json = await c.req.json();
    const result = schema.safeParse(json);
    if (!result.success) {
      return {
        error: c.json(
          {
            error: 'Invalid request payload',
            details: result.error.flatten(),
          },
          400,
        ),
      };
    }
    return { data: result.data as T };
  } catch (parseError) {
    console.error('Failed to parse request body', parseError);
    return {
      error: c.json({ error: 'Malformed JSON body' }, 400),
    };
  }
}

const billing = new Hono<{
  Bindings: Env;
  Variables: {
    userId: string;
    userEmail: string;
  };
}>();

// Link guest checkout to authenticated user
billing.post('/link-guest-checkout', requireAuth, async (c) => {
  const userId = c.get('userId');
  const userEmail = c.get('userEmail');
  const env = c.env;

  const parsed = await parseBody<LinkGuestCheckoutBody>(c, LinkGuestCheckoutSchema);
  if (parsed.error) return parsed.error;
  const { guestId, onboardingData } = parsed.data;

  try {
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

    if (onboardingData && Object.keys(onboardingData).length > 0) {
      console.log('[link-guest-checkout] Guest has partial onboarding data, storing for later...');

      if ((onboardingData as any).futureSelfStatement || (onboardingData as any).pillars) {
        const futureSelfData = {
          user_id: userId,
          future_self_statement: (onboardingData as any).futureSelfStatement || '',
          favorite_excuse: (onboardingData as any).favoriteExcuse || (onboardingData as any).favorite_excuse || null,
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

        if ((onboardingData as any).pillars && Array.isArray((onboardingData as any).pillars)) {
          for (const pillar of (onboardingData as any).pillars) {
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

      if ((onboardingData as any).callTime || (onboardingData as any).call_time) {
        const { error: callTimeError } = await supabase
          .from('users')
          .update({
            call_time: (onboardingData as any).callTime || (onboardingData as any).call_time || '21:00',
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
    const respond = (payload: SubscriptionResponse) => c.json(SubscriptionResponseSchema.parse(payload));

    // Fetch user data (dodo_customer_id, onboarding_completed) and check if a futureself row exists for this user_id
    const { data: userData } = await supabase
      .from('users')
      .select('dodo_customer_id, onboarding_completed,id')
      .eq('id', userId)
      .single();

    const { data: futureSelfExists } = await supabase
      .from('future_self')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const hasFutureSelf = !!futureSelfExists;


    if (!userData?.dodo_customer_id) {
      return respond({
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
        onboardingCompleted: hasFutureSelf || false,
      });
    }


    const dodo = createDodoPaymentsService(env);
    const subscriptions = await dodo.getCustomerSubscriptions(userData.dodo_customer_id);

    // Find subscriptions that grant access (active or past_due within grace period)
    // Priority: active > past_due > pending
    const activeSubscription = subscriptions
      .filter((sub) => sub.status === 'active' || sub.status === 'past_due')
      .sort((a, b) => {
        // Prefer 'active' over 'past_due'
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        // Then sort by period end date
        const aEnd = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
        const bEnd = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
        return bEnd - aEnd;
      })[0];
    const pendingSubscription = subscriptions.find((sub) => sub.status === 'pending');

    if (!activeSubscription) {
      if (pendingSubscription) {
        const products = await dodo.listProductsForCheckout();
        const pendingProduct = products.find((p) => p.product_id === pendingSubscription.product_id);

        return respond({
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
          onboardingCompleted: hasFutureSelf || false,
        });
      }

      return respond({
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
        onboardingCompleted: hasFutureSelf || false,
      });
    }

    const now = Date.now();
    const periodEndRaw = activeSubscription.current_period_end;
    const periodEnd = periodEndRaw ? new Date(periodEndRaw).getTime() : null;
    const periodValid = periodEnd !== null && periodEnd > now;
    
    // Users with 'active' or 'past_due' status should have access if period is valid
    // past_due means payment failed but they're in grace period
    const hasAccess = (activeSubscription.status === 'active' || activeSubscription.status === 'past_due') && periodValid;

    if (!hasAccess) {
      return respond({
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
        onboardingCompleted: hasFutureSelf || false,
      });
    }

    const products = await dodo.listProductsForCheckout();
    const product = products.find((p) => p.product_id === activeSubscription.product_id);

    return respond({
      subscription: {
        hasActiveSubscription: hasAccess,
        status: activeSubscription.status, // Return actual status (active or past_due)
        paymentProvider: 'dodopayments',
        planId: activeSubscription.product_id,
        planName: product?.name || activeSubscription.product_id,
        currentPeriodEnd: activeSubscription.current_period_end,
        cancelledAt: activeSubscription.cancel_at_period_end ? activeSubscription.current_period_end : null,
        amountCents: product?.price_cents || null,
        currency: product?.currency || (activeSubscription as any).currency || 'USD',
        subscriptionId: activeSubscription.subscription_id,
      },
      onboardingCompleted: hasFutureSelf || false,
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

    const response = BillingHistoryResponseSchema.parse({ history: history || [] });
    return c.json(response);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return c.json({ error: 'Failed to fetch billing history' }, 500);
  }
});

// Guest checkout - no auth required
billing.post('/checkout/create-guest', async (c) => {
  const env = c.env;

  try {
    const parsed = await parseBody<CheckoutCreateGuestBody>(c, CheckoutCreateGuestSchema);
    if (parsed.error) return parsed.error;
    const { planId, returnUrl, email } = parsed.data;
    console.log('[guest-checkout] Request body:', { planId, returnUrl, email });

    if (!planId) {
      return c.json({ error: 'Plan ID is required' }, 400);
    }

    const dodo = createDodoPaymentsService(env);

    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const guestEmail = email || `${guestId}@guest.getyouplus.com`;
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

    return c.json(CheckoutSessionSchema.parse({
      sessionId: session.session_id,
      checkoutUrl: session.url,
      expiresAt: session.expires_at,
      guestId: guestId,
    }));
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
    const parsed = await parseBody<CheckoutCreateBody>(c, CheckoutCreateSchema);
    if (parsed.error) return parsed.error;
    const { planId, returnUrl } = parsed.data;

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

    return c.json(CheckoutSessionSchema.parse({
      sessionId: session.session_id,
      checkoutUrl: session.url,
      expiresAt: session.expires_at,
    }));
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

billing.post('/checkout/verify', requireAuth, async (c) => {
  const userId = c.get('userId');
  const env = c.env;

  try {
    const parsed = await parseBody<CheckoutVerifyBody>(c, CheckoutVerifySchema);
    if (parsed.error) return parsed.error;
    const { sessionId } = parsed.data;

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
        ? SubscriptionStatusSchema.parse({
          hasActiveSubscription: subscription.status === 'active',
          status: subscription.status,
          paymentProvider: subscription.payment_provider,
          planId: subscription.plan_id,
          planName: subscription.plan_name,
          currentPeriodEnd: subscription.current_period_end,
          cancelledAt: subscription.cancelled_at ?? null,
          amountCents: subscription.amount_cents ?? null,
          currency: subscription.currency ?? 'USD',
          subscriptionId: subscription.provider_subscription_id ?? subscription.id ?? null,
        })
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
    const parsed = await parseBody<CancelSubscriptionBody>(c, CancelSubscriptionSchema);
    if (parsed.error) return parsed.error;
    const { reason } = parsed.data;

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
      const result = await dodo.cancelSubscription(subscription.provider_subscription_id);

      if (!result.success) {
        return c.json({ 
          error: result.error || 'Failed to cancel subscription',
          code: 'CANCELLATION_FAILED'
        }, 500);
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
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    return c.json({ 
      error: message,
      code: 'CANCELLATION_ERROR'
    }, 500);
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
    const parsed = await parseBody<ChangePlanBody>(c, ChangePlanSchema);
    if (parsed.error) return parsed.error;
    const { newPlanId } = parsed.data;

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

    const subscriptions = await dodo.getCustomerSubscriptions(userData.dodo_customer_id);

    const activeSubscription = subscriptions.find(
      (sub) => sub.status === 'active' || sub.status === 'pending'
    );

    if (!activeSubscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    if (activeSubscription.product_id === newPlanId) {
      return c.json({ error: 'Already subscribed to this plan' }, 400);
    }

    const changeResult = await dodo.changePlan(activeSubscription.subscription_id, newPlanId);

    if (!changeResult.success) {
      return c.json({ 
        error: changeResult.error || 'Failed to change plan',
        code: 'PLAN_CHANGE_FAILED'
      }, 500);
    }

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
    const message = error instanceof Error ? error.message : 'Failed to change plan';
    return c.json({ 
      error: message,
      code: 'PLAN_CHANGE_ERROR'
    }, 500);
  }
});

billing.get('/plans', async (c) => {
  const env = c.env;

  try {
    const dodo = createDodoPaymentsService(env);
    const products = await dodo.listProductsForCheckout();

    const plans = products.map((p) => BillingPlanSchema.parse({
      id: p.product_id,
      product_id: p.product_id,
      name: p.name,
      description: p.description,
      price_cents: p.price_cents,
      price: p.price_cents,
      amountCents: p.price_cents,
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
