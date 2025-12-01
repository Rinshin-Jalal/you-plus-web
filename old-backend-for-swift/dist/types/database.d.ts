export type BigBruhhTone = "Confrontational" | "ColdMirror" | "Encouraging";
export type TransmissionMood = BigBruhhTone;
/**
 * SUPER MVP: Simplified Users Table
 *
 * Cleaned up user table - removed bloat fields:
 * - Dropped: voice_clone_id (no voice cloning in MVP)
 * - Dropped: schedule_change_count (no change limits in MVP)
 * - Dropped: voice_reclone_count (no voice cloning in MVP)
 */
export interface User {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string;
    subscription_status: "active" | "trialing" | "cancelled" | "past_due";
    timezone: string;
    call_window_start?: string;
    call_window_timezone?: string;
    onboarding_completed: boolean;
    onboarding_completed_at?: string;
    push_token?: string;
    revenuecat_customer_id?: string;
}
export interface OnboardingData {
    responses: Record<string, any>;
    commitments: Record<string, any>;
    hunger_voice?: string;
    identity_gap?: string;
    defense_system?: string;
    voice_recordings: string[];
    activation_moment?: string;
    blueprint_response?: string;
    enemy_identification?: string;
    [key: string]: any;
}
/**
 * SUPER MVP: Simplified Identity Table
 *
 * Core design: All onboarding data stored in a single simplified identity table
 * - Core fields (used in app logic) → explicit columns
 * - Context fields (used for AI personalization) → single JSONB column
 * - Voice recordings → R2 cloud URLs
 *
 * Schema: 12 columns total
 * - 5 core fields: name, daily_commitment, chosen_path, call_time, strike_limit
 * - 3 voice URLs: why_it_matters, cost_of_quitting, commitment
 * - 1 JSONB: onboarding_context (goal, motivation, attempt_history, etc.)
 * - 3 system: id, user_id, created_at, updated_at
 */
export interface Identity {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    name: string;
    daily_commitment: string;
    chosen_path: "hopeful" | "doubtful";
    call_time: string;
    strike_limit: number;
    why_it_matters_audio_url?: string | null;
    cost_of_quitting_audio_url?: string | null;
    commitment_audio_url?: string | null;
    onboarding_context: OnboardingContext;
}
/**
 * Onboarding Context JSONB Structure
 *
 * Contains all the psychological details gathered during 38-step conversion onboarding.
 * Used by AI to personalize calls but not directly queried by app logic.
 */
export interface OnboardingContext {
    goal: string;
    goal_deadline?: string;
    motivation_level: number;
    attempt_count?: number;
    attempt_history?: string;
    favorite_excuse?: string;
    who_disappointed?: string;
    biggest_obstacle?: string;
    how_did_quit?: string;
    quit_time?: string;
    quit_pattern?: string;
    age?: number;
    gender?: string;
    location?: string;
    acquisition_source?: string;
    success_vision?: string;
    future_if_no_change: string;
    what_spent?: string;
    biggest_fear?: string;
    demo_call_rating?: number;
    voice_clone_id?: string;
    witness?: string;
    will_do_this?: boolean;
    permissions: {
        notifications: boolean;
        calls: boolean;
    };
    completed_at: string;
    time_spent_minutes: number;
    [key: string]: any;
}
/**
 * SUPER MVP: Simplified Identity Status Table
 *
 * Basic performance tracking only:
 * - Streak tracking (consecutive days of keeping commitments)
 * - Total calls completed
 * - Last call timestamp
 *
 * Schema: 7 columns total
 */
export interface IdentityStatus {
    id: string;
    user_id: string;
    current_streak_days: number;
    total_calls_completed: number;
    last_call_at?: string | null;
    created_at: string;
    updated_at: string;
}
export interface IdentityStatusSummary {
    disciplineLevel: "CRISIS" | "GROWTH" | "STUCK" | "STABLE" | "UNKNOWN";
    disciplineMessage: string;
    notificationTitle: string;
    notificationMessage: string;
    generatedAt: string;
}
export interface Onboarding {
    id: string;
    user_id?: string;
    responses: Record<string, any>;
    created_at: string;
    updated_at: string;
}
export type PromiseStatus = "pending" | "kept" | "broken";
export type PromisePriority = "low" | "medium" | "high" | "critical";
export interface UserPromise {
    id: string;
    user_id: string;
    created_at: string;
    promise_date: string;
    promise_text: string;
    status: PromiseStatus;
    excuse_text?: string;
    promise_order: number;
    priority_level: PromisePriority;
    category: string;
    time_specific: boolean;
    target_time?: string;
    created_during_call: boolean;
    parent_promise_id?: string;
}
export type CallType = "daily_reckoning";
export interface CallRecording {
    id: string;
    user_id: string;
    created_at: string;
    call_type: CallType;
    audio_url: string;
    duration_sec: number;
    confidence_scores?: Record<string, any>;
    conversation_id?: string;
    status?: string;
    transcript_json?: Record<string, any>;
    transcript_summary?: string;
    cost_cents?: number;
    start_time?: string;
    end_time?: string;
    call_successful?: "success" | "failure" | "unknown";
    source?: "vapi" | "elevenlabs";
    is_retry?: boolean;
    retry_attempt_number?: number;
    original_call_uuid?: string;
    retry_reason?: "missed" | "declined" | "failed";
    urgency?: "high" | "critical" | "emergency";
    acknowledged?: boolean;
    acknowledged_at?: string;
    timeout_at?: string;
}
/** @deprecated Removed in Super MVP - memory embeddings dropped (bloat elimination) */
export interface MemoryInsights {
    countsByType: Record<string, number>;
    topExcuseCount7d: number;
    emergingPatterns: Array<{
        sampleText: string;
        recentCount: number;
        baselineCount: number;
        growthFactor: number;
    }>;
}
export interface UserContext {
    user: User;
    todayPromises: UserPromise[];
    yesterdayPromises: UserPromise[];
    recentStreakPattern: UserPromise[];
    memoryInsights: MemoryInsights;
    identity: Identity | null;
    identityStatus: IdentityStatus | null;
    stats: {
        totalPromises: number;
        keptPromises: number;
        brokenPromises: number;
        successRate: number;
        currentStreak: number;
    };
}
export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: Omit<User, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<User, "id" | "created_at">>;
            };
            identity: {
                Row: Identity;
                Insert: Omit<Identity, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<Identity, "id" | "created_at">>;
            };
            identity_status: {
                Row: IdentityStatus;
                Insert: Omit<IdentityStatus, "id" | "last_updated">;
                Update: Partial<Omit<IdentityStatus, "id">>;
            };
            promises: {
                Row: UserPromise;
                Insert: Omit<UserPromise, "id" | "created_at">;
                Update: Partial<Omit<UserPromise, "id" | "created_at">>;
            };
            calls: {
                Row: CallRecording;
                Insert: Omit<CallRecording, "id" | "created_at">;
                Update: Partial<Omit<CallRecording, "id" | "created_at">>;
            };
            onboarding: {
                Row: Onboarding;
                Insert: Omit<Onboarding, "id" | "created_at" | "updated_at">;
                Update: Partial<Omit<Onboarding, "id" | "created_at">>;
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
