'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CancelSubscriptionFormProps {
  onCancel: (reason: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: "I'm not using it enough" },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'temporary', label: 'Just need a break' },
  { value: 'other', label: 'Other reason' },
];

export function CancelSubscriptionForm({
  onCancel,
  onBack,
  isLoading = false,
}: CancelSubscriptionFormProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');
  const [step, setStep] = useState<'reason' | 'confirm'>('reason');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedReason) {
      setError('Please select a reason for cancelling');
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const handleConfirmCancel = async () => {
    const reason = selectedReason === 'other' ? otherReason : selectedReason;
    try {
      await onCancel(reason);
    } catch (err) {
      setError('Failed to cancel subscription. Please try again.');
    }
  };

  if (step === 'confirm') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
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

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Are you sure?
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Your subscription will remain active until the end of your current billing period.
            After that, you'll lose access to premium features.
          </p>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep('reason')}
              className="flex-1"
              disabled={isLoading}
            >
              Go Back
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            We're sad to see you go
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Please let us know why you're cancelling so we can improve.
          </p>
        </div>

        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        )}

        <div className="space-y-2">
          {CANCELLATION_REASONS.map((reason) => (
            <label
              key={reason.value}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedReason === reason.value
                  ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="cancellation_reason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedReason === reason.value
                    ? 'border-black dark:border-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {selectedReason === reason.value && (
                  <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                )}
              </div>
              <span className="text-sm text-gray-900 dark:text-white">
                {reason.label}
              </span>
            </label>
          ))}
        </div>

        {selectedReason === 'other' && (
          <textarea
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Please tell us more..."
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            rows={3}
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Keep Subscription
          </Button>
          <Button
            variant="primary"
            onClick={handleContinue}
            className="flex-1"
            disabled={!selectedReason}
          >
            Continue
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CancelSubscriptionForm;
