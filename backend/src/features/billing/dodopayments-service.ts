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
  status:
  | 'active'
  | 'cancelled'
  | 'on_hold'
  | 'failed'
  | 'expired'
  | 'past_due'
  | 'pending';
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

export function createDodoPaymentsClient(env: Env): DodoPayments {
  // Normalize environment value - accept 'test', 'test_mode', 'live', 'live_mode'
  let environment: 'test_mode' | 'live_mode' = 'test_mode';
  const envValue = env.DODO_PAYMENTS_ENVIRONMENT?.toLowerCase();
  if (envValue === 'live' || envValue === 'live_mode' || envValue === 'production') {
    environment = 'live_mode';
  }

  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: environment,
  });
}

export class DodoPaymentsService {
  private client: DodoPayments;

  constructor(env: Env) {
    this.client = createDodoPaymentsClient(env);
  }

  async ensureCustomer(userId: string, email: string, name?: string): Promise<DodoCustomer> {
    try {
      let found: any | undefined;
      const trimmedName = name?.trim();

      try {
        // @ts-ignore - list may be async iterable in newer SDKs
        for await (const c of (this.client as any).customers.list({ email })) {
          if (c.email?.toLowerCase() === email.toLowerCase()) {
            found = c;
            break;
          }
        }
      } catch {
        const res: any = await (this.client as any).customers.list({ email });
        const items: any[] = res?.items ?? res?.data ?? [];
        found = items.find((c) => c.email?.toLowerCase() === email.toLowerCase());
      }

      if (found) {
        if (trimmedName && trimmedName.length > 0 && found.name !== trimmedName) {
          try {
            await (this.client as any).customers.update(found.customer_id, { name: trimmedName });
            found.name = trimmedName;
          } catch (updateError) {
            console.warn('[dodo] Failed to update customer name, continuing:', updateError);
          }
        }

        const base: DodoCustomer = {
          customer_id: found.customer_id,
          email: found.email,
          name: found.name ?? trimmedName,
        };
        return found.metadata ? { ...base, metadata: found.metadata as Record<string, unknown> } : base;
      }

      const payload: any = {
        email,
        name: trimmedName || 'Guest User',
        metadata: { user_id: userId },
      };

      const customer: any = await (this.client as any).customers.create(payload);

      const created: DodoCustomer = {
        customer_id: customer.customer_id,
        email: customer.email,
        name: customer.name,
      };
      return customer.metadata ? { ...created, metadata: customer.metadata as Record<string, unknown> } : created;
    } catch (error) {
      console.error('Error ensuring customer:', error);
      throw new Error('Failed to create or retrieve customer');
    }
  }

