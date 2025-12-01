import { Context, Next } from "hono";
/**
 * Middleware to verify Supabase JWT tokens and extract user ID
 * NOTE: This only checks authentication, not subscription status
 */
export declare const requireAuth: (c: Context, next: Next) => Promise<Response | void>;
/**
 * 🚀 PROPER REVENUECAT MIDDLEWARE: Requires BOTH authentication AND active subscription
 * Uses RevenueCat SDK for real-time validation with development bypass
 */
export declare const requireActiveSubscription: (c: Context, next: Next) => Promise<Response | void>;
/**
 * Helper to get authenticated user ID from context
 */
export declare const getAuthenticatedUserId: (c: Context) => string;
/**
 * 👻 GUEST AUTHENTICATION MIDDLEWARE
 * Allows access to routes with EITHER a valid user token OR a valid guest token
 * Used for onboarding flow where user hasn't signed up yet
 */
export declare const requireGuestOrUser: (c: Context, next: Next) => Promise<Response | void>;
