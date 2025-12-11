import { apiClient, ApiClientError } from './api';
import {
  BillingHistoryResponseSchema,
  BillingPlan,
  BillingPlanSchema,
  CheckoutSession,
  CheckoutSessionSchema,
  SubscriptionStatusSchema,
  SubscriptionResponse,
  SubscriptionResponseSchema,
  SubscriptionStatus,
} from '@/schemas/billing';
import type { BillingHistoryItem } from '@/schemas/billing';

export type {
  SubscriptionStatus,
  SubscriptionResponse,
  BillingHistoryItem,
  CheckoutSession,
  BillingPlan,
} from '@/schemas/billing';

function getPlatform(): 'web' | 'mobile' {
  if (typeof window === 'undefined') return 'web';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isMobileApp =
    // @ts-expect-error - Capacitor global may exist in mobile context
    window.Capacitor !== undefined ||
    // @ts-expect-error - ReactNativeWebView global may exist in mobile context
    window.ReactNativeWebView !== undefined ||
    userAgent.includes('wv');

  return isMobileApp ? 'mobile' : 'web';
}

class PaymentService {
  private platform: 'web' | 'mobile';

  constructor() {
    this.platform = getPlatform();
  }

  async linkGuestCheckout(guestId: string, onboardingData?: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string; customerId: string }>(
        '/api/billing/link-guest-checkout',
        { guestId, onboardingData }
      );

