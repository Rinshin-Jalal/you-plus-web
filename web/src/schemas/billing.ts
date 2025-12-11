import { z } from 'zod';
import { email, planId, stringId, url } from './primitives';

export const SubscriptionStatusSchema = z.object({
  hasActiveSubscription: z.boolean(),
  status: z
    .enum(['active', 'inactive', 'cancelled', 'past_due', 'pending', 'expired', 'on_hold', 'failed'])
    .nullable()
    .optional(),
  paymentProvider: z.literal('dodopayments').optional().default('dodopayments'),
  planId: z.string().nullable(),
  planName: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  amountCents: z.number().nullable(),
  currency: z.string().default('USD'),
  subscriptionId: z.string().nullable(),
  isTrial: z.boolean().optional(),
  entitlement: z.string().nullable().optional(),
  willRenew: z.boolean().optional(),
  productId: z.string().nullable().optional(),
});

export const SubscriptionResponseSchema = z.object({
  subscription: SubscriptionStatusSchema,
  onboardingCompleted: z.boolean().default(false),
});

export const BillingHistoryItemSchema = z.object({
  id: stringId.optional(),
  event_type: z.string(),
  payment_provider: z.string(),
  previous_status: z.string().nullable(),
  new_status: z.string().nullable(),
  created_at: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export const BillingHistoryResponseSchema = z.object({
  history: z.array(BillingHistoryItemSchema).default([]),
});

export const CheckoutSessionSchema = z.object({
  sessionId: z.string(),
  checkoutUrl: z.string(),
  expiresAt: z.string(),
  guestId: z.string().optional(),
});

export const CheckoutCreateSchema = z.object({
  planId,
  returnUrl: url.optional(),
});

export const CheckoutCreateGuestSchema = z.object({
  planId,
  returnUrl: url.optional(),
  email: email.optional(),
});

export const CheckoutVerifySchema = z.object({
  sessionId: z.string().min(1, 'sessionId required'),
});

export const CancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
});

export const ChangePlanSchema = z.object({
  newPlanId: planId,
});

export const BillingPlanSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price_cents: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  amountCents: z.number().nullable().optional(),
  currency: z.string().default('USD'),
  interval: z.string().nullable().optional(),
  interval_count: z.number().nullable().optional(),
  is_recurring: z.boolean().nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  image: z.string().nullable().optional(),
  tax_inclusive: z.boolean().nullable().optional(),
});

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;
export type BillingHistoryItem = z.infer<typeof BillingHistoryItemSchema>;
export type BillingHistoryResponse = z.infer<typeof BillingHistoryResponseSchema>;
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
export type BillingPlan = z.infer<typeof BillingPlanSchema>;
