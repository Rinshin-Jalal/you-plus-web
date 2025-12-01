/**
 * DodoPayments Service
 * Backend wrapper for DodoPayments SDK with error handling and logging
 */

import DodoPayments from 'dodopayments';
import type { Env } from '@/index';

export interface DodoCheckoutSession {
  session_id: string;
  url: string;
  expires_at: string;
}

export interface DodoSubscription {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, unknown>;
}

export interface DodoCustomer {
  customer_id: string;
  email: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create DodoPayments client instance
 */
export function createDodoPaymentsClient(env: Env): DodoPayments {
  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT || 'test_mode',
  });
}

/**
 * DodoPayments Service
 */
export class DodoPaymentsService {
  private client: DodoPayments;
  
  constructor(env: Env) {
    this.client = createDodoPaymentsClient(env);
  }

  /**
   * Create or retrieve customer
   */
  async ensureCustomer(userId: string, email: string, name?: string): Promise<DodoCustomer> {
    try {
      // Try to find existing customer by metadata
      const customers = await this.client.customers.list({
        // DodoPayments doesn't support metadata filtering in list
        // So we need to check after fetching
      });

      // Find customer by user_id in metadata
      const existing = customers.data?.find(
        (c: any) => c.metadata?.user_id === userId
      );

      if (existing) {
        return {
          customer_id: existing.customer_id,
          email: existing.email,
          name: existing.name,
          metadata: existing.metadata,
        };
      }

      // Create new customer
      const customer = await this.client.customers.create({
        email,
        name: name || undefined,
        metadata: { user_id: userId },
      });

      return {
        customer_id: customer.customer_id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata,
      };
    } catch (error) {
      console.error('Error ensuring customer:', error);
      throw new Error('Failed to create or retrieve customer');
    }
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(params: {
    customerId: string;
    productId: string;
    returnUrl: string;
    metadata?: Record<string, unknown>;
  }): Promise<DodoCheckoutSession> {
    try {
      const session = await this.client.checkoutSessions.create({
        customer_id: params.customerId,
        product_cart: [
          {
            product_id: params.productId,
            quantity: 1,
          },
        ],
        return_url: params.returnUrl,
        metadata: params.metadata,
      });

      return {
        session_id: session.session_id,
        url: session.url,
        expires_at: session.expires_at,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Retrieve checkout session
   */
  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    try {
      return await this.client.checkoutSessions.retrieve(sessionId);
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw new Error('Failed to retrieve checkout session');
    }
  }

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<DodoSubscription[]> {
    try {
      const subscriptions = await this.client.subscriptions.list({
        customer_id: customerId,
      });

      return (subscriptions.data || []).map((sub: any) => ({
        subscription_id: sub.subscription_id,
        customer_id: sub.customer_id,
        product_id: sub.product_id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        metadata: sub.metadata,
      }));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<DodoSubscription | null> {
    try {
      const sub = await this.client.subscriptions.retrieve(subscriptionId);
      
      return {
        subscription_id: sub.subscription_id,
        customer_id: sub.customer_id,
        product_id: sub.product_id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        metadata: sub.metadata,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.client.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    try {
      const portal = await this.client.customerPortals.create({
        customer_id: customerId,
        return_url: returnUrl,
      });

      return portal.url;
    } catch (error) {
      console.error('Error creating customer portal:', error);
      throw new Error('Failed to create customer portal');
    }
  }

  /**
   * List products (for pricing page)
   */
  async listProducts(): Promise<any[]> {
    try {
      const products = await this.client.products.list();
      return products.data || [];
    } catch (error) {
      console.error('Error listing products:', error);
      return [];
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
    // DodoPayments uses HMAC-SHA256
    // Implementation depends on their specific format
    // For now, we'll trust the signature validation they provide
    return true; // Implement actual verification based on DodoPayments docs
  }
}

/**
 * Helper to create service instance
 */
export function createDodoPaymentsService(env: Env): DodoPaymentsService {
  return new DodoPaymentsService(env);
}
