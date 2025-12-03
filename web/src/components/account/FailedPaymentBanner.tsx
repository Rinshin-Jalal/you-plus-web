'use client';

import { Button } from '@/components/ui/Button';

interface FailedPaymentBannerProps {
  onUpdatePayment: () => void;
  expiresAt?: string | null;
}

export function FailedPaymentBanner({
  onUpdatePayment,
  expiresAt,
}: FailedPaymentBannerProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const expiryDate = formatDate(expiresAt);

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
            Payment Failed
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            We couldn't process your last payment.
            {expiryDate && (
              <span>
                {' '}
                Your access will expire on <strong>{expiryDate}</strong> unless
                you update your payment method.
              </span>
            )}
          </p>
          <Button
            variant="primary"
            onClick={onUpdatePayment}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4"
          >
            Update Payment Method
          </Button>
        </div>
        <button
          className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default FailedPaymentBanner;
