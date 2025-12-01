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

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

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

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Application-specific error classes
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: string | undefined;
  public readonly context?: Record<string, any> | undefined;
  public readonly timestamp: string;
  public readonly requestId?: string | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      details?: string | undefined;
      context?: Record<string, any> | undefined;
      requestId?: string | undefined;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.details = options?.details;
    this.context = options?.context;
    this.timestamp = new Date().toISOString();
    this.requestId = options?.requestId;
  }

  toJSON(): ErrorResponse["error"] {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      context: this.context,
    };
  }

  static fromZodError(
    zodError: z.ZodError,
    options?: { requestId?: string | undefined }
  ): AppError {
    return new AppError(
      "VALIDATION_ERROR",
      "Validation failed",
      {
        details: zodError.errors.map(e => e.message).join(", "),
        context: { validationErrors: zodError.errors },
        requestId: options?.requestId,
      }
    );
  }

  static fromExternalService(
    service: string,
    error: unknown,
    options?: { requestId?: string | undefined }
  ): AppError {
    const message = error instanceof Error ? error.message : "External service error";
    return new AppError(
      "EXTERNAL_SERVICE_ERROR",
      `${service} service error`,
      {
        details: message,
        context: { service, originalError: error },
        requestId: options?.requestId,
      }
    );
  }
}

// Error factory utilities
export const createError = {
  validation: (message: string, details?: string | undefined, context?: Record<string, any> | undefined) =>
    new AppError("VALIDATION_ERROR", message, { details, context }),
  
  notFound: (resource: string, id?: string) =>
    new AppError("NOT_FOUND", `${resource} not found`, { context: { resource, id } }),
  
  unauthorized: (message = "Unauthorized") =>
    new AppError("AUTHENTICATION_ERROR", message),
  
  forbidden: (message = "Forbidden") =>
    new AppError("AUTHORIZATION_ERROR", message),
  
  rateLimited: (retryAfter?: number) =>
    new AppError("RATE_LIMITED", "Rate limit exceeded", { context: { retryAfter } }),
  
  internal: (message = "Internal server error", details?: string | undefined) =>
    new AppError("INTERNAL_ERROR", message, { details }),
  
  externalService: (service: string, error: unknown) =>
    AppError.fromExternalService(service, error),
};

// Error response factory
export const createErrorResponse = (
  error: AppError,
  validationErrors?: Array<{ field: string; message: string; code: string }>
): ErrorResponse => ({
  success: false,
  error: error.toJSON(),
  ...(validationErrors && { validationErrors }),
});

// Type guard for error responses
export const isErrorResponse = (value: unknown): value is ErrorResponse => {
  try {
    return ErrorResponseSchema.parse(value).success === false;
  } catch {
    return false;
  }
};

// Error handler for Hono
export const errorHandler = (error: unknown, requestId?: string | undefined) => {
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

  const appError = new AppError(
    "INTERNAL_ERROR",
    error instanceof Error ? error.message : "Unknown error",
    { requestId }
  );
  return createErrorResponse(appError);
};