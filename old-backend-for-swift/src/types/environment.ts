/**
 * Environment Variable Types and Validation
 * 
 * This file provides type-safe definitions for all environment variables
 * used in the application. It includes runtime validation to ensure
 * all required environment variables are present and correctly typed.
 * 
 * Benefits:
 * 1. Compile-time type checking for environment variables
 * 2. Runtime validation with clear error messages
 * 3. Documentation for all environment variables
 * 4. Centralized environment variable management
 */

import { z } from "zod";

/**
 * Schema for validating environment variables
 */
export const EnvSchema = z.object({
  // Supabase configuration
  SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),

  // LiveKit configuration (new)
  LIVEKIT_API_KEY: z.string().min(1, "LiveKit API key is required"),
  LIVEKIT_API_SECRET: z.string().min(1, "LiveKit API secret is required"),
  LIVEKIT_URL: z.string().url("LiveKit URL must be a valid WebSocket URL"),

  // Cartesia configuration (new)
  CARTESIA_API_KEY: z.string().min(1, "Cartesia API key is required"),

  // ElevenLabs configuration (legacy - optional for backward compatibility)
  ELEVENLABS_API_KEY: z.string().optional(),
  
  // iOS VoIP configuration
  IOS_VOIP_KEY_ID: z.string().min(1, "iOS VoIP key ID is required"),
  IOS_VOIP_TEAM_ID: z.string().min(1, "iOS VoIP team ID is required"),
  IOS_VOIP_AUTH_KEY: z.string().min(1, "iOS VoIP auth key is required"),
  
  // Optional configuration
  SUPERMEMORY_API_KEY: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  REVENUECAT_API_KEY: z.string().optional(),
  REVENUECAT_PROJECT_ID: z.string().optional(),
  DEBUG_ACCESS_TOKEN: z.string().optional(),
  
  // DodoPayments configuration (for web payments)
  DODO_PAYMENTS_API_KEY: z.string().min(1, "DodoPayments API key is required"),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().min(1, "DodoPayments webhook secret is required"),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).optional().default("test_mode"),
  
  // Frontend URL (for redirects)
  FRONTEND_URL: z.string().url("Frontend URL must be a valid URL").optional().default("http://localhost:3000"),
  
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
  
  // Cloudflare R2 bucket (automatically provided by Cloudflare)
  AUDIO_BUCKET: z.any(), // R2 bucket binding
}).passthrough(); // Allow additional environment variables

/**
 * Type inference from the environment schema
 */
export type Env = z.infer<typeof EnvSchema>;

/**
 * Validate and parse environment variables
 * This function should be called at application startup
 */
export function validateEnv(env: Record<string, unknown>): Env {
  try {
    return EnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === z.ZodIssueCode.invalid_type)
        .map(err => `  - ${err.path.join('.')}: ${err.message}`);
      
      const invalidVars = error.errors
        .filter(err => err.code !== z.ZodIssueCode.invalid_type)
        .map(err => `  - ${err.path.join('.')}: ${err.message}`);
      
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
    OPENAI_API_KEY: "OpenAI API key for embeddings and AI processing",
    ELEVENLABS_API_KEY: "ElevenLabs API key for voice cloning and synthesis (legacy, optional)",
    LIVEKIT_API_KEY: "LiveKit API key for real-time communication",
    LIVEKIT_API_SECRET: "LiveKit API secret for token generation",
    LIVEKIT_URL: "LiveKit Cloud WebSocket URL (wss://...)",
    CARTESIA_API_KEY: "Cartesia API key for STT (Ink) and TTS (Sonic-3)",
    DEEPGRAM_API_KEY: "Deepgram API key for speech recognition (optional, deprecated)",
  },

  memory: {
    SUPERMEMORY_API_KEY: "Supermemory API key for persistent user context (optional)",
  },
  
  ios: {
    IOS_VOIP_KEY_ID: "iOS VoIP push notification key ID",
    IOS_VOIP_TEAM_ID: "iOS VoIP push notification team ID",
    IOS_VOIP_AUTH_KEY: "iOS VoIP push notification authentication key",
  },
  
  revenue: {
    REVENUECAT_WEBHOOK_SECRET: "RevenueCat webhook secret for subscription validation",
    REVENUECAT_API_KEY: "RevenueCat API key for subscription validation",
    REVENUECAT_PROJECT_ID: "RevenueCat project ID for v2 API",
  },
  
  deployment: {
    ENVIRONMENT: "Application environment (development/staging/production)",
    BACKEND_URL: "Public URL of the backend API",
  },
  
  development: {
    DEBUG_ACCESS_TOKEN: "Debug access token for development endpoints",
  },
  
  cloudflare: {
    AUDIO_BUCKET: "Cloudflare R2 bucket for audio storage (automatically provided)",
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