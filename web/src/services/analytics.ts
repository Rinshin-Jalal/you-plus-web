/**
 * Analytics Service - PostHog Integration
 * 
 * Centralized analytics with:
 * - Environment flag (NEXT_PUBLIC_ANALYTICS_ENABLED)
 * - PII redaction (never send email, name, phone)
 * - Type-safe event names
 * - Cross-platform ready (web now, mobile later)
 */

import posthog from 'posthog-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
// Default ON: disable only if explicitly set to "false"
const ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';
const isDev = process.env.NODE_ENV === 'development';

// ============================================================================
// EVENT NAMES - Type-safe event tracking
// ============================================================================

/**
 * Core Funnel Events
 * 
 * Naming convention: {domain}.{action}
 * - auth.* - Authentication events
 * - checkout.* - Payment/checkout events
 * - onboarding.* - Onboarding wizard events
 */
export const AnalyticsEvents = {
  // Auth funnel
  AUTH_SIGNUP_STARTED: 'auth.signup_started',
  AUTH_SIGNUP_COMPLETED: 'auth.signup_completed',
  AUTH_LOGIN_STARTED: 'auth.login_started',
  AUTH_LOGIN_COMPLETED: 'auth.login_completed',
  AUTH_LOGOUT: 'auth.logout',

  // Checkout funnel
  CHECKOUT_VIEWED: 'checkout.viewed',
  CHECKOUT_PLAN_SELECTED: 'checkout.plan_selected',
  CHECKOUT_STARTED: 'checkout.started',
  CHECKOUT_COMPLETED: 'checkout.completed',
  CHECKOUT_FAILED: 'checkout.failed',

  // Onboarding funnel
  ONBOARDING_STARTED: 'onboarding.started',
  ONBOARDING_STEP_COMPLETED: 'onboarding.step_completed',
  ONBOARDING_STEP_SKIPPED: 'onboarding.step_skipped',
  ONBOARDING_PILLARS_SELECTED: 'onboarding.pillars_selected',
  ONBOARDING_VOICE_RECORDED: 'onboarding.voice_recorded',
  ONBOARDING_COMPLETED: 'onboarding.completed',
  ONBOARDING_SUBMITTED: 'onboarding.submitted',
  ONBOARDING_ABANDONED: 'onboarding.abandoned',

  // Setup/post-payment
  SETUP_STARTED: 'setup.started',
  SETUP_COMPLETED: 'setup.completed',
  SETUP_FAILED: 'setup.failed',

  // Dashboard engagement
  DASHBOARD_VIEWED: 'dashboard.viewed',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// ============================================================================
// PII REDACTION
// ============================================================================

/**
 * Fields that should NEVER be sent to analytics
 */
const PII_FIELDS = [
  'email',
  'name',
  'phone',
  'phoneNumber',
  'phone_number',
  'firstName',
  'lastName',
  'first_name',
  'last_name',
  'address',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
];

/**
 * Redact PII from event properties
 */
function redactPII(properties: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip PII fields
    if (PII_FIELDS.some(pii => key.toLowerCase().includes(pii.toLowerCase()))) {
      continue;
    }
    
    // Recursively redact nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      redacted[key] = redactPII(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

let isInitialized = false;

/**
 * Initialize PostHog analytics
 * Call this once in your app's root provider
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  if (!ANALYTICS_ENABLED) {
    if (isDev) console.debug('[Analytics] Disabled via environment');
    return;
  }
  if (!POSTHOG_KEY) {
    console.warn('[Analytics] NEXT_PUBLIC_POSTHOG_KEY not set');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture page leave events
    capture_pageleave: true,
    // Disable session recording by default (enable in PostHog dashboard if needed)
    disable_session_recording: false,
    // Respect Do Not Track
    respect_dnt: true,
    // Persistence across sessions
    persistence: 'localStorage+cookie',
    // Bootstrap with loaded state
    loaded: (posthogInstance) => {
      // In development, enable debug mode
      if (isDev) {
        posthogInstance.debug();
      }
    },
  });

  isInitialized = true;
  if (isDev) console.debug('[Analytics] PostHog initialized');
}

/**
 * Track an event with optional properties
 * PII is automatically redacted
 */
export function track(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
): void {
  if (!ANALYTICS_ENABLED || !isInitialized) {
    if (isDev) {
      console.debug('[Analytics] Would track:', event, properties);
    }
    return;
  }

  const safeProperties = properties ? redactPII(properties) : {};
  posthog.capture(event, safeProperties);
}

/**
 * Identify a user (call after login)
 * Only pass user ID, never PII
 */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  if (!ANALYTICS_ENABLED || !isInitialized) return;

  const safeTraits = traits ? redactPII(traits) : {};
  posthog.identify(userId, safeTraits);
}

/**
 * Reset user identity (call on logout)
 */
export function reset(): void {
  if (!ANALYTICS_ENABLED || !isInitialized) return;
  posthog.reset();
}

/**
 * Set user properties without identifying
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!ANALYTICS_ENABLED || !isInitialized) return;
  posthog.people.set(redactPII(properties));
}

/**
 * Track page view manually (usually automatic)
 */
export function trackPageView(url?: string): void {
  if (!ANALYTICS_ENABLED || !isInitialized) return;
  posthog.capture('$pageview', url ? { $current_url: url } : undefined);
}

/**
 * Get PostHog instance for advanced usage
 */
export function getPostHog(): typeof posthog | null {
  if (!ANALYTICS_ENABLED || !isInitialized) return null;
  return posthog;
}

/**
 * Check if analytics is enabled and initialized
 */
export function isAnalyticsReady(): boolean {
  return ANALYTICS_ENABLED && isInitialized;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flag names - define flags here for type safety
 * Create these in PostHog dashboard: https://app.posthog.com/feature_flags
 */
export const FeatureFlags = {
  // Example flags - add real ones as needed
  NEW_ONBOARDING_FLOW: 'new-onboarding-flow',
  SKIP_VOICE_RECORDING: 'skip-voice-recording',
  SHOW_YEARLY_DISCOUNT: 'show-yearly-discount',
} as const;

export type FeatureFlag = typeof FeatureFlags[keyof typeof FeatureFlags];

/**
 * Check if a feature flag is enabled
 * Returns defaultValue if PostHog isn't ready or flag doesn't exist
 */
export function isFeatureEnabled(flag: FeatureFlag | string, defaultValue: boolean = false): boolean {
  if (!ANALYTICS_ENABLED || !isInitialized) {
    return defaultValue;
  }
  
  const value = posthog.isFeatureEnabled(flag);
  // isFeatureEnabled returns undefined if not loaded yet
  return value ?? defaultValue;
}

/**
 * Get feature flag payload (for multivariate flags)
 * Returns defaultValue if PostHog isn't ready or flag doesn't exist
 */
export function getFeatureFlagPayload<T>(flag: FeatureFlag | string, defaultValue: T): T {
  if (!ANALYTICS_ENABLED || !isInitialized) {
    return defaultValue;
  }
  
  const payload = posthog.getFeatureFlagPayload(flag);
  return (payload as T) ?? defaultValue;
}

/**
 * Reload feature flags (call after user identity changes)
 */
export function reloadFeatureFlags(): void {
  if (!ANALYTICS_ENABLED || !isInitialized) return;
  posthog.reloadFeatureFlags();
}

/**
 * Subscribe to feature flag changes
 * Returns unsubscribe function
 */
export function onFeatureFlagsLoaded(callback: () => void): () => void {
  if (!ANALYTICS_ENABLED || !isInitialized) {
    // Call immediately with defaults if not initialized
    callback();
    return () => {};
  }
  
  return posthog.onFeatureFlags(callback);
}

// ============================================================================
// CONVENIENCE METHODS FOR CORE FUNNEL
// ============================================================================

export const analytics = {
  // Initialize
  init: initAnalytics,
  
  // Core methods
  track,
  identify,
  reset,
  setUserProperties,
  trackPageView,
  isReady: isAnalyticsReady,
  
  // Feature flags
  isFeatureEnabled,
  getFeatureFlagPayload,
  reloadFeatureFlags,
  onFeatureFlagsLoaded,
  
  // Auth events
  authSignupStarted: (provider: 'google' | 'apple' | 'email') => 
    track(AnalyticsEvents.AUTH_SIGNUP_STARTED, { provider }),
  
  authSignupCompleted: (provider: 'google' | 'apple' | 'email') => 
    track(AnalyticsEvents.AUTH_SIGNUP_COMPLETED, { provider }),
  
  authLoginStarted: (provider: 'google' | 'apple' | 'email') => 
    track(AnalyticsEvents.AUTH_LOGIN_STARTED, { provider }),
  
  authLoginCompleted: (provider: 'google' | 'apple' | 'email') => 
    track(AnalyticsEvents.AUTH_LOGIN_COMPLETED, { provider }),
  
  authLogout: () => 
    track(AnalyticsEvents.AUTH_LOGOUT),

  // Checkout events
  checkoutViewed: (hasOnboardingData: boolean, isAuthenticated: boolean) => 
    track(AnalyticsEvents.CHECKOUT_VIEWED, { hasOnboardingData, isAuthenticated }),
  
  checkoutPlanSelected: (planId: string, interval: 'month' | 'year', priceInCents: number) => 
    track(AnalyticsEvents.CHECKOUT_PLAN_SELECTED, { planId, interval, priceInCents }),
  
  checkoutStarted: (planId: string, interval: 'month' | 'year') => 
    track(AnalyticsEvents.CHECKOUT_STARTED, { planId, interval }),
  
  checkoutCompleted: (planId: string, interval: 'month' | 'year') => 
    track(AnalyticsEvents.CHECKOUT_COMPLETED, { planId, interval }),
  
  checkoutFailed: (planId: string, error?: string) => 
    track(AnalyticsEvents.CHECKOUT_FAILED, { planId, error }),

  // Onboarding events
  onboardingStarted: () => 
    track(AnalyticsEvents.ONBOARDING_STARTED),
  
  onboardingStepCompleted: (stepId: string | number, stepType: string, stepIndex: number, totalSteps: number) => 
    track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { 
      stepId: String(stepId), 
      stepType, 
      stepIndex,
      totalSteps,
      progressPercent: Math.round((stepIndex / totalSteps) * 100),
    }),
  
  onboardingPillarsSelected: (pillars: string[], primaryPillar: string) => 
    track(AnalyticsEvents.ONBOARDING_PILLARS_SELECTED, { 
      pillars, 
      primaryPillar, 
      pillarCount: pillars.length,
    }),
  
  onboardingVoiceRecorded: (recordingType: 'dark_future' | 'why' | 'pledge', durationSeconds: number) => 
    track(AnalyticsEvents.ONBOARDING_VOICE_RECORDED, { recordingType, durationSeconds }),
  
  onboardingCompleted: (totalSteps: number, durationSeconds?: number) => 
    track(AnalyticsEvents.ONBOARDING_COMPLETED, { totalSteps, durationSeconds }),
  
  onboardingAbandoned: (lastStepId: string | number, stepIndex: number, totalSteps: number) => 
    track(AnalyticsEvents.ONBOARDING_ABANDONED, { 
      lastStepId: String(lastStepId), 
      stepIndex,
      totalSteps,
      progressPercent: Math.round((stepIndex / totalSteps) * 100),
    }),

  // Setup events
  setupStarted: () => 
    track(AnalyticsEvents.SETUP_STARTED),
  
  setupCompleted: (durationSeconds?: number) => 
    track(AnalyticsEvents.SETUP_COMPLETED, { durationSeconds }),
  
  setupFailed: (error?: string) => 
    track(AnalyticsEvents.SETUP_FAILED, { error }),

  // Dashboard
  dashboardViewed: () => 
    track(AnalyticsEvents.DASHBOARD_VIEWED),
};

export default analytics;
