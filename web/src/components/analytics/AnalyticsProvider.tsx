'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/services/analytics';

/**
 * PostHog Analytics Provider
 * 
 * Initializes PostHog and tracks page views on route changes.
 * Wrap your app with this component to enable analytics.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog on mount
  useEffect(() => {
    analytics.init();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      // Construct full URL without PII in query params
      let url = window.origin + pathname;
      
      // Only include safe query params
      if (searchParams) {
        const safeParams = new URLSearchParams();
        const allowedParams = ['next', 'step', 'plan', 'interval', 'success', 'error'];
        
        searchParams.forEach((value, key) => {
          if (allowedParams.includes(key)) {
            safeParams.set(key, value);
          }
        });
        
        const safeParamString = safeParams.toString();
        if (safeParamString) {
          url += '?' + safeParamString;
        }
      }
      
      analytics.trackPageView(url);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export default AnalyticsProvider;
