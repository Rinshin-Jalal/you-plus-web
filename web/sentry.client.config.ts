// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable replay for session recording (optional)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  environment: process.env.NODE_ENV,

  // Filter out known non-actionable errors
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Ignore network errors that users can't control
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('network error') ||
        message.includes('failed to fetch') ||
        message.includes('load failed') ||
        message.includes('script error')
      ) {
        return null;
      }
    }
    
    return event;
  },
});
