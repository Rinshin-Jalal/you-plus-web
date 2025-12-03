// Simplified tone system (bloat elimination) - Keep 3 core tones for MVP
export type BigBruhhTone =
  | "Confrontational" // Default: Provocative but targeted (primary tone)
  | "ColdMirror" // Alternative: Detached, factual, guilt-inducing
  | "Encouraging"; // Fallback: Warm but identity-reinforcing

// Legacy type alias for backward compatibility
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

  // Call scheduling
  call_window_start?: string; // When calls start (e.g., "20:30")
  call_window_timezone?: string; // Timezone for call window

  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at?: string;

  // Push notifications
  push_token?: string; // VoIP push token

  // Telephony (Cartesia Line)
  phone_number?: string; // E.164 format (e.g., +14155551234) for outbound calls

  // Payment
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
  [key: string]: any; // Allow additional fields as onboarding evolves
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
  // System fields
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // Core fields (used in app logic)
  name: string; // User's name from auth
  daily_commitment: string; // "30 min gym session" or "1 hour coding"
  chosen_path: "hopeful" | "doubtful"; // Path chosen at end of onboarding
  call_time: string; // "20:30:00" - TIME format (HH:MM:SS)
  strike_limit: number; // 1-5, how many strikes before consequences

  // Voice recordings (R2 URLs for AI calls)
  why_it_matters_audio_url?: string | null; // "https://audio.yourbigbruhh.app/..."
  cost_of_quitting_audio_url?: string | null;
  commitment_audio_url?: string | null;

  // Everything else from onboarding (context for AI personalization)
  onboarding_context: OnboardingContext;
}

/**
 * Onboarding Context JSONB Structure
 *
 * Contains all the psychological details gathered during 38-step conversion onboarding.
 * Used by AI to personalize calls but not directly queried by app logic.
 */
export interface OnboardingContext {
  // Identity & Aspiration
  goal: string; // "Get fit and lose 20 pounds by June 2025"
  goal_deadline?: string; // ISO date
  motivation_level: number; // 1-10 (slider)

  // Pattern Recognition
  attempt_count?: number; // How many times tried before
  attempt_history?: string; // "Failed 3 times. Last: gave up after 2 weeks."
  favorite_excuse?: string; // "Too busy with work"
  who_disappointed?: string; // "Myself", "Family", "Partner", etc. (choice)
  biggest_obstacle?: string; // "No time", "Fear of failure", etc. (choice)
  how_did_quit?: string; // "Gradually stopped", "Life got busy", etc. (choice)
  quit_time?: string; // ISO date of last quit
  quit_pattern?: string; // "First week", "After 2-3 weeks", etc. (choice)

  // Demographics (NEW)
  age?: number; // 13-100
  gender?: string; // "Male", "Female", "Non-binary", "Prefer not to say"
  location?: string; // Optional city/country
  acquisition_source?: string; // "App Store", "Friend", "Social Media", etc.

  // The Cost
  success_vision?: string; // What success looks like
  future_if_no_change: string; // "Same place, no progress", etc. (choice)
  what_spent?: string; // Multi-select: "Time (months/years)", "Money ($100+)", etc.
  biggest_fear?: string; // "Failing again", "Succeeding and the pressure", etc. (choice)

  // Demo Call Rating (NEW)
  demo_call_rating?: number; // 1-5 stars
  voice_clone_id?: string; // Store cloned voice ID from step 24

  // Commitment Setup
  witness?: string; // "My spouse"

  // Decision
  will_do_this?: boolean; // true/false

  // Permissions
  permissions: {
    notifications: boolean;
    calls: boolean;
  };

  // Metadata
  completed_at: string; // ISO timestamp
  time_spent_minutes: number; // Total onboarding time

  // Extensible - AI can add more fields for learning
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

  // Basic performance tracking
  current_streak_days: number; // Consecutive days of keeping commitment
  total_calls_completed: number; // Total number of completed calls
  last_call_at?: string | null; // Timestamp of last completed call

  // System fields
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

// NEW: Onboarding table from schema.sql (simple JSONB structure)
// Onboarding table stores all responses in JSONB format
export interface Onboarding {
  id: string;
  user_id?: string;
  responses: Record<string, any>; // All onboarding responses stored here
  created_at: string;
  updated_at: string;
}

// REMOVED: OnboardingResponseV3 table (bloat elimination)
// All onboarding data now stored in main onboarding table's JSONB responses column

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

// Simplified to single call type (bloat elimination)
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

  // NEW: Retry tracking fields
  is_retry?: boolean; // Is this a retry attempt?
  retry_attempt_number?: number; // Which retry attempt (1, 2, 3)
  original_call_uuid?: string; // UUID of the original missed call
  retry_reason?: "missed" | "declined" | "failed";
  urgency?: "high" | "critical" | "emergency";
  acknowledged?: boolean; // Was this call answered?
  acknowledged_at?: string;
  timeout_at?: string; // When to consider it missed
}

// Memory embedding feature removed in bloat elimination
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

// Complete database schema type for type-safe Supabase client
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
