'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { SubscriptionStatus as SubscriptionStatusType } from '@/services/payment';

interface SubscriptionStatusProps {
  subscription: SubscriptionStatusType;
  onManageClick?: () => void;
  onCancelClick?: () => void;
  isLoading?: boolean;
}

export function SubscriptionStatus({
  subscription,
  onManageClick,
  onCancelClick,
  isLoading = false,
}: SubscriptionStatusProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amountCents: number | null, currency: string) => {
    if (amountCents === null) return 'N/A';
    const amount = amountCents / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'past_due':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'cancelled':
        return 'Cancelled';
      case 'past_due':
        return 'Payment Failed';
      case 'pending':
        return 'Pending';
      case 'inactive':
        return 'Inactive';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with status badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscription
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              subscription.status
            )}`}
          >
            {getStatusLabel(subscription.status)}
          </span>
        </div>

        {/* Subscription details */}
        {subscription.hasActiveSubscription ? (
          <div className="space-y-3">
            {subscription.planName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Plan</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {subscription.planName}
                </span>
              </div>
            )}

            {subscription.amountCents !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatAmount(subscription.amountCents, subscription.currency)}
                </span>
              </div>
            )}

            {subscription.currentPeriodEnd && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {subscription.status === 'cancelled' ? 'Access until' : 'Renews on'}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            )}

            {subscription.cancelledAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cancelled on</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(subscription.cancelledAt)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No active subscription. Subscribe to access all features.
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          {subscription.hasActiveSubscription && onManageClick && (
            <Button variant="outline" onClick={onManageClick} className="flex-1">
              Manage Subscription
            </Button>
          )}

          {subscription.hasActiveSubscription &&
            subscription.status === 'active' &&
            onCancelClick && (
              <Button
                variant="outline"
                onClick={onCancelClick}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Cancel
              </Button>
            )}

          {!subscription.hasActiveSubscription && onManageClick && (
            <Button variant="primary" onClick={onManageClick} className="w-full">
              Subscribe Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default SubscriptionStatus;
