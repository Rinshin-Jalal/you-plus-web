import { z } from "zod";

const id = z.string().min(1, "id required");
const email = z.string().email().optional();
const planId = z.string().min(1, "planId required");
const url = z.string().url().optional();

/**
 * Subscription Status Definitions
 * 
 * @description Defines all possible subscription states and their meanings
 * 
 * - active: Subscription is fully paid and in good standing. User has full access.
 * - inactive: No subscription exists or it has expired without renewal.
 * - pending: Payment is being processed. Usually occurs during initial checkout
 *            or when awaiting payment confirmation. User may have limited access.
 * - past_due: Payment failed but subscription is still within grace period.
 *             User typically retains access for 3-7 days while payment is retried.
 * - cancelled: User or admin cancelled. May still have access until period end.
 * - expired: Subscription period ended without renewal.
 * - on_hold: Temporarily paused (e.g., payment issues, user request).
 * - failed: Payment permanently failed after all retry attempts.
 */
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  PENDING: 'pending',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  ON_HOLD: 'on_hold',
  FAILED: 'failed',
} as const;

export type SubscriptionStatusType = typeof SUBSCRIPTION_STATUSES[keyof typeof SUBSCRIPTION_STATUSES];

/**
 * Helper to check if a status indicates the user should have access
 */
export function hasSubscriptionAccess(status: SubscriptionStatusType | null | undefined): boolean {
  if (!status) return false;
  // Active users have full access
  // Past due users retain access during grace period
  // Pending users may have provisional access while payment processes
  return status === SUBSCRIPTION_STATUSES.ACTIVE || 
         status === SUBSCRIPTION_STATUSES.PAST_DUE ||
         status === SUBSCRIPTION_STATUSES.PENDING;
}

/**
 * Helper to check if a status requires user attention (payment issues)
 */
export function requiresPaymentAttention(status: SubscriptionStatusType | null | undefined): boolean {
  if (!status) return false;
  return status === SUBSCRIPTION_STATUSES.PAST_DUE ||
         status === SUBSCRIPTION_STATUSES.FAILED ||
         status === SUBSCRIPTION_STATUSES.ON_HOLD;
}

/**
 * Get a user-friendly message for the subscription status
 */
export function getStatusMessage(status: SubscriptionStatusType | null | undefined): string {
  switch (status) {
    case SUBSCRIPTION_STATUSES.ACTIVE:
      return 'Your subscription is active.';
    case SUBSCRIPTION_STATUSES.PENDING:
      return 'Your payment is being processed. This usually takes a few minutes.';
    case SUBSCRIPTION_STATUSES.PAST_DUE:
      return 'Your payment is past due. Please update your payment method to continue access.';
    case SUBSCRIPTION_STATUSES.CANCELLED:
      return 'Your subscription has been cancelled. You may have access until the end of your billing period.';
    case SUBSCRIPTION_STATUSES.EXPIRED:
      return 'Your subscription has expired. Subscribe again to regain access.';
    case SUBSCRIPTION_STATUSES.ON_HOLD:
      return 'Your subscription is on hold. Please contact support or update your payment method.';
    case SUBSCRIPTION_STATUSES.FAILED:
      return 'Your payment failed. Please update your payment method to reactivate your subscription.';
    case SUBSCRIPTION_STATUSES.INACTIVE:
    default:
      return 'No active subscription found.';
  }
}

export const CheckoutCreateSchema = z.object({
  planId,
  returnUrl: url,
});

export const CheckoutCreateGuestSchema = z.object({
  planId,
  returnUrl: url,
  email,
});

export const CheckoutVerifySchema = z.object({
  sessionId: z.string().min(1, "sessionId required"),
});

export const LinkGuestCheckoutSchema = z.object({
  guestId: z.string().min(1, "guestId required"),
  onboardingData: z.record(z.string(), z.unknown()).optional(),
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
  currency: z.string().default("USD"),
  interval: z.string().nullable().optional(),
  interval_count: z.number().nullable().optional(),
  is_recurring: z.boolean().nullable().optional(),
  features: z.array(z.string()).nullable().optional(),
  image: z.string().nullable().optional(),
  tax_inclusive: z.boolean().nullable().optional(),
});

export const SubscriptionStatusSchema = z.object({
  hasActiveSubscription: z.boolean(),
  status: z
    .enum(["active", "inactive", "cancelled", "past_due", "pending", "expired", "on_hold", "failed"])
    .nullable()
    .optional(),
  paymentProvider: z.literal("dodopayments").optional().default("dodopayments"),
  planId: z.string().nullable(),
  planName: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  amountCents: z.number().nullable(),
  currency: z.string().default("USD"),
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
  id: id.optional(),
  event_type: z.string(),
  payment_provider: z.string(),
  previous_status: z.string().nullable(),
  new_status: z.string().nullable(),
  created_at: z.string(),
  metadata: z.record(z.unknown()).nullable(),
});

export const BillingHistoryResponseSchema = z.object({
  history: z.array(BillingHistoryItemSchema).default([]),
});

export const CheckoutSessionSchema = z.object({
  sessionId: z.string(),
  checkoutUrl: z.string().url(),
  expiresAt: z.string(),
  guestId: z.string().optional(),
});

export type CheckoutCreateBody = z.infer<typeof CheckoutCreateSchema>;
export type CheckoutCreateGuestBody = z.infer<typeof CheckoutCreateGuestSchema>;
export type CheckoutVerifyBody = z.infer<typeof CheckoutVerifySchema>;
export type LinkGuestCheckoutBody = z.infer<typeof LinkGuestCheckoutSchema>;
export type CancelSubscriptionBody = z.infer<typeof CancelSubscriptionSchema>;
export type ChangePlanBody = z.infer<typeof ChangePlanSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;
export type BillingPlan = z.infer<typeof BillingPlanSchema>;
export type BillingHistoryItem = z.infer<typeof BillingHistoryItemSchema>;
export type BillingHistoryResponse = z.infer<typeof BillingHistoryResponseSchema>;
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>;
