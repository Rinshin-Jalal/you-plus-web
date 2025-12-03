'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { SubscriptionStatus } from '@/components/account/SubscriptionStatus';
import { CancelSubscriptionForm } from '@/components/account/CancelSubscriptionForm';
import { FailedPaymentBanner } from '@/components/account/FailedPaymentBanner';
import paymentService, { type SubscriptionStatus as SubscriptionStatusType } from '@/services/payment';

type ViewState = 'overview' | 'cancel' | 'plans';

function SubscriptionContent() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatusType | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [view, setView] = useState<ViewState>('overview');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subData, plansData] = await Promise.all([
        paymentService.getSubscriptionStatus(),
        paymentService.getPlans(),
      ]);
      setSubscription(subData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await paymentService.getCustomerPortalUrl();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      setMessage({ type: 'error', text: 'Failed to open customer portal' });
    }
  };

  const handleCancelSubscription = async (reason: string) => {
    setIsCancelling(true);
    const result = await paymentService.cancelSubscription(reason);

    if (result.success) {
      setMessage({ type: 'success', text: 'Subscription cancelled successfully' });
      setView('overview');
      await loadData(); // Reload subscription data
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to cancel subscription' });
    }
    setIsCancelling(false);
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await paymentService.redirectToCheckout(planId);
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      setMessage({ type: 'error', text: 'Failed to start checkout' });
    }
  };

  const handleUpdatePayment = async () => {
    try {
      const portalUrl = await paymentService.getCustomerPortalUrl();
      if (portalUrl) {
        window.location.href = portalUrl;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(cents / 100);
  };

  if (view === 'cancel') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cancel Subscription</h1>
        </div>

        <CancelSubscriptionForm
          onCancel={handleCancelSubscription}
          onBack={() => setView('overview')}
          isLoading={isCancelling}
        />
      </div>
    );
  }

  if (view === 'plans') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Plan</h1>
          <Button variant="outline" onClick={() => setView('overview')}>
            Back
          </Button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {plan.description}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatPrice(plan.amountCents || plan.price_cents || plan.price, plan.currency)}
                    <span className="text-sm font-normal text-gray-500">
                      /{plan.interval || 'month'}
                    </span>
                  </p>
                </div>
                <Button variant="primary" onClick={() => handleSubscribe(plan.id)}>
                  Subscribe
                </Button>
              </div>

              {plan.features && plan.features.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <Button variant="outline" onClick={() => router.push('/account/settings')}>
          Back to Settings
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Failed Payment Banner */}
      {subscription?.status === 'past_due' && (
        <FailedPaymentBanner
          onUpdatePayment={handleUpdatePayment}
          expiresAt={subscription.currentPeriodEnd}
        />
      )}

      {/* Subscription Status */}
      <SubscriptionStatus
        subscription={subscription || {
          hasActiveSubscription: false,
          status: 'inactive',
          paymentProvider: 'dodopayments',
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
        }}
        onManageClick={subscription?.hasActiveSubscription ? handleManageSubscription : () => setView('plans')}
        onCancelClick={() => setView('cancel')}
        isLoading={isLoading}
      />

      {/* Additional Info */}
      {subscription?.hasActiveSubscription && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Need Help?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            For billing questions or issues with your subscription, please contact our support team.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open('mailto:support@youplus.app', '_blank')}
          >
            Contact Support
          </Button>
        </Card>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <SubscriptionContent />
        </div>
      </div>
    </AuthGuard>
  );
}
