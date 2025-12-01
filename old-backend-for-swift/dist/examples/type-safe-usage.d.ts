/**
 * Type-Safe Usage Examples
 *
 * This file demonstrates how to use the new type-safe patterns throughout the application.
 * It shows practical examples of error handling, middleware, shared types, and external API validation.
 */
import { Hono } from "hono";
declare const app: Hono<{
    Variables: {
        requestId: string;
        userId: string;
    };
}, import("hono/types").BlankSchema, "/">;
export default app;
