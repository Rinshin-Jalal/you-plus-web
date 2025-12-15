import { PostHog } from 'posthog-node';

let posthogInstance: PostHog | null = null;

/**
 * Get PostHog server-side instance (singleton)
 * Used for server-side error tracking and analytics
 * https://posthog.com/docs/error-tracking/installation/nextjs
 */
export function getPostHogServer(): PostHog {
  if (!posthogInstance) {
    posthogInstance = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      }
    );
  }
  return posthogInstance;
}

