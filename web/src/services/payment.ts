/**
 * Payment Service - Multi-Provider Support
 * 
 * Web: DodoPayments (UPI, Cards, Wallets for India)
 * Mobile: RevenueCat (handled by mobile apps)
 * 
 * This service detects platform and routes to appropriate provider
 */

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

/**
 * Detect if running on web or mobile
 */
function getPlatform(): 'web' | 'mobile' {
  if (typeof window === 'undefined') return 'web';
  
  // Check if running in mobile app (capacitor/react-native)
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isMobileApp = 
    // @ts-ignore - Capacitor check
    window.Capacitor !== undefined ||
    // @ts-ignore - React Native check  
    window.ReactNativeWebView !== undefined ||
    userAgent.includes('wv'); // WebView indicator
  
  return isMobileApp ? 'mobile' : 'web';
}

/**
 * Payment Service Class
 */
class PaymentService {
  private platform: 'web' | 'mobile';

  constructor() {
    this.platform = getPlatform();
  }

  /**
   * Get current subscription status from backend
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await apiClient.get<{ subscription: SubscriptionStatus }>('/api/billing/subscription');
      return response.subscription;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      
      // Return safe default on error
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
      };
    }
  }

  /**
   * Get billing/subscription history for current user
   */
  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    try {
      const response = await apiClient.get<{ history: BillingHistoryItem[] }>('/api/billing/history');
      return response.history || [];
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return [];
    }
  }

  /**
   * Create DodoPayments checkout session (WEB ONLY)
   */
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
   * Redirect to checkout (handles both web and mobile)
   */
  async redirectToCheckout(planId: string): Promise<void> {
    if (this.platform === 'web') {
      // DodoPayments checkout
      const session = await this.createCheckoutSession(planId);
      if (session?.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } else {
      // Mobile: Should use RevenueCat SDK natively
      console.warn('Mobile checkout should be handled by native RevenueCat SDK');
      throw new Error('Mobile checkout not supported in web context');
    }
  }

  /**
   * Cancel subscription (works for both providers)
   */
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

  /**
   * Get available plans
   */
  async getPlans(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    amountCents: number;
    currency: string;
    interval: 'month' | 'year';
  }>> {
    try {
      const response = await apiClient.get<{ plans: any[] }>('/api/billing/plans');
      return response.plans || [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  }

  /**
   * Verify checkout session after redirect (WEB ONLY)
   */
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

  /**
   * Get DodoPayments customer portal URL (for managing subscription)
   */
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

  /**
   * Check if payment method needs update (failed payment)
   */
  async needsPaymentUpdate(): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      
      // Check if subscription is past_due (payment failed)
      return status.status === 'past_due';
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }

  /**
   * Get subscription info formatted for display
   */
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

  /**
   * Get current payment provider
   */
  getPaymentProvider(): 'dodopayments' | 'revenuecat' {
    return this.platform === 'web' ? 'dodopayments' : 'revenuecat';
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export for testing/mocking
export default paymentService;
