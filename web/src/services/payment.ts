import { apiClient, ApiClientError } from './api';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'pending';
  paymentProvider: 'dodopayments' | 'revenuecat';
  planId: string | null;
  planName: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  amountCents: number | null;
  currency: string;
  isTrial: boolean;
  entitlement: string | null;
  willRenew: boolean;
  productId: string | null;
}

export interface BillingHistoryItem {
  id: string;
  event_type: string;
  payment_provider: string;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface DodoCheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  expiresAt: string;
}

function getPlatform(): 'web' | 'mobile' {
  if (typeof window === 'undefined') return 'web';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isMobileApp =
    // @ts-ignore
    window.Capacitor !== undefined ||
    // @ts-ignore
    window.ReactNativeWebView !== undefined ||
    userAgent.includes('wv');

  return isMobileApp ? 'mobile' : 'web';
}

class PaymentService {
  private platform: 'web' | 'mobile';

  constructor() {
    this.platform = getPlatform();
  }

  /**
   * Link a guest checkout to the authenticated user after sign-in
   * Also syncs any localStorage onboarding data
   */
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
      const response = await apiClient.get<{ subscription: SubscriptionStatus }>('/api/billing/subscription');
      return response.subscription;
    } catch (error) {
      console.error('Error fetching subscription status:', error);

      return {
        hasActiveSubscription: false,
        status: 'inactive',
        paymentProvider: this.platform === 'web' ? 'dodopayments' : 'revenuecat',
        planId: null,
        planName: null,
        currentPeriodEnd: null,
        cancelledAt: null,
        amountCents: null,
        currency: 'INR',
        isTrial: false,
        entitlement: null,
        willRenew: false,
        productId: null,
      };
    }
  }

  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    try {
      const response = await apiClient.get<{ history: BillingHistoryItem[] }>('/api/billing/history');
      return response.history || [];
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return [];
    }
  }

  async createCheckoutSession(planId: string): Promise<DodoCheckoutSession | null> {
    if (this.platform !== 'web') {
      console.warn('createCheckoutSession is only for web platform');
      return null;
    }

    try {
      const response = await apiClient.post<DodoCheckoutSession>(
        '/api/billing/checkout/create',
        { planId, returnUrl: window.location.origin + '/billing/success' }
      );

      return response;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  /**
   * Create a guest checkout session (no auth required)
   * Used when user wants to pay before signing up
   */
  async createGuestCheckoutSession(planId: string, email?: string): Promise<DodoCheckoutSession & { guestId: string } | null> {
    if (this.platform !== 'web') {
      console.warn('createGuestCheckoutSession is only for web platform');
      return null;
    }

    try {
      // Use fetch directly to avoid auth token injection
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
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
      });

      if (!response.ok) {
        throw new Error('Failed to create guest checkout session');
      }

      const data = await response.json();
      
      // Store guest ID for later account linking
      if (data.guestId) {
        localStorage.setItem('youplus_guest_checkout_id', data.guestId);
        localStorage.setItem('youplus_pending_plan_id', planId);
      }

      return data;
    } catch (error) {
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
      console.warn('Mobile checkout should be handled by native RevenueCat SDK');
      throw new Error('Mobile checkout not supported in web context');
    }
  }

  /**
   * Redirect to checkout without requiring auth
   */
  async redirectToGuestCheckout(planId: string, email?: string): Promise<void> {
    if (this.platform === 'web') {
      const session = await this.createGuestCheckoutSession(planId, email);
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        throw new Error('Failed to create guest checkout session');
      }
    } else {
      console.warn('Mobile checkout should be handled by native RevenueCat SDK');
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

  async getPlans(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    amountCents?: number;
    price_cents?: number;
    price?: number;
    currency: string;
    interval?: string;
  }>> {
    try {
      const response = await apiClient.get<{ plans: Array<{
        id: string;
        name: string;
        description: string;
        amountCents?: number;
        price_cents?: number;
        price?: number;
        currency: string;
        interval?: string;
      }> }>('/api/billing/plans');
      return response.plans || [];
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
      const response = await apiClient.post<{ success: boolean; subscription: SubscriptionStatus }>(
        '/api/billing/checkout/verify',
        { sessionId }
      );

      return response;
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

  getPaymentProvider(): 'dodopayments' | 'revenuecat' {
    return this.platform === 'web' ? 'dodopayments' : 'revenuecat';
  }
}

export const paymentService = new PaymentService();
export default paymentService;
