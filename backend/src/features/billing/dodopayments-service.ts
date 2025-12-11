import DodoPayments from 'dodopayments';
import type { Env } from '@/index';
import { withRetry, withSafeFallback, mapToSafeError, type RetryOptions, type SafeError } from '@/features/core/utils/retry';

// Simple TTL cache for products/plans
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const PLANS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let plansCache: CacheEntry<Array<{
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
}>> | null = null;

// Default retry options for Dodo API calls
const DODO_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  timeoutMs: 15000,
  backoffMultiplier: 2,
  jitter: true,
};

// Shorter timeout for read operations
const DODO_READ_OPTIONS: RetryOptions = {
  ...DODO_RETRY_OPTIONS,
  timeoutMs: 10000,
};

// Longer timeout for write operations
const DODO_WRITE_OPTIONS: RetryOptions = {
  ...DODO_RETRY_OPTIONS,
  timeoutMs: 20000,
  maxRetries: 2, // Fewer retries for writes to avoid duplicates
};

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
    const trimmedName = name?.trim();

    try {
      let found: any | undefined;

      // Try to find existing customer with retry
      const searchResult = await withSafeFallback(
        async () => {
          try {
            // @ts-ignore - list may be async iterable in newer SDKs
            for await (const c of (this.client as any).customers.list({ email })) {
              if (c.email?.toLowerCase() === email.toLowerCase()) {
                return c;
              }
            }
            return undefined;
          } catch {
            const res: any = await (this.client as any).customers.list({ email });
            const items: any[] = res?.items ?? res?.data ?? [];
            return items.find((c) => c.email?.toLowerCase() === email.toLowerCase());
          }
        },
        undefined,
        'search customer',
        DODO_READ_OPTIONS
      );

      found = searchResult.data;

      if (found) {
        if (trimmedName && trimmedName.length > 0 && found.name !== trimmedName) {
          try {
            await withRetry(
              () => (this.client as any).customers.update(found.customer_id, { name: trimmedName }),
              DODO_WRITE_OPTIONS,
              'update customer name'
            );
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

      const customer: any = await withRetry(
        () => (this.client as any).customers.create(payload),
        DODO_WRITE_OPTIONS,
        'create customer'
      );

      const created: DodoCustomer = {
        customer_id: customer.customer_id,
        email: customer.email,
        name: customer.name,
      };
      return customer.metadata ? { ...created, metadata: customer.metadata as Record<string, unknown> } : created;
    } catch (error) {
      const safeError = mapToSafeError(error instanceof Error ? error : new Error(String(error)), 'customer operation');
      console.error('Error ensuring customer:', safeError.message);
      throw new Error(safeError.userMessage);
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

      const session = await withRetry(
        () => (this.client as any).checkoutSessions.create({
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
        }),
        DODO_WRITE_OPTIONS,
        'create checkout session'
      );

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
      const safeError = mapToSafeError(error instanceof Error ? error : new Error(String(error)), 'checkout');
      console.error('Error creating checkout session:', safeError.message);
      throw new Error(safeError.userMessage);
    }
  }

  async retrieveCheckoutSession(sessionId: string): Promise<any> {
    try {
      return await withRetry(
        () => this.client.checkoutSessions.retrieve(sessionId),
        DODO_READ_OPTIONS,
        'retrieve checkout session'
      );
    } catch (error) {
      const safeError = mapToSafeError(error instanceof Error ? error : new Error(String(error)), 'checkout verification');
      console.error('Error retrieving checkout session:', safeError.message);
      throw new Error(safeError.userMessage);
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<DodoSubscription[]> {
    const { data: collected, error } = await withSafeFallback(
      async () => {
        const res: any = await (this.client as any).subscriptions.list({
          customer_id: customerId,
          page_size: 100,
        });

        const items: any[] = [];
        if (res?.items) {
          items.push(...res.items);
        } else if (res?.data) {
          items.push(...res.data);
        } else {
          try {
            // @ts-ignore
            for await (const s of (this.client as any).subscriptions.list({ customer_id: customerId })) {
              items.push(s);
            }
          } catch { }
        }
        return items;
      },
      [],
      'fetch subscriptions',
      DODO_READ_OPTIONS
    );

    if (error) {
      console.error('Error fetching subscriptions:', error.message);
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
  }

  async getSubscription(subscriptionId: string): Promise<DodoSubscription | null> {
    const { data: sub, error } = await withSafeFallback<any>(
      () => (this.client as any).subscriptions.retrieve(subscriptionId),
      null as any,
      'fetch subscription',
      DODO_READ_OPTIONS
    );

    if (error || !sub) {
      if (error) {
        console.error('Error fetching subscription:', error.message);
      }
      return null;
    }

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
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await withRetry(
        () => (this.client as any).subscriptions.update(subscriptionId, {
          cancel_at_next_billing_date: true,
        }),
        DODO_WRITE_OPTIONS,
        'cancel subscription'
      );
      return { success: true };
    } catch (error) {
      const safeError = mapToSafeError(error instanceof Error ? error : new Error(String(error)), 'subscription cancellation');
      console.error('Error canceling subscription:', safeError.message);
      return { success: false, error: safeError.userMessage };
    }
  }

  async getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
    try {
      const portal = await withRetry(
        () => (this.client as any).customers.customerPortal.create(customerId, {
          return_url: returnUrl,
        }),
        DODO_WRITE_OPTIONS,
        'create customer portal'
      );

      return (portal as any).link;
    } catch (error) {
      const safeError = mapToSafeError(error instanceof Error ? error : new Error(String(error)), 'customer portal');
      console.error('Error creating customer portal:', safeError.message);
      throw new Error(safeError.userMessage);
    }
  }

  async changePlan(subscriptionId: string, newProductId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await withRetry(
        () => (this.client as any).subscriptions.changePlan(subscriptionId, {
          product_id: newProductId,
          proration_billing_mode: 'full_immediately',
          quantity: 1,
        }),
        DODO_WRITE_OPTIONS,
        'change subscription plan'
      );
      return { success: true };
    } catch (error) {
      const safeError = mapToSafeError(error instanceof Error ? error : new Error(String(error)), 'plan change');
      console.error('Error changing subscription plan:', safeError.message);
      return { success: false, error: safeError.userMessage };
    }
  }

  async listProducts(): Promise<any[]> {
    const { data: items, error } = await withSafeFallback(
      async () => {
        const res: any = await (this.client as any).products.list({ recurring: true });
        if (res?.items) return res.items;
        if (res?.data) return res.data;
        const products: any[] = [];
        try {
          // @ts-ignore
          for await (const p of (this.client as any).products.list({ recurring: true })) {
            products.push(p);
          }
        } catch { }
        return products;
      },
      [],
      'list products',
      DODO_READ_OPTIONS
    );

    if (error) {
      console.error('Error listing products:', error.message);
    }

    return items;
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
    // Check cache first
    const now = Date.now();
    if (plansCache && plansCache.expiresAt > now) {
      console.log('[dodo] Returning cached plans');
      return plansCache.data;
    }

    try {
      const rawProducts = await this.listProducts();

      const products = rawProducts.map((product: any) => {
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

      // Cache the results
      plansCache = {
        data: products,
        expiresAt: Date.now() + PLANS_CACHE_TTL_MS,
      };
      console.log('[dodo] Plans cached for 5 minutes');

      return products;
    } catch (error) {
      console.error('Error listing products for checkout:', error);
      // Return cached data if available, even if expired
      if (plansCache) {
        console.log('[dodo] Returning stale cache due to error');
        return plansCache.data;
      }
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
