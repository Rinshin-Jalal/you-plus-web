import { Env } from "@/index";
export type VoiceProvider = "elevenlabs" | "cartesia";
interface VoiceCloneRequest {
    audio_url: string;
    voice_name: string;
    user_id: string;
    provider?: VoiceProvider;
}
interface VoiceCloneResponse {
    voice_id: string;
    success: boolean;
    error?: string;
}
export declare class VoiceCloneService {
    private env;
    constructor(env: Env);
    cloneUserVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse>;
    private cloneWithCartesia;
    private cloneWithElevenLabs;
    getVoices(): Promise<any[]>;
    deleteVoice(voiceId: string): Promise<boolean>;
    getVoiceInfo(voiceId: string): Promise<any | null>;
}
/**
 * 🏗️ Voice cloning service factory - creates configured service instance
 */
export declare function createVoiceCloneService(env: Env): VoiceCloneService;
/**
 * 🚀 One-shot voice cloning utility - for simple use cases
 * Perfect for onboarding flows that just need to clone once and get the voice ID
 */
export declare function cloneVoice(request: VoiceCloneRequest, env: Env): Promise<VoiceCloneResponse>;
export {};