      return { success: response.success };
    } catch (error) {
      console.error('Error linking guest checkout:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to link checkout' };
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await apiClient.get<unknown>('/api/billing/subscription');
      const parsed = SubscriptionResponseSchema.parse(response);
      return parsed.subscription;
    } catch (error) {
      console.error('Error fetching subscription status:', error);

      return {
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
      };
    }
  }

  // Get full subscription response including onboarding status
  async getFullSubscriptionStatus(): Promise<SubscriptionResponse> {
    try {
      const response = await apiClient.get<unknown>('/api/billing/subscription');
      return SubscriptionResponseSchema.parse(response);
    } catch (error) {
      console.error('Error fetching full subscription status:', error);
      return {
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
        onboardingCompleted: false,
      };
    }
  }

  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    try {
      const response = await apiClient.get<unknown>('/api/billing/history');
      const parsed = BillingHistoryResponseSchema.parse(response);
      return parsed.history || [];
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return [];
    }
  }

  async createCheckoutSession(planId: string): Promise<CheckoutSession | null> {
    if (this.platform !== 'web') {
      console.warn('createCheckoutSession is only for web platform');
      return null;
    }

    try {
      const response = await apiClient.post<unknown>(
        '/api/billing/checkout/create',
        { planId, returnUrl: window.location.origin + '/billing/success' }
      );

      return CheckoutSessionSchema.parse(response);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  async createGuestCheckoutSession(planId: string, email?: string): Promise<(CheckoutSession & { guestId: string }) | null> {
    if (this.platform !== 'web') {
      console.warn('createGuestCheckoutSession is only for web platform');
      return null;
    }

    try {
      // Use fetch directly to avoid auth token injection
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      
      // Add timeout for external payment API calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      try {
        const response = await fetch(`${baseUrl}/api/billing/checkout/create-guest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            returnUrl: window.location.origin + '/billing/success',
            email,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to create guest checkout session');
        }

        const data = await response.json();
        const parsed = CheckoutSessionSchema.parse(data);
        
        // Store guest ID for later account linking
        if (parsed.guestId) {
          localStorage.setItem('youplus_guest_checkout_id', parsed.guestId);
          localStorage.setItem('youplus_pending_plan_id', planId);
        }

        return parsed as CheckoutSession & { guestId: string };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Guest checkout session creation timed out');
        return null;
      }
      console.error('Error creating guest checkout session:', error);
      return null;
    }
  }

  async redirectToCheckout(planId: string): Promise<void> {
    if (this.platform === 'web') {
      const session = await this.createCheckoutSession(planId);
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } else {
      console.warn('Mobile checkout is not supported in web context');
      throw new Error('Mobile checkout not supported in web context');
    }
  }

  async redirectToGuestCheckout(planId: string, email?: string): Promise<void> {
    if (this.platform === 'web') {
      const session = await this.createGuestCheckoutSession(planId, email);
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        throw new Error('Failed to create guest checkout session');
      }
    } else {
      console.warn('Mobile checkout is not supported in web context');
      throw new Error('Mobile checkout not supported in web context');
    }
  }

  async cancelSubscription(reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/api/billing/cancel',
        { reason }
      );

      return { success: response.success };
    } catch (error) {
      console.error('Error canceling subscription:', error);

      if (error instanceof ApiClientError) {
        return { success: false, error: error.response?.error || 'Failed to cancel subscription' };
      }

      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getPlans(): Promise<BillingPlan[]> {
    try {
      const response = await apiClient.get<unknown>('/api/billing/plans');
      const plans = (response as { plans?: unknown[] }).plans || [];
      return plans.map((plan) => BillingPlanSchema.parse(plan));
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  }

  async verifyCheckoutSession(sessionId: string): Promise<{ success: boolean; subscription?: SubscriptionStatus }> {
    if (this.platform !== 'web') {
      return { success: false };
    }

    try {
      const response = await apiClient.post<{ success: boolean; subscription?: unknown }>(
        '/api/billing/checkout/verify',
        { sessionId }
      );

      const parsedSubscription = response.subscription
        ? SubscriptionStatusSchema.parse(response.subscription)
        : undefined;

      return { success: response.success, subscription: parsedSubscription };
    } catch (error) {
      console.error('Error verifying checkout session:', error);
      return { success: false };
    }
  }

  async getCustomerPortalUrl(): Promise<string | null> {
    if (this.platform !== 'web') {
      console.warn('Customer portal is only for web platform');
      return null;
    }

    try {
      const response = await apiClient.get<{ portalUrl: string }>('/api/billing/portal');
      return response.portalUrl;
    } catch (error) {
      console.error('Error getting customer portal URL:', error);
      return null;
    }
  }

  async changePlan(newPlanId: string): Promise<{ success: boolean; error?: string; newPlan?: { id: string; name: string; price_cents: number; currency: string } }> {
    if (this.platform !== 'web') {
      console.warn('Plan changes are only for web platform');
      return { success: false, error: 'Not available on mobile' };
    }

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        newPlan: { id: string; name: string; price_cents: number; currency: string };
      }>('/api/billing/change-plan', { newPlanId });

      return { success: response.success, newPlan: response.newPlan };
    } catch (error) {
      console.error('Error changing plan:', error);
      if (error instanceof ApiClientError) {
        return { success: false, error: error.response?.error || 'Failed to change plan' };
      }
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async needsPaymentUpdate(): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();

      return status.status === 'past_due';
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  async getSubscriptionInfo(): Promise<{
    status: 'active' | 'expired' | 'none' | 'loading';
    displayText: string;
    expiresAt: string | null;
    needsAction: boolean;
  }> {
    try {
      const subscription = await this.getSubscriptionStatus();

      if (subscription.hasActiveSubscription && subscription.status === 'active') {
        return {
          status: 'active',
          displayText: 'Subscription Active',
          expiresAt: subscription.currentPeriodEnd,
          needsAction: false,
        };
      }

      if (subscription.status === 'past_due') {
        return {
          status: 'expired',
          displayText: 'Payment Failed - Update Required',
          expiresAt: subscription.currentPeriodEnd,
          needsAction: true,
        };
      }

      if (subscription.status === 'cancelled') {
        return {
          status: 'expired',
          displayText: 'Subscription Cancelled',
          expiresAt: subscription.cancelledAt,
          needsAction: true,
        };
      }

      return {
        status: 'none',
        displayText: 'No Active Subscription',
        expiresAt: null,
        needsAction: true,
      };
    } catch (error) {
      console.error('Error getting subscription info:', error);

      return {
        status: 'none',
        displayText: 'Unable to load subscription status',
        expiresAt: null,
        needsAction: false,
      };
    }
  }

  getPaymentProvider(): 'dodopayments' {
    return 'dodopayments';
  }
}

export const paymentService = new PaymentService();
export default paymentService;
