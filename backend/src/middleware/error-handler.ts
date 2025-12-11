import { Context, Next } from "hono";
import { Env } from "@/index";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { captureExceptionFromContext } from "@/lib/sentry";

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
  DODOPAYMENTS = "dodopayments",
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
        const details = isDevelopment && error.details ? { details: error.details } : {};
        return c.json(
          {
            error: error.message,
            statusCode: error.statusCode,
            timestamp: new Date().toISOString(),
            ...details,
          },
          error.statusCode as ContentfulStatusCode
        );
      }

      if (error instanceof ServiceError) {
        return handleServiceError(c, error, isDevelopment);
      }

      console.error("Unexpected error:", error);
      // Capture unexpected errors to Sentry
      captureExceptionFromContext(c, error, {
        path: c.req.path,
        method: c.req.method,
        userId: c.get("userId") || "anonymous",
        isOperational: false,
      });
      const stack = isDevelopment ? { stack: (error as Error).stack } : {};
      return c.json(
        {
          error: isDevelopment
            ? String(error)
            : "An unexpected error occurred. Please try again later.",
          statusCode: 500,
          timestamp: new Date().toISOString(),
          ...stack,
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

    case ServiceType.DODOPAYMENTS: {
      console.warn("DodoPayments service degraded - implementing fallback");
      const details = isDevelopment ? { details: error.originalError } : {};
      return c.json(
        {
          ...baseResponse,
          message: "Payment service temporarily unavailable. Your existing access is preserved.",
          degradedMode: true,
          ...details,
        },
        503
      );
    }

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

    default: {
      const details = isDevelopment ? { details: error.originalError } : {};
      return c.json(
        {
          ...baseResponse,
          message: "External service temporarily unavailable. Please try again later.",
          ...details,
        },
        503
      );
    }
  }
}



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
