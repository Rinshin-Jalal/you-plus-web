import { Context, Next } from "hono";
import { Env } from "@/index";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export enum ServiceType {
  SUPABASE = "supabase",
  REVENUECAT = "revenuecat",
  ELEVENLABS = "elevenlabs",
  LIVEKIT = "livekit",
  R2 = "r2",
  UNKNOWN = "unknown",
}

export class ServiceError extends AppError {
  constructor(
    public service: ServiceType,
    message: string,
    public originalError?: unknown,
    statusCode: number = 503
  ) {
    super(statusCode, `${service} service error: ${message}`, true, originalError);
    this.name = "ServiceError";
  }
}

export const errorHandler = () => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      await next();
    } catch (error) {
      const env = c.env as Env;
      const isDevelopment = env.ENVIRONMENT === "development";

      console.error("Error handler caught:", {
        error,
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString(),
        userId: c.get("userId") || "anonymous",
      });

      if (error instanceof AppError) {
        return c.json(
          {
            error: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString(),
            ...(isDevelopment && error.details && { details: error.details }),
          },
          error.statusCode
        );
      }

      if (error instanceof ServiceError) {
        return handleServiceError(c, error, isDevelopment);
      }

      console.error("Unexpected error:", error);
      return c.json(
        {
          error: isDevelopment
            ? String(error)
            : "An unexpected error occurred. Please try again later.",
          statusCode: 500,
          timestamp: new Date().toISOString(),
          ...(isDevelopment && { stack: (error as Error).stack }),
        },
        500
      );
    }
  };
};

function handleServiceError(
  c: Context,
  error: ServiceError,
  isDevelopment: boolean
): Response {
  const baseResponse = {
    error: error.message,
    service: error.service,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
  };

  switch (error.service) {
    case ServiceType.SUPABASE:
      return c.json(
        {
          ...baseResponse,
          message: "Database service temporarily unavailable. Please try again in a few moments.",
          retryAfter: 60,
        },
        503
      );

    case ServiceType.REVENUECAT:
      console.warn("RevenueCat service degraded - implementing fallback");
      return c.json(
        {
          ...baseResponse,
          message: "Payment service temporarily unavailable. Your existing access is preserved.",
          degradedMode: true,
          ...(isDevelopment && { details: error.originalError }),
        },
        503
      );

    case ServiceType.ELEVENLABS:
      return c.json(
        {
          ...baseResponse,
          message: "Voice service temporarily unavailable. Please try again later.",
          fallback: "text-to-speech temporarily disabled",
        },
        503
      );

    case ServiceType.LIVEKIT:
      return c.json(
        {
          ...baseResponse,
          message: "Call service temporarily unavailable. Please try again in a few minutes.",
          retryAfter: 300,
        },
        503
      );

    case ServiceType.R2:
      console.warn("R2 storage service degraded");
      return c.json(
        {
          ...baseResponse,
          message: "Storage service temporarily unavailable. Some features may be limited.",
          degradedMode: true,
        },
        503
      );

    default:
      return c.json(
        {
          ...baseResponse,
          message: "External service temporarily unavailable. Please try again later.",
          ...(isDevelopment && { details: error.originalError }),
        },
        503
      );
  }
}

export const asyncHandler = (
  fn: (c: Context) => Promise<Response>
) => {
  return async (c: Context): Promise<Response> => {
    try {
      return await fn(c);
    } catch (error) {
      throw error;
    }
  };
};

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, true, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(401, message, true);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(403, message, true);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(404, `${resource} not found`, true);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super(429, "Rate limit exceeded", true, { retryAfter });
    this.name = "RateLimitError";
  }
}
