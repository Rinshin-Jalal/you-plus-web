/**
 * Type-Safe Middleware Patterns
 *
 * This file provides reusable, type-safe middleware patterns for Hono applications.
 * It includes typed validation, error handling, and response formatting utilities.
 */
import { z } from "zod";
import { AppError, createErrorResponse } from "@/types/errors";
// Type-safe validation middleware factory
export const createValidationMiddleware = (schema, source = "body") => {
    return async (c, next) => {
        try {
            let data;
            switch (source) {
                case "body":
                    data = await c.req.json();
                    break;
                case "params":
                    data = c.req.param();
                    break;
                case "query":
                    data = Object.fromEntries(Object.entries(c.req.queries()));
                    break;
            }
            const validated = schema.parse(data);
            c.set(`validated${source.charAt(0).toUpperCase() + source.slice(1)}`, validated);
            await next();
            return;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const appError = AppError.fromZodError(error);
                return c.json(createErrorResponse(appError, error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: e.code,
                }))), 400);
            }
            const appError = new AppError("INTERNAL_ERROR", "Validation failed");
            return c.json(createErrorResponse(appError), 500);
        }
    };
};
// Request ID middleware for tracing
export const requestIdMiddleware = async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set("requestId", requestId);
    c.header("X-Request-ID", requestId);
    await next();
    return;
};
// Utility to extract validated data from context
export const getValidatedData = (c, key) => {
    const data = c.get(key);
    if (!data) {
        throw new AppError("VALIDATION_ERROR", `No ${key} found in context`);
    }
    return data;
};
// Pre-built validation middlewares
export const validateBody = (schema) => createValidationMiddleware(schema, "body");
export const validateParams = (schema) => createValidationMiddleware(schema, "params");
export const validateQuery = (schema) => createValidationMiddleware(schema, "query");
// Type-safe response wrapper
export const createResponseWrapper = (schema, successMessage) => {
    return (data, status = 200) => {
        const validated = schema.parse(data);
        return {
            success: true,
            data: validated,
            message: successMessage,
            timestamp: new Date().toISOString(),
        };
    };
};
// Middleware for consistent error handling
export const errorHandlingMiddleware = async (c, next) => {
    try {
        await next();
        return;
    }
    catch (error) {
        const requestId = c.get("requestId");
        if (error instanceof AppError) {
            return c.json(createErrorResponse(error), getHttpStatusFromErrorCode(error.code));
        }
        if (error instanceof z.ZodError) {
            const appError = AppError.fromZodError(error, { requestId });
            return c.json(createErrorResponse(appError, error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
                code: e.code,
            }))), 400);
        }
        const appError = new AppError("INTERNAL_ERROR", error instanceof Error ? error.message : "Unknown error", { requestId });
        return c.json(createErrorResponse(appError), 500);
    }
};
// Helper to map error codes to HTTP status codes
const getHttpStatusFromErrorCode = (code) => {
    switch (code) {
        case "VALIDATION_ERROR":
            return 400;
        case "AUTHENTICATION_ERROR":
            return 401;
        case "AUTHORIZATION_ERROR":
            return 403;
        case "NOT_FOUND":
            return 404;
        case "RATE_LIMITED":
            return 429;
        case "EXTERNAL_SERVICE_ERROR":
        case "NETWORK_ERROR":
        case "TIMEOUT_ERROR":
            return 502;
        case "INVALID_STATE":
            return 409;
        default:
            return 500;
    }
};
