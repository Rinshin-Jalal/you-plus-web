export type { Env } from "@/types/environment";
declare function handleScheduledEvent(env: Record<string, unknown>): Promise<void>;
declare const _default: {
    fetch: (request: Request, Env?: {} | import("zod").objectOutputType<{
        SUPABASE_URL: import("zod").ZodString;
        SUPABASE_ANON_KEY: import("zod").ZodString;
        SUPABASE_SERVICE_ROLE_KEY: import("zod").ZodString;
        OPENAI_API_KEY: import("zod").ZodString;
        LIVEKIT_API_KEY: import("zod").ZodString;
        LIVEKIT_API_SECRET: import("zod").ZodString;
        LIVEKIT_URL: import("zod").ZodString;
        CARTESIA_API_KEY: import("zod").ZodString;
        ELEVENLABS_API_KEY: import("zod").ZodOptional<import("zod").ZodString>;
        IOS_VOIP_KEY_ID: import("zod").ZodString;
        IOS_VOIP_TEAM_ID: import("zod").ZodString;
        IOS_VOIP_AUTH_KEY: import("zod").ZodString;
        SUPERMEMORY_API_KEY: import("zod").ZodOptional<import("zod").ZodString>;
        DEEPGRAM_API_KEY: import("zod").ZodOptional<import("zod").ZodString>;
        REVENUECAT_WEBHOOK_SECRET: import("zod").ZodOptional<import("zod").ZodString>;
        REVENUECAT_API_KEY: import("zod").ZodOptional<import("zod").ZodString>;
        REVENUECAT_PROJECT_ID: import("zod").ZodOptional<import("zod").ZodString>;
        DEBUG_ACCESS_TOKEN: import("zod").ZodOptional<import("zod").ZodString>;
        ENVIRONMENT: import("zod").ZodEnum<["development", "staging", "production"]>;
        BACKEND_URL: import("zod").ZodString;
        AUDIO_BUCKET: import("zod").ZodAny;
    }, import("zod").ZodTypeAny, "passthrough"> | undefined, executionCtx?: import("hono").ExecutionContext) => Response | Promise<Response>;
    scheduled: typeof handleScheduledEvent;
};
export default _default;
