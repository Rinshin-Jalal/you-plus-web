'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { BillingHistory } from '@/components/account/BillingHistory';
import { SubscriptionStatus } from '@/components/account/SubscriptionStatus';
import { FailedPaymentBanner } from '@/components/account/FailedPaymentBanner';
import paymentService, { type SubscriptionStatus as SubscriptionStatusType, type BillingHistoryItem } from '@/services/payment';

function BillingContent() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatusType | null>(null);
  const [history, setHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      const [subData, historyData] = await Promise.all([
        paymentService.getSubscriptionStatus(),
        paymentService.getBillingHistory(),
      ]);
      setSubscription(subData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const portalUrl = await paymentService.getCustomerPortalUrl();
      if (portalUrl) {
        window.location.href = portalUrl;
      } else {
        router.push('/account/subscription');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      router.push('/account/subscription');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
        <Button variant="outline" onClick={() => router.push('/account/settings')}>
          Back to Settings
        </Button>
      </div>

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
        onManageClick={handleManageSubscription}
        isLoading={isLoading}
      />

      {/* Billing History */}
      <BillingHistory history={history} isLoading={isLoading} />
    </div>
  );
}

export default function BillingPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <BillingContent />
        </div>
      </div>
    </AuthGuard>
  );
}
