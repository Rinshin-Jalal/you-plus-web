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
export declare const EnvSchema: z.ZodObject<{
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    OPENAI_API_KEY: z.ZodString;
    LIVEKIT_API_KEY: z.ZodString;
    LIVEKIT_API_SECRET: z.ZodString;
    LIVEKIT_URL: z.ZodString;
    CARTESIA_API_KEY: z.ZodString;
    ELEVENLABS_API_KEY: z.ZodOptional<z.ZodString>;
    IOS_VOIP_KEY_ID: z.ZodString;
    IOS_VOIP_TEAM_ID: z.ZodString;
    IOS_VOIP_AUTH_KEY: z.ZodString;
    SUPERMEMORY_API_KEY: z.ZodOptional<z.ZodString>;
    DEEPGRAM_API_KEY: z.ZodOptional<z.ZodString>;
    REVENUECAT_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    REVENUECAT_API_KEY: z.ZodOptional<z.ZodString>;
    REVENUECAT_PROJECT_ID: z.ZodOptional<z.ZodString>;
    DEBUG_ACCESS_TOKEN: z.ZodOptional<z.ZodString>;
    ENVIRONMENT: z.ZodEnum<["development", "staging", "production"]>;
    BACKEND_URL: z.ZodString;
    AUDIO_BUCKET: z.ZodAny;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    OPENAI_API_KEY: z.ZodString;
    LIVEKIT_API_KEY: z.ZodString;
    LIVEKIT_API_SECRET: z.ZodString;
    LIVEKIT_URL: z.ZodString;
    CARTESIA_API_KEY: z.ZodString;
    ELEVENLABS_API_KEY: z.ZodOptional<z.ZodString>;
    IOS_VOIP_KEY_ID: z.ZodString;
    IOS_VOIP_TEAM_ID: z.ZodString;
    IOS_VOIP_AUTH_KEY: z.ZodString;
    SUPERMEMORY_API_KEY: z.ZodOptional<z.ZodString>;
    DEEPGRAM_API_KEY: z.ZodOptional<z.ZodString>;
    REVENUECAT_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    REVENUECAT_API_KEY: z.ZodOptional<z.ZodString>;
    REVENUECAT_PROJECT_ID: z.ZodOptional<z.ZodString>;
    DEBUG_ACCESS_TOKEN: z.ZodOptional<z.ZodString>;
    ENVIRONMENT: z.ZodEnum<["development", "staging", "production"]>;
    BACKEND_URL: z.ZodString;
    AUDIO_BUCKET: z.ZodAny;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    OPENAI_API_KEY: z.ZodString;
    LIVEKIT_API_KEY: z.ZodString;
    LIVEKIT_API_SECRET: z.ZodString;
    LIVEKIT_URL: z.ZodString;
    CARTESIA_API_KEY: z.ZodString;
    ELEVENLABS_API_KEY: z.ZodOptional<z.ZodString>;
    IOS_VOIP_KEY_ID: z.ZodString;
    IOS_VOIP_TEAM_ID: z.ZodString;
    IOS_VOIP_AUTH_KEY: z.ZodString;
    SUPERMEMORY_API_KEY: z.ZodOptional<z.ZodString>;
    DEEPGRAM_API_KEY: z.ZodOptional<z.ZodString>;
    REVENUECAT_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    REVENUECAT_API_KEY: z.ZodOptional<z.ZodString>;
    REVENUECAT_PROJECT_ID: z.ZodOptional<z.ZodString>;
    DEBUG_ACCESS_TOKEN: z.ZodOptional<z.ZodString>;
    ENVIRONMENT: z.ZodEnum<["development", "staging", "production"]>;
    BACKEND_URL: z.ZodString;
    AUDIO_BUCKET: z.ZodAny;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Type inference from the environment schema
 */
export type Env = z.infer<typeof EnvSchema>;
/**
 * Validate and parse environment variables
 * This function should be called at application startup
 */
export declare function validateEnv(env: Record<string, unknown>): Env;
/**
 * Environment variable categories for better organization
 */
export declare const EnvCategories: {
    readonly database: {
        readonly SUPABASE_URL: "Supabase project URL";
        readonly SUPABASE_ANON_KEY: "Supabase anonymous key";
        readonly SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key (admin access)";
    };
    readonly ai: {
        readonly OPENAI_API_KEY: "OpenAI API key for embeddings and AI processing";
        readonly ELEVENLABS_API_KEY: "ElevenLabs API key for voice cloning and synthesis (legacy, optional)";
        readonly LIVEKIT_API_KEY: "LiveKit API key for real-time communication";
        readonly LIVEKIT_API_SECRET: "LiveKit API secret for token generation";
        readonly LIVEKIT_URL: "LiveKit Cloud WebSocket URL (wss://...)";
        readonly CARTESIA_API_KEY: "Cartesia API key for STT (Ink) and TTS (Sonic-3)";
        readonly DEEPGRAM_API_KEY: "Deepgram API key for speech recognition (optional, deprecated)";
    };
    readonly memory: {
        readonly SUPERMEMORY_API_KEY: "Supermemory API key for persistent user context (optional)";
    };
    readonly ios: {
        readonly IOS_VOIP_KEY_ID: "iOS VoIP push notification key ID";
        readonly IOS_VOIP_TEAM_ID: "iOS VoIP push notification team ID";
        readonly IOS_VOIP_AUTH_KEY: "iOS VoIP push notification authentication key";
    };
    readonly revenue: {
        readonly REVENUECAT_WEBHOOK_SECRET: "RevenueCat webhook secret for subscription validation";
        readonly REVENUECAT_API_KEY: "RevenueCat API key for subscription validation";
        readonly REVENUECAT_PROJECT_ID: "RevenueCat project ID for v2 API";
    };
    readonly deployment: {
        readonly ENVIRONMENT: "Application environment (development/staging/production)";
        readonly BACKEND_URL: "Public URL of the backend API";
    };
    readonly development: {
        readonly DEBUG_ACCESS_TOKEN: "Debug access token for development endpoints";
    };
    readonly cloudflare: {
        readonly AUDIO_BUCKET: "Cloudflare R2 bucket for audio storage (automatically provided)";
    };
};
/**
 * Get environment variable description
 */
export declare function getEnvDescription(varName: keyof typeof EnvCategories): string;
/**
 * Check if running in development mode
 */
export declare function isDevelopment(env: Env): boolean;
/**
 * Check if running in production mode
 */
export declare function isProduction(env: Env): boolean;
/**
 * Check if running in staging mode
 */
export declare function isStaging(env: Env): boolean;
/**
 * Get environment-specific configuration
 */
export declare function getEnvConfig(env: Env): {
    isDevelopment: boolean;
    isProduction: boolean;
    isStaging: boolean;
    enableDebugEndpoints: boolean;
    enableDetailedLogging: boolean;
    enablePerformanceMonitoring: boolean;
    apiTimeout: number;
    maxRetries: number;
    supabaseUrl: string;
    backendUrl: string;
};
/**
 * Environment variable validation middleware
 */
export declare function createEnvValidator(): {
    validate: typeof validateEnv;
    getDescription: typeof getEnvDescription;
    isDevelopment: typeof isDevelopment;
    isProduction: typeof isProduction;
    isStaging: typeof isStaging;
    getConfig: typeof getEnvConfig;
};