  async createCheckoutSession(params: {
    customerId: string;
    productId: string;
    returnUrl: string;
    metadata?: Record<string, unknown>;
  }): Promise<DodoCheckoutSession> {
    try {
      const metaForSdk: { [key: string]: string } | null =
        params.metadata
          ? Object.fromEntries(
            Object.entries(params.metadata).map(([k, v]) => [k, String(v)])
          )
          : null;

      const session = await (this.client as any).checkoutSessions.create({
        customer: { customer_id: params.customerId },
        product_cart: [
          {
            product_id: params.productId,
            quantity: 1,
          },
        ],
        allowed_payment_method_types: ['credit', 'debit', 'upi_collect', 'upi_intent'],
        return_url: params.returnUrl,
        metadata: metaForSdk,
      });

      console.log('[dodo] Raw checkout session response:', JSON.stringify(session, null, 2));

      const sessionId = (session as any).session_id ?? (session as any).id;
      // DodoPayments may return checkout_url instead of url
      const checkoutUrl = (session as any).url ?? (session as any).checkout_url ?? (session as any).payment_link;

      return {
        session_id: sessionId,
        url: checkoutUrl,
        expires_at: ((session as any).expires_at ?? (session as any).created_at)?.toString?.() ?? '',
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    try {
      return await this.client.checkoutSessions.retrieve(sessionId);
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw new Error('Failed to retrieve checkout session');
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<DodoSubscription[]> {
    try {
      const res: any = await (this.client as any).subscriptions.list({
        customer_id: customerId,
        page_size: 100,
      });


      const collected: any[] = [];
      if (res?.items) {
        collected.push(...res.items);
      } else if (res?.data) {
        collected.push(...res.data);
      } else {
        try {
          // @ts-ignore
          for await (const s of (this.client as any).subscriptions.list({ customer_id: customerId })) {
            collected.push(s);
          }
        } catch { }
      }

      return collected.map((sub: any) => ({
        subscription_id: sub.subscription_id ?? sub.id,
        customer_id: sub.customer?.customer_id ?? sub.customer_id ?? '',
        product_id: sub.product_id ?? sub.product ?? '',
        status: sub.status,
        // DodoPayments API returns previous_billing_date/next_billing_date, not current_period_*
        current_period_start: sub.previous_billing_date ?? sub.current_period_start ?? sub.current_period?.start ?? '',
        current_period_end: sub.next_billing_date ?? sub.current_period_end ?? sub.current_period?.end ?? '',
        cancel_at_period_end: (sub.cancel_at_next_billing_date ?? sub.cancel_at_period_end ?? false) as boolean,
        metadata: sub.metadata,
      }));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  async getSubscription(subscriptionId: string): Promise<DodoSubscription | null> {
    try {
      const sub: any = await (this.client as any).subscriptions.retrieve(subscriptionId);

      return {
        subscription_id: sub.subscription_id ?? sub.id,
        customer_id: sub.customer?.customer_id ?? sub.customer_id ?? '',
        product_id: sub.product_id ?? sub.product ?? '',
        status: sub.status,
        // DodoPayments API returns previous_billing_date/next_billing_date, not current_period_*
        current_period_start: sub.previous_billing_date ?? sub.current_period_start ?? sub.current_period?.start ?? '',
        current_period_end: sub.next_billing_date ?? sub.current_period_end ?? sub.current_period?.end ?? '',
        cancel_at_period_end: (sub.cancel_at_next_billing_date ?? sub.cancel_at_period_end ?? false) as boolean,
        metadata: sub.metadata,
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await (this.client as any).subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: true,
      });
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    try {
      const portal = await (this.client as any).customers.customerPortal.create(customerId, {
        return_url: returnUrl,
      });

      return (portal as any).link;
    } catch (error) {
      console.error('Error creating customer portal:', error);
      throw new Error('Failed to create customer portal');
    }
  }

  async changePlan(subscriptionId: string, newProductId: string): Promise<boolean> {
    try {
      await (this.client as any).subscriptions.changePlan(subscriptionId, {
        product_id: newProductId,
        proration_billing_mode: 'full_immediately',
        quantity: 1,
      });
      return true;
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      throw new Error('Failed to change subscription plan');
    }
  }

  async listProducts(): Promise<any[]> {
    try {
      const res: any = await (this.client as any).products.list({ recurring: true });
      if (res?.items) return res.items;
      if (res?.data) return res.data;
      const items: any[] = [];
      try {
        // @ts-ignore
        for await (const p of (this.client as any).products.list({ recurring: true })) {
          items.push(p);
        }
      } catch { }
      return items;
    } catch (error) {
      console.error('Error listing products:', error);
      return [];
    }
  }

  async listProductsForCheckout(): Promise<Array<{
    product_id: string;
    name: string;
    description: string;
    price_cents: number;
    currency: string;
    interval: 'month' | 'year' | 'week' | 'day';
    interval_count: number;
    is_recurring: boolean;
    features: string[];
    image: string | null;
    tax_inclusive: boolean;
  }>> {
    try {
      const rawProducts = await this.listProducts();

      return rawProducts.map((product: any) => {
        // Extract price - can be integer (list) or object (detail)
        let priceCents = 0;
        let currency = 'USD';
        let interval: 'month' | 'year' | 'week' | 'day' = 'month';
        let intervalCount = 1;
        let taxInclusive = false;

        // Handle price field - in list endpoint it's an integer
        if (typeof product.price === 'number') {
          priceCents = product.price;
        } else if (typeof product.price === 'object' && product.price !== null) {
          // Detailed price object
          priceCents = product.price.price || 0;
          currency = product.price.currency || 'USD';
          taxInclusive = product.price.tax_inclusive || false;

          // Extract interval from recurring price
          if (product.price.payment_frequency_interval) {
            interval = product.price.payment_frequency_interval.toLowerCase() as any;
          }
          if (product.price.payment_frequency_count) {
            intervalCount = product.price.payment_frequency_count;
          }
        }

        // Try to get currency from product level if not in price
        if (product.currency) {
          currency = product.currency;
        }

        // Extract interval from price_detail if available
        if (product.price_detail) {
          if (product.price_detail.payment_frequency_interval) {
            interval = product.price_detail.payment_frequency_interval.toLowerCase() as any;
          }
          if (product.price_detail.payment_frequency_count) {
            intervalCount = product.price_detail.payment_frequency_count;
          }
        }

        // Extract features from metadata if available
        let features: string[] = [];
        if (product.metadata?.features) {
          try {
            if (typeof product.metadata.features === 'string') {
              features = JSON.parse(product.metadata.features);
            } else if (Array.isArray(product.metadata.features)) {
              features = product.metadata.features;
            }
          } catch {
            // If parsing fails, treat as comma-separated string
            features = product.metadata.features.split(',').map((f: string) => f.trim());
          }
        }

        return {
          product_id: product.product_id,
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          price_cents: priceCents,
          currency: currency,
          interval: interval,
          interval_count: intervalCount,
          is_recurring: product.is_recurring || false,
          features: features,
          image: product.image || null,
          tax_inclusive: taxInclusive || product.tax_inclusive || false,
        };
      });
    } catch (error) {
      console.error('Error listing products for checkout:', error);
      return [];
    }
  }

  verifyWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
    console.warn('verifyWebhookSignature called on service. Use webhook handler validation instead.');
    return false;
  }
}

export function createDodoPaymentsService(env: Env): DodoPaymentsService {
  return new DodoPaymentsService(env);
}
