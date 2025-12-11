/**
 * Sentry Integration for Cloudflare Workers
 *
 * This module provides Sentry error tracking and performance monitoring
 * for the Hono-based Cloudflare Workers backend.
 */

import {
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  setUser as sentrySetUser,
  addBreadcrumb as sentryAddBreadcrumb,
  setExtras,
  honoIntegration,
  setAsyncLocalStorageAsyncContextStrategy,
} from "@sentry/cloudflare";
import { Context, Next } from "hono";
import { Env } from "@/types/environment";

// Enable async context tracking for Cloudflare Workers
setAsyncLocalStorageAsyncContextStrategy();

/**
 * Check if Sentry is configured
 */
function isSentryConfigured(env: Env): boolean {
  const dsn = (env as unknown as Record<string, string>).SENTRY_DSN;
  return !!dsn;
}

/**
 * Sentry middleware for Hono
 * Captures unhandled errors and adds request context
 */
export function sentryMiddleware() {
  return async (c: Context, next: Next): Promise<void | Response> => {
    const env = c.env as Env;

    // Skip if Sentry is not configured
    if (!isSentryConfigured(env)) {
      await next();
      return;
    }

    // Set user context if available
    const userId = c.get("userId");
    if (userId) {
      sentrySetUser({ id: userId });
    }

    // Add request breadcrumb
    sentryAddBreadcrumb({
      category: "http",
      message: `${c.req.method} ${c.req.path}`,
      level: "info",
      data: {
        url: c.req.url,
        method: c.req.method,
      },
    });

    try {
      await next();
    } catch (error) {
      // Capture the exception with additional context
      setExtras({
        path: c.req.path,
        method: c.req.method,
        userId: userId || "anonymous",
      });
      sentryCaptureException(error);

      // Re-throw to let the error handler process it
      throw error;
    }
  };
}

/**
 * Get the Hono integration for Sentry initialization
 * Use this when setting up Sentry with withSentry wrapper
 */
export function getHonoIntegration() {
  return honoIntegration();
}

/**
 * Capture an exception to Sentry with optional extra context
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (context) {
    setExtras(context);
  }
  sentryCaptureException(error);
}

/**
 * Capture an exception using context from Hono request
 */
export function captureExceptionFromContext(
  c: Context,
  error: unknown,
  context?: Record<string, unknown>
) {
  const env = c.env as Env;
  
  if (!isSentryConfigured(env)) {
    console.error("[Sentry] Not configured, error:", error, context);
    return;
  }

  const extras = {
    path: c.req.path,
    method: c.req.method,
    url: c.req.url,
    ...context,
  };
  
  setExtras(extras);
  sentryCaptureException(error);
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "log" | "info" | "debug" = "info"
) {
  sentryCaptureMessage(message, level);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  sentrySetUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: "fatal" | "error" | "warning" | "log" | "info" | "debug";
  data?: Record<string, unknown>;
}) {
  sentryAddBreadcrumb(breadcrumb);
}
