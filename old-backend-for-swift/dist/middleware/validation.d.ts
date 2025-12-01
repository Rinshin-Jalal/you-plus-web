/**
 * Validation Middleware using Zod
 *
 * This middleware provides runtime validation for API requests and responses
 * using Zod schemas. It ensures type safety at runtime and provides clear
 * error messages for invalid data.
 *
 * Usage:
 * ```typescript
 * // Validate request body
 * app.post("/api/promises", validateJson(CreatePromiseRequestSchema), createPromiseHandler);
 *
 * // Validate response
 * app.get("/api/promises/:id", validateResponse(PromiseResponseSchema), getPromiseHandler);
 *
 * // Validate both request and response
 * app.put("/api/promises/:id",
 *   validateJson(UpdatePromiseRequestSchema),
 *   validateResponse(PromiseResponseSchema),
 *   updatePromiseHandler
 * );

 */
import type { Context, Next } from "hono";
import { z } from "zod";
/**
 * Validates JSON request body against a Zod schema
 */
export declare const validateJson: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 500, "json">) | undefined>;
/**
 * Validates URL parameters against a Zod schema
 */
export declare const validateParams: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 500, "json">) | undefined>;
/**
 * Validates query parameters against a Zod schema
 */
export declare const validateQuery: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
    timestamp?: string | undefined;
    details?: string | undefined;
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, 500, "json">) | undefined>;
/**
 * Validates response data against a Zod schema
 * This middleware wraps the response to ensure it matches the expected schema
 */
export declare const validateResponse: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<void>;
/**
 * Type-safe helper to get validated data from context
 */
export declare const getValidatedBody: <T>(c: Context) => T;
export declare const getValidatedParams: <T>(c: Context) => T;
export declare const getValidatedQuery: <T>(c: Context) => T;
/**
 * Compose multiple validation middlewares
 */
export declare const validate: {
    json: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
        success: false;
        error: string;
        timestamp?: string | undefined;
        details?: string | undefined;
        validationErrors?: {
            code: string;
            message: string;
            field: string;
        }[] | undefined;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        success: false;
        error: string;
        timestamp?: string | undefined;
        details?: string | undefined;
        validationErrors?: {
            code: string;
            message: string;
            field: string;
        }[] | undefined;
    }, 500, "json">) | undefined>;
    params: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
        success: false;
        error: string;
        timestamp?: string | undefined;
        details?: string | undefined;
        validationErrors?: {
            code: string;
            message: string;
            field: string;
        }[] | undefined;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        success: false;
        error: string;
        timestamp?: string | undefined;
        details?: string | undefined;
        validationErrors?: {
            code: string;
            message: string;
            field: string;
        }[] | undefined;
    }, 500, "json">) | undefined>;
    query: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
        success: false;
        error: string;
        timestamp?: string | undefined;
        details?: string | undefined;
        validationErrors?: {
            code: string;
            message: string;
            field: string;
        }[] | undefined;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        success: false;
        error: string;
        timestamp?: string | undefined;
        details?: string | undefined;
        validationErrors?: {
            code: string;
            message: string;
            field: string;
        }[] | undefined;
    }, 500, "json">) | undefined>;
    response: <T>(schema: z.ZodType<T>) => (c: Context, next: Next) => Promise<void>;
};
