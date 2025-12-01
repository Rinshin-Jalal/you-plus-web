/**
 * Payment Service
 * Handles RevenueCat integration for subscription management
 */

import { apiClient, ApiClientError } from './api';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  entitlement: string | null;
  expirationDate: string | null;
  isTrial: boolean;
  willRenew: boolean;
  productId: string | null;
}

export interface BillingHistoryItem {
  id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface PaywallInfo {
  paywallUrl: string;
  offerings: string[];
}

/**
 * Payment Service Class
 */
class PaymentService {
  /**
   * Get current subscription status from backend (which checks RevenueCat)
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await apiClient.get<SubscriptionStatus>('/billing/subscription');
      return response;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      
      // Return safe default on error
      return {
        hasActiveSubscription: false,
        entitlement: null,
        expirationDate: null,
        isTrial: false,
        willRenew: false,
        productId: null,
      };
    }
  }

  /**
   * Get billing/subscription history for current user
   */
  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    try {
      const response = await apiClient.get<{ history: BillingHistoryItem[] }>('/billing/history');
      return response.history || [];
    } catch (error) {
      console.error('Error fetching billing history:', error);
      return [];
    }
  }

  /**
   * Cancel subscription (marks for cancellation at period end)
   */
  async cancelSubscription(reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/billing/cancel',
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
   * Get RevenueCat paywall URL for purchasing/managing subscription
   */
  async getPaywallUrl(): Promise<string | null> {
    try {
      const response = await apiClient.get<{ paywallUrl: string }>('/billing/paywall');
      return response.paywallUrl;
    } catch (error) {
      console.error('Error fetching paywall URL:', error);
      return null;
    }
  }

  /**
   * Update payment method (redirects to RevenueCat)
   */
  async updatePaymentMethod(): Promise<string | null> {
    try {
      const response = await apiClient.post<{ paywallUrl: string }>('/billing/payment-method');
      return response.paywallUrl;
    } catch (error) {
      console.error('Error getting payment update URL:', error);
      return null;
    }
  }

  /**
   * Restore purchases (useful for iOS/Android)
   * In web context, this just refreshes subscription status
   */
  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/billing/restore'
      );
      
      return { success: response.success };
    } catch (error) {
      console.error('Error restoring purchases:', error);
      
      if (error instanceof ApiClientError) {
        return { success: false, error: error.response?.error || 'Failed to restore purchases' };
      }
      
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Check if user needs to update payment method (failed payment)
   */
  async needsPaymentUpdate(): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      
      // Check if subscription exists but is not active (likely payment failure)
      return !status.hasActiveSubscription && status.expirationDate !== null;
    } catch (error) {
      console.error('Error checking payment update status:', error);
      return false;
    }
  }

  /**
   * Get subscription info formatted for display
   */
  async getSubscriptionInfo(): Promise<{
    status: 'active' | 'expired' | 'none';
    displayText: string;
    expiresAt: string | null;
    needsAction: boolean;
  }> {
    try {
      const subscription = await this.getSubscriptionStatus();

      if (subscription.hasActiveSubscription) {
        return {
          status: 'active',
          displayText: subscription.isTrial ? 'Trial Active' : 'Subscription Active',
          expiresAt: subscription.expirationDate,
          needsAction: false,
        };
      }

      if (subscription.expirationDate) {
        const expiryDate = new Date(subscription.expirationDate);
        const isPastDue = expiryDate < new Date();

        return {
          status: 'expired',
          displayText: isPastDue ? 'Subscription Expired' : 'Subscription Expiring Soon',
          expiresAt: subscription.expirationDate,
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
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export for testing/mocking
export default paymentService;
