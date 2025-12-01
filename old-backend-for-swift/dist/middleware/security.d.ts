/**
 * Security Middleware for Production Hardening
 */
import { Context, Next } from "hono";
/**
 * Rate limiting middleware
 * REDO IT WHEN WE BREAK PRODUCTION LOL!
 */
export declare const rateLimit: (maxRequests?: number, windowMs?: number) => (c: Context, next: Next) => Promise<Response | void>;
/**
 * CORS middleware with secure defaults
 */
export declare const corsMiddleware: () => (c: Context, next: Next) => Promise<Response | void>;
/**
 * Enhanced debug endpoint protection
 */
export declare const debugProtection: () => (c: Context, next: Next) => Promise<Response | void>;
/**
 * Security headers middleware
 */
export declare const securityHeaders: () => (c: Context, next: Next) => Promise<Response | void>;
