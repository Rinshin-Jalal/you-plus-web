import { SubscriptionResponseSchema, SubscriptionStatusSchema } from '../billing';

describe('billing schemas', () => {
  it('parses a valid subscription response', () => {
    const payload = {
      subscription: {
        hasActiveSubscription: true,
        status: 'active',
        paymentProvider: 'dodopayments',
        planId: 'pro',
        planName: 'Pro',
        currentPeriodEnd: '2024-01-01T00:00:00.000Z',
        cancelledAt: null,
        amountCents: 1000,
        currency: 'USD',
        subscriptionId: 'sub_123',
      },
      onboardingCompleted: true,
    };

    const result = SubscriptionResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subscription.planId).toBe('pro');
    }
  });

  it('rejects missing subscription block', () => {
    const result = SubscriptionResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('parses minimal status', () => {
    const statusResult = SubscriptionStatusSchema.safeParse({
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
    });
    expect(statusResult.success).toBe(true);
  });
});
