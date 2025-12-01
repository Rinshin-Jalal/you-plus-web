/**
 * Centralized Error Handling Types and Utilities
 *
 * This file provides type-safe error handling patterns for the entire application.
 * It includes standardized error types, error factories, and utilities for consistent
 * error handling across frontend and backend.
 */
import { z } from "zod";
export declare const ErrorCodeSchema: z.ZodEnum<["VALIDATION_ERROR", "AUTHENTICATION_ERROR", "AUTHORIZATION_ERROR", "NOT_FOUND", "RATE_LIMITED", "INTERNAL_ERROR", "EXTERNAL_SERVICE_ERROR", "NETWORK_ERROR", "TIMEOUT_ERROR", "INVALID_STATE"]>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodEnum<["VALIDATION_ERROR", "AUTHENTICATION_ERROR", "AUTHORIZATION_ERROR", "NOT_FOUND", "RATE_LIMITED", "INTERNAL_ERROR", "EXTERNAL_SERVICE_ERROR", "NETWORK_ERROR", "TIMEOUT_ERROR", "INVALID_STATE"]>;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        requestId: z.ZodOptional<z.ZodString>;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        code: "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "INTERNAL_ERROR" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "TIMEOUT_ERROR" | "INVALID_STATE";
        message: string;
        timestamp: string;
        details?: string | undefined;
        requestId?: string | undefined;
        context?: Record<string, any> | undefined;
    }, {
        code: "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "INTERNAL_ERROR" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "TIMEOUT_ERROR" | "INVALID_STATE";
        message: string;
        timestamp: string;
        details?: string | undefined;
        requestId?: string | undefined;
        context?: Record<string, any> | undefined;
    }>;
    validationErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        message: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        field: string;
    }, {
        code: string;
        message: string;
        field: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "INTERNAL_ERROR" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "TIMEOUT_ERROR" | "INVALID_STATE";
        message: string;
        timestamp: string;
        details?: string | undefined;
        requestId?: string | undefined;
        context?: Record<string, any> | undefined;
    };
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}, {
    success: false;
    error: {
        code: "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "INTERNAL_ERROR" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "TIMEOUT_ERROR" | "INVALID_STATE";
        message: string;
        timestamp: string;
        details?: string | undefined;
        requestId?: string | undefined;
        context?: Record<string, any> | undefined;
    };
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly details?: string | undefined;
    readonly context?: Record<string, any> | undefined;
    readonly timestamp: string;
    readonly requestId?: string | undefined;
    constructor(code: ErrorCode, message: string, options?: {
        details?: string | undefined;
        context?: Record<string, any> | undefined;
        requestId?: string | undefined;
        cause?: Error;
    });
    toJSON(): ErrorResponse["error"];
    static fromZodError(zodError: z.ZodError, options?: {
        requestId?: string | undefined;
    }): AppError;
    static fromExternalService(service: string, error: unknown, options?: {
        requestId?: string | undefined;
    }): AppError;
}
export declare const createError: {
    validation: (message: string, details?: string | undefined, context?: Record<string, any> | undefined) => AppError;
    notFound: (resource: string, id?: string) => AppError;
    unauthorized: (message?: string) => AppError;
    forbidden: (message?: string) => AppError;
    rateLimited: (retryAfter?: number) => AppError;
    internal: (message?: string, details?: string | undefined) => AppError;
    externalService: (service: string, error: unknown) => AppError;
};
export declare const createErrorResponse: (error: AppError, validationErrors?: Array<{
    field: string;
    message: string;
    code: string;
}>) => ErrorResponse;
export declare const isErrorResponse: (value: unknown) => value is ErrorResponse;
export declare const errorHandler: (error: unknown, requestId?: string | undefined) => {
    success: false;
    error: {
        code: "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "INTERNAL_ERROR" | "EXTERNAL_SERVICE_ERROR" | "NETWORK_ERROR" | "TIMEOUT_ERROR" | "INVALID_STATE";
        message: string;
        timestamp: string;
        details?: string | undefined;
        requestId?: string | undefined;
        context?: Record<string, any> | undefined;
    };
    validationErrors?: {
        code: string;
        message: string;
        field: string;
    }[] | undefined;
};
