import { Context } from "hono";
import { VoiceProvider } from "@/features/voice/services/voice-cloning";
export declare const postVoiceClone: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
}, 500, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    voice_id: string;
    provider: VoiceProvider;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
export declare const postOnboardingAnalyzeVoice: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<{
    transcript: string;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    error: string;
    details: string;
}, 500, "json">)>;
