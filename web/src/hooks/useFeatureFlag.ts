/**
 * useFeatureFlag - React hook for PostHog feature flags
 * 
 * Usage:
 *   const showNewFeature = useFeatureFlag('new-feature', false);
 *   const variant = useFeatureFlagPayload<'control' | 'test'>('ab-test', 'control');
 */

import { useState, useEffect } from 'react';
import { 
  isFeatureEnabled, 
  getFeatureFlagPayload, 
  onFeatureFlagsLoaded,
  FeatureFlag,
} from '@/services/analytics';

/**
 * Hook to check if a feature flag is enabled
 * Re-renders when flags are loaded from PostHog
 */
export function useFeatureFlag(
  flag: FeatureFlag | string, 
  defaultValue: boolean = false
): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag, defaultValue));

  useEffect(() => {
    // Update when flags load
    const unsubscribe = onFeatureFlagsLoaded(() => {
      setEnabled(isFeatureEnabled(flag, defaultValue));
    });

    // Also check immediately in case flags are already loaded
    setEnabled(isFeatureEnabled(flag, defaultValue));

    return unsubscribe;
  }, [flag, defaultValue]);

  return enabled;
}

/**
 * Hook to get feature flag payload (for multivariate flags)
 * Re-renders when flags are loaded from PostHog
 */
export function useFeatureFlagPayload<T>(
  flag: FeatureFlag | string,
  defaultValue: T
): T {
  const [payload, setPayload] = useState<T>(() => getFeatureFlagPayload(flag, defaultValue));

  useEffect(() => {
    const unsubscribe = onFeatureFlagsLoaded(() => {
      setPayload(getFeatureFlagPayload(flag, defaultValue));
    });

    setPayload(getFeatureFlagPayload(flag, defaultValue));

    return unsubscribe;
  }, [flag, defaultValue]);

  return payload;
}

export { FeatureFlags } from '@/services/analytics';
