/**
 * Centralized Error Handling Types and Utilities
 *
 * This file provides type-safe error handling patterns for the entire application.
 * It includes standardized error types, error factories, and utilities for consistent
 * error handling across frontend and backend.
 */
import { z } from "zod";
// Base error types
export const ErrorCodeSchema = z.enum([
    "VALIDATION_ERROR",
    "AUTHENTICATION_ERROR",
    "AUTHORIZATION_ERROR",
    "NOT_FOUND",
    "RATE_LIMITED",
    "INTERNAL_ERROR",
    "EXTERNAL_SERVICE_ERROR",
    "NETWORK_ERROR",
    "TIMEOUT_ERROR",
    "INVALID_STATE",
]);
// Standardized error response schema
export const ErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: ErrorCodeSchema,
        message: z.string(),
        details: z.string().optional(),
        timestamp: z.string(),
        requestId: z.string().optional(),
        context: z.record(z.any()).optional(),
    }),
    validationErrors: z.array(z.object({
        field: z.string(),
        message: z.string(),
        code: z.string(),
    })).optional(),
});
// Application-specific error classes
export class AppError extends Error {
    code;
    details;
    context;
    timestamp;
    requestId;
    constructor(code, message, options) {
        super(message, { cause: options?.cause });
        this.name = "AppError";
        this.code = code;
        this.details = options?.details;
        this.context = options?.context;
        this.timestamp = new Date().toISOString();
        this.requestId = options?.requestId;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            requestId: this.requestId,
            context: this.context,
        };
    }
    static fromZodError(zodError, options) {
        return new AppError("VALIDATION_ERROR", "Validation failed", {
            details: zodError.errors.map(e => e.message).join(", "),
            context: { validationErrors: zodError.errors },
            requestId: options?.requestId,
        });
    }
    static fromExternalService(service, error, options) {
        const message = error instanceof Error ? error.message : "External service error";
        return new AppError("EXTERNAL_SERVICE_ERROR", `${service} service error`, {
            details: message,
            context: { service, originalError: error },
            requestId: options?.requestId,
        });
    }
}
// Error factory utilities
export const createError = {
    validation: (message, details, context) => new AppError("VALIDATION_ERROR", message, { details, context }),
    notFound: (resource, id) => new AppError("NOT_FOUND", `${resource} not found`, { context: { resource, id } }),
    unauthorized: (message = "Unauthorized") => new AppError("AUTHENTICATION_ERROR", message),
    forbidden: (message = "Forbidden") => new AppError("AUTHORIZATION_ERROR", message),
    rateLimited: (retryAfter) => new AppError("RATE_LIMITED", "Rate limit exceeded", { context: { retryAfter } }),
    internal: (message = "Internal server error", details) => new AppError("INTERNAL_ERROR", message, { details }),
    externalService: (service, error) => AppError.fromExternalService(service, error),
};
// Error response factory
export const createErrorResponse = (error, validationErrors) => ({
    success: false,
    error: error.toJSON(),
    ...(validationErrors && { validationErrors }),
});
// Type guard for error responses
export const isErrorResponse = (value) => {
    try {
        return ErrorResponseSchema.parse(value).success === false;
    }
    catch {
        return false;
    }
};
// Error handler for Hono
export const errorHandler = (error, requestId) => {
    if (error instanceof AppError) {
        return createErrorResponse(error);
    }
    if (error instanceof z.ZodError) {
        const appError = AppError.fromZodError(error, { requestId });
        return createErrorResponse(appError, error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
        })));
    }
    const appError = new AppError("INTERNAL_ERROR", error instanceof Error ? error.message : "Unknown error", { requestId });
    return createErrorResponse(appError);
};
