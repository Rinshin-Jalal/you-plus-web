import { CallRecording, CallType, Database, PromiseStatus, User, UserContext, UserPromise } from "@/types/database";
import { Env } from "@/index";
/**
 * Utility to check if we're in development mode
 * 🔓 Used for subscription bypass logic
 */
export declare function isDevelopmentMode(): boolean;
/**
 * Service role client for bypassing RLS policies (admin access)
 */
export declare function createSupabaseServiceClient(env: Env): import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
/**
 * Standard client using service role key (same as above for this app)
 */
export declare function createSupabaseClient(env: Env): import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export declare function getActiveUsers(env: Env): Promise<User[]>;
export declare function getUserContext(env: Env, userId: string): Promise<UserContext>;
export declare function createPromise(env: Env, userId: string, promiseText: string, options?: {
    priority?: "low" | "medium" | "high" | "critical";
    category?: string;
    targetTime?: string;
    createdDuringCall?: boolean;
    parentPromiseId?: string;
}): Promise<UserPromise>;
export declare function getTodayPromises(env: Env, userId: string): Promise<UserPromise[]>;
export declare function updatePromiseOrder(env: Env, promiseId: string, newOrder: number): Promise<void>;
export declare function getPromiseSummary(env: Env, userId: string, date?: string): Promise<any>;
export declare function bulkUpdatePromiseStatus(env: Env, updates: Array<{
    promiseId: string;
    status: "pending" | "kept" | "broken";
    excuseText?: string;
}>): Promise<void>;
export declare function updatePromiseStatus(env: Env, promiseId: string, status: PromiseStatus, excuseText?: string): Promise<void>;
export declare function saveCallRecording(env: Env, userId: string, callType: CallType, audioUrl: string, durationSec: number, toneUsed?: "supportive" | "neutral" | "concerned", transcript?: string): Promise<CallRecording>;
export declare function updateUserStreak(env: Env, userId: string, newStreak: number): Promise<void>;
export declare function updateUserVoiceId(env: Env, userId: string, voiceCloneId: string): Promise<void>;
export declare function updateUserTone(env: Env, userId: string, mood: "supportive" | "neutral" | "concerned"): Promise<void>;
export interface PushTokenMetadata {
    token: string;
    type?: "apns" | "fcm" | "voip";
    device_model?: string;
    os_version?: string;
    app_version?: string;
    locale?: string;
    timezone?: string;
}
export declare function upsertPushToken(env: Env, userId: string, metadata: PushTokenMetadata): Promise<void>;
export declare function checkCallExists(env: Env, userId: string, callType: CallType, date: string): Promise<boolean>;
export declare function createPromiseCollection(env: Env, userId: string, collectionName: string, collectionDate: string, theme?: string): Promise<any>;
export declare function saveSubscriptionEvent(env: Env, userId: string | null, eventType: string, productId: string, transactionId: string, purchaseDate: string, webhookData: Record<string, any>, expirationDate?: string, isTrialPeriod?: boolean, revenueUsd?: number): Promise<any>;
