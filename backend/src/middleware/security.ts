/**
 * Security Middleware for Production Hardening
 */

import { Context, Next } from "hono";
import { Env } from "../index";

// Rate limiting storage (in production, use Redis or KV store)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * REDO IT WHEN WE BREAK PRODUCTION LOL!
 */
export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 60000, // 1 minute
) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const clientIP = c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For") ||
      "unknown";

    const now = Date.now();
    const key = `${clientIP}:${c.req.path}`;
    const limit = rateLimitMap.get(key);

    if (limit) {
      if (now < limit.resetTime) {
        if (limit.count >= maxRequests) {
          return c.json(
            {
              error: "Rate limit exceeded",
              resetTime: new Date(limit.resetTime).toISOString(),
            },
            429,
          );
        }
        limit.count++;
      } else {
        // Reset window
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      }
    } else {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      const cutoff = now - windowMs;
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.resetTime < cutoff) {
          rateLimitMap.delete(k);
        }
      }
    }

    return await next();
  };
};

/**
 * CORS middleware with secure defaults
 */
export const corsMiddleware = () => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const env = c.env as Env;
    const origin = c.req.header("Origin");

    // Allowed origins for all environments
    const allowedOrigins = [
      "https://you-plus.app", // Production domain
      "https://youplus.app", // Production domain alt
      "https://you-plus-staging.app", // Staging domain
      "http://localhost:3000", // Local Next.js dev
      "http://localhost:3001", // Local Next.js dev alt port
      "http://127.0.0.1:3000", // Local dev
    ];

    // Allow all origins for development, or check allowed list
    if (env.ENVIRONMENT === "development") {
      c.header("Access-Control-Allow-Origin", origin || "*");
    } else if (origin && allowedOrigins.includes(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
    } else if (origin && origin.includes("localhost")) {
      // Always allow localhost for development convenience
      c.header("Access-Control-Allow-Origin", origin);
    }

    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Max-Age", "86400"); // 24 hours

    // Handle preflight requests
    if (c.req.method === "OPTIONS") {
      return c.text("", 204);
    }

    return await next();
  };
};

/**
 * Enhanced debug endpoint protection
 */
export const debugProtection = () => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const env = c.env as Env;

    // Multiple layers of protection
    const isProduction = env.ENVIRONMENT === "production";
    const nodeEnv = process.env.NODE_ENV;
    const debugHeader = c.req.header("X-Debug-Access");

    // Block if any production indicator is present
    if (isProduction || nodeEnv === "production") {
      return c.json({ error: "Debug endpoints disabled in production" }, 403);
    }

    // Additional debug access token check for sensitive endpoints
    if (
      c.req.path.includes("/trigger/") && debugHeader !== env.DEBUG_ACCESS_TOKEN
    ) {
      return c.json({ error: "Debug access token required" }, 403);
    }

    console.warn(
      `🚨 Debug endpoint accessed: ${c.req.path} from ${
        c.req.header("CF-Connecting-IP")
      }`,
    );

    return await next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = () => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    await next();

    // Add security headers to response
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    // Don't cache sensitive endpoints
    if (c.req.path.includes("/api/")) {
      c.header("Cache-Control", "no-cache, no-store, must-revalidate");
      c.header("Pragma", "no-cache");
      c.header("Expires", "0");
    }
  };
};
