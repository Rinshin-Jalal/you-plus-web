/**
 * Environment Variable Types and Validation
 *
 * This file provides type-safe definitions for all environment variables
 * used in the application. It includes runtime validation to ensure
 * all required environment variables are present and correctly typed.
 */

import { z } from "zod";
import type { Queue } from "@cloudflare/workers-types";

/**
 * Schema for validating environment variables (excluding queue bindings)
 */
export const EnvSchema = z.object({
  // Supabase configuration
  SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // AWS Bedrock configuration (OpenAI-compatible API)
  BEDROCK_API_KEY: z.string().min(1, "AWS Bedrock API key is required"),
  BEDROCK_REGION: z.string().min(1, "AWS Bedrock region is required").default("us-west-2"),

  // Cartesia configuration (agent uses this for voice calls)
  CARTESIA_API_KEY: z.string().min(1, "Cartesia API key is required"),
  CARTESIA_AGENT_ID: z.string().optional(),

  // LiveKit configuration (for real-time voice calls)
  LIVEKIT_API_KEY: z.string().min(1, "LiveKit API key is required"),
  LIVEKIT_API_SECRET: z.string().min(1, "LiveKit API secret is required"),
  LIVEKIT_URL: z.string().url("LiveKit URL must be a valid URL"),

  // Optional configuration
  SUPERMEMORY_API_KEY: z.string().optional(),
  DEBUG_ACCESS_TOKEN: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),

  // DodoPayments configuration (for web payments)
  DODO_PAYMENTS_API_KEY: z.string().min(1, "DodoPayments API key is required"),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().min(1, "DodoPayments webhook secret is required"),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).optional().default("test_mode"),

  // Frontend URL (for redirects)
  FRONTEND_URL: z.string().url("Frontend URL must be a valid URL").optional().default("http://localhost:3000"),

  // CORS configuration (optional, comma-separated list of allowed origins)
  CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Environment and deployment
  ENVIRONMENT: z.enum(["development", "staging", "production"], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: "ENVIRONMENT must be 'development', 'staging', or 'production'" };
      }
      return { message: ctx.defaultError };
    },
  }),

  // Backend URL
  BACKEND_URL: z.string().url("Backend URL must be a valid URL"),

  // Backend API Key (for internal service-to-service authentication)
  BACKEND_API_KEY: z.string().min(1, "Backend API key is required").optional(),

  // Cloudflare R2 bucket (automatically provided by Cloudflare)
  AUDIO_BUCKET: z.any(),

  // AWS EventBridge Scheduler (for per-user call scheduling)
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS access key ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS secret access key is required"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_LAMBDA_FUNCTION_ARN: z.string().min(1, "AWS Lambda function ARN is required"),
  AWS_SCHEDULER_ROLE_ARN: z.string().min(1, "AWS Scheduler role ARN is required"),
  AWS_SCHEDULE_GROUP_NAME: z.string().default("youplus-daily-calls"),
}).passthrough();

/**
 * Type inference from the environment schema (env vars only)
 */
export type EnvVars = z.infer<typeof EnvSchema>;

/**
 * Extended Env type including Cloudflare Queue bindings
 * Queue bindings are provided by Cloudflare Workers, not env vars
 */
export interface Env extends EnvVars {
  // Cloudflare Queues bindings
  CALL_ANALYTICS_QUEUE: Queue;
  GAMIFICATION_QUEUE: Queue;
  NIGHTLY_MAINTENANCE_QUEUE: Queue;
}

/**
 * Validate and parse environment variables (excludes queue bindings)
 */
export function validateEnv(env: Record<string, unknown>): EnvVars {
  try {
    return EnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((err) => err.code === z.ZodIssueCode.invalid_type)
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`);

      const invalidVars = error.errors
        .filter((err) => err.code !== z.ZodIssueCode.invalid_type)
        .map((err) => `  - ${err.path.join(".")}: ${err.message}`);

      let errorMessage = "Environment variable validation failed:\n";

      if (missingVars.length > 0) {
        errorMessage += "\nMissing required variables:\n" + missingVars.join("\n");
      }

      if (invalidVars.length > 0) {
        errorMessage += "\nInvalid variables:\n" + invalidVars.join("\n");
      }

      throw new Error(errorMessage);
    }

    throw new Error("Failed to validate environment variables");
  }
}

/**
 * Environment variable categories for better organization
 */
export const EnvCategories = {
  database: {
    SUPABASE_URL: "Supabase project URL",
    SUPABASE_ANON_KEY: "Supabase anonymous key",
    SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key (admin access)",
  },

  ai: {
    BEDROCK_API_KEY: "AWS Bedrock API key for embeddings and AI processing (OpenAI-compatible)",
    BEDROCK_REGION: "AWS Bedrock region (e.g., us-west-2)",
    CARTESIA_API_KEY: "Cartesia API key for STT (Ink) and TTS (sonic-3-latest-latest)",
    CARTESIA_AGENT_ID: "Deployed Cartesia Line agent ID for outbound calls",
    GEMINI_API_KEY: "Gemini API key for returning user personalization (optional)",
  },

  memory: {
    SUPERMEMORY_API_KEY: "Supermemory API key for persistent user context (optional)",
  },

  payments: {
    DODO_PAYMENTS_API_KEY: "DodoPayments API key for web payments",
    DODO_PAYMENTS_WEBHOOK_SECRET: "DodoPayments webhook secret for payment events",
    DODO_PAYMENTS_ENVIRONMENT: "DodoPayments environment (test_mode/live_mode)",
  },

  deployment: {
    ENVIRONMENT: "Application environment (development/staging/production)",
    BACKEND_URL: "Public URL of the backend API",
    FRONTEND_URL: "Public URL of the frontend app",
    CORS_ALLOWED_ORIGINS: "Comma-separated list of allowed CORS origins (optional, auto-derived if not set)",
  },

  development: {
    DEBUG_ACCESS_TOKEN: "Debug access token for development endpoints",
  },

  monitoring: {
    SENTRY_DSN: "Sentry Data Source Name for error tracking and monitoring",
  },

  cloudflare: {
    AUDIO_BUCKET: "Cloudflare R2 bucket for audio storage (automatically provided)",
  },

  aws: {
    AWS_ACCESS_KEY_ID: "AWS access key ID for EventBridge Scheduler",
    AWS_SECRET_ACCESS_KEY: "AWS secret access key for EventBridge Scheduler",
    AWS_REGION: "AWS region for EventBridge Scheduler",
    AWS_LAMBDA_FUNCTION_ARN: "ARN of Lambda function for daily call triggers",
    AWS_SCHEDULER_ROLE_ARN: "ARN of IAM role for EventBridge Scheduler",
    AWS_SCHEDULE_GROUP_NAME: "EventBridge schedule group name",
  },
} as const;

/**
 * Get environment variable description
 */
export function getEnvDescription(varName: keyof typeof EnvCategories): string {
  for (const category of Object.values(EnvCategories)) {
    if (varName in category) {
      return category[varName as keyof typeof category];
    }
  }
  return "No description available";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(env: Env): boolean {
  return env.ENVIRONMENT === "development";
}

/**
 * Check if running in production mode
 */
export function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === "production";
}

/**
 * Check if running in staging mode
 */
export function isStaging(env: Env): boolean {
  return env.ENVIRONMENT === "staging";
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig(env: Env) {
  return {
    isDevelopment: isDevelopment(env),
    isProduction: isProduction(env),
    isStaging: isStaging(env),

    // Feature flags based on environment
    enableDebugEndpoints: isDevelopment(env),
    enableDetailedLogging: !isProduction(env),
    enablePerformanceMonitoring: isProduction(env) || isStaging(env),

    // Timeouts and limits based on environment
    apiTimeout: isDevelopment(env) ? 30000 : 10000,
    maxRetries: isDevelopment(env) ? 1 : 3,

    // URLs
    supabaseUrl: env.SUPABASE_URL,
    backendUrl: env.BACKEND_URL,
  };
}

/**
 * Environment variable validation middleware
 */
export function createEnvValidator() {
  return {
    validate: validateEnv,
    getDescription: getEnvDescription,
    isDevelopment,
    isProduction,
    isStaging,
    getConfig: getEnvConfig,
  };
}
