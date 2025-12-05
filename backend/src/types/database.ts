// ============================================================================
// YOU+ DATABASE TYPES - Aligned with migrations 002-005
// ============================================================================

/**
 * BigBruhh Tone System - 3 core tones for MVP
 */
export type BigBruhhTone =
  | "Confrontational" // Default: Provocative but targeted
  | "ColdMirror" // Alternative: Detached, factual, guilt-inducing
  | "Encouraging"; // Fallback: Warm but identity-reinforcing

/**
 * Call Mood - matches call_analytics.mood
 */
export type CallMood =
  | "motivated"
  | "tired"
  | "defensive"
  | "honest"
  | "defeated"
  | "energized";

/**
 * Persona Types - matches call_memory.current_persona
 */
export type PersonaType =
  | "mentor"
  | "champion"
  | "drill_sergeant"
  | "disappointed"
  | "strategist"
  | "ally";

/**
 * Narrative Arc - matches call_memory.narrative_arc
 */
export type NarrativeArc =
  | "early_struggle"
  | "building_momentum"
  | "breakthrough"
  | "maintaining"
  | "recovery";

/**
 * Call Source - where the call originated
 */
export type CallSource = "cartesia" | "elevenlabs";

/**
 * Call Outcome
 */
export type CallOutcome = "success" | "failure" | "unknown";

/**
 * Retry Reason - why we're retrying a call
 */
export type RetryReason = "missed" | "declined" | "failed";

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Users Table
 * 
 * Core user data - auth + billing basics.
 * Simplified from old schema - removed:
 * - revenuecat_customer_id (DodoPayments only)
 * - call_window_start, call_window_timezone (use identity.call_time)
 * - push_token, last_login_at (not used by agent)
 */
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Core identity
  name: string;
  email: string;
  timezone: string;
  
  // Subscription (DodoPayments)
  subscription_status: "active" | "trialing" | "cancelled" | "past_due";
  dodo_customer_id?: string;
  
  // Telephony (Cartesia Line)
  phone_number?: string; // E.164 format
  
  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
}

/**
 * Identity Table
 * 
 * User identity - name, commitment, voice, psychological profile.
 * Simplified - removed:
 * - chosen_path (not used)
 * - strike_limit (not used)
 * - Audio URLs (now stored in R2 with predictable paths)
 * 
 * Voice recordings are stored in Cloudflare R2:
 * - Path pattern: audio/{user_id}/{step_name}.m4a
 * - Example: audio/abc123/commitment.m4a
 * - Public URL: https://audio.yourbigbruhh.app/audio/{user_id}/{step_name}.m4a
 */
export interface Identity {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // Core fields
  name: string;
  daily_commitment: string; // "30 min gym session"
  call_time: string; // "20:30:00" - TIME format

  // Voice (Cartesia)
  cartesia_voice_id?: string;

  // Supermemory container reference
  supermemory_container_id?: string;

  // All onboarding context (JSONB)
  onboarding_context: OnboardingContext;
}

/**
 * Onboarding Context JSONB
 * 
 * Contains psychological details from 38-step conversion onboarding.
 */
export interface OnboardingContext {
  // Identity & Aspiration
  goal: string;
  goal_deadline?: string;
  motivation_level: number; // 1-10

  // Pattern Recognition
  attempt_count?: number;
  attempt_history?: string;
  favorite_excuse?: string;
  who_disappointed?: string;
  biggest_obstacle?: string;
  how_did_quit?: string;
  quit_time?: string;
  quit_pattern?: string;

  // Demographics
  age?: number;
  gender?: string;
  location?: string;
  acquisition_source?: string;

  // The Cost
  success_vision?: string;
  future_if_no_change: string;
  what_spent?: string;
  biggest_fear?: string;

  // Demo Call
  demo_call_rating?: number;

  // Commitment Setup
  witness?: string;
  will_do_this?: boolean;

  // Permissions
  permissions: {
    notifications: boolean;
    calls: boolean;
  };

  // Metadata
  completed_at: string;
  time_spent_minutes: number;

  // Extensible
  [key: string]: any;
}

/**
 * Status Table (renamed from identity_status)
 * 
 * User progress - streak, trust score, promise stats.
 */
export interface Status {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // Streak tracking
  current_streak_days: number;
  longest_streak_days: number;

  // Call tracking
  total_calls_completed: number;
  last_call_at?: string | null;

  // Trust score (0-100)
  trust_score: number;

  // Promise stats (all time)
  promises_kept_total: number;
  promises_broken_total: number;

  // Promise stats (rolling 7 days)
  promises_kept_last_7_days: number;
  promises_broken_last_7_days: number;

  // Call pause feature
  calls_paused: boolean;
  calls_paused_until?: string | null;
}

/**
 * Call Memory Table
 * 
 * Narrative memory - quotes, loops, persona, last commitment.
 */
export interface CallMemory {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // Memorable moments
  memorable_quotes: Array<{
    quote: string;
    context: string;
    date: string;
  }>;
  emotional_peaks: Array<{
    moment: string;
    emotion: string;
    date: string;
  }>;
  open_loops: Array<{
    topic: string;
    mentioned_at: string;
    resolved: boolean;
  }>;

  // Call history
  last_call_type: string;
  call_type_history: string[];

  // Narrative state
  narrative_arc: NarrativeArc;
  last_mood: CallMood | string;

  // Persona state
  current_persona: PersonaType;
  severity_level: number; // 1-4

  // Last commitment (replaces promises table)
  last_commitment?: string;
  last_commitment_time?: string;
  last_commitment_specific: boolean;
}

/**
 * Call Analytics Table
 * 
 * Per-call data - replaces old calls table.
 * Includes promise tracking, sentiment, excuses, and retry tracking.
 */
export interface CallAnalytics {
  id: string;
  user_id: string;
  created_at: string;

  // Call metadata
  call_type: string;
  mood: CallMood | string;
  call_duration_seconds: number;
  call_quality_score: number; // 0.00 - 1.00

  // Promise tracking
  promise_kept?: boolean;

  // Commitment for tomorrow
  tomorrow_commitment?: string;
  commitment_time?: string;
  commitment_is_specific: boolean;

  // Sentiment tracking
  sentiment_trajectory: Array<{
    timestamp: string;
    sentiment: string;
    score: number;
  }>;

  // Excuse tracking
  excuses_detected: Array<{
    excuse: string;
    pattern: string;
    confidence: number;
  }>;

  // Quotes captured
  quotes_captured: Array<{
    quote: string;
    context: string;
  }>;

  // Retry tracking (from migration 005)
  is_retry: boolean;
  retry_attempt_number: number;
  original_call_uuid?: string;
  retry_reason?: RetryReason;

  // Acknowledgment
  acknowledged: boolean;
  acknowledged_at?: string;
  timeout_at?: string;

  // External service tracking
  conversation_id?: string;
  source?: CallSource;

  // Recording and transcript
  audio_url?: string;
  transcript_json?: Record<string, any>;
  transcript_summary?: string;

  // Outcome
  call_successful: CallOutcome;
  start_time?: string;
  end_time?: string;
  cost_cents?: number;
}

/**
 * Excuse Patterns Table
 * 
 * Excuse history for pattern callouts.
 */
export interface ExcusePattern {
  id: string;
  user_id: string;
  created_at: string;

  excuse_text: string;
  excuse_pattern: string; // Category: "too_busy", "not_feeling_it", etc.
  matches_favorite: boolean; // Matches user's stated favorite_excuse
  confidence: number; // 0.00 - 1.00

  streak_day?: number;
  call_type?: string;
  was_called_out: boolean;
}

/**
 * Subscriptions Table
 * 
 * Billing - subscription status and DodoPayments info.
 */
export interface Subscription {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // DodoPayments
  provider: "dodopayments";
  provider_subscription_id: string;
  provider_customer_id?: string;

  // Status
  status: "active" | "cancelled" | "past_due" | "trialing" | "paused";
  
  // Plan
  plan_id?: string;
  plan_name?: string;
  amount_cents?: number;
  currency: string;

  // Period
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  cancel_at_period_end: boolean;

  // Trial
  trial_start?: string;
  trial_end?: string;
}

/**
 * Onboarding Table
 * 
 * Simple JSONB storage for onboarding responses.
 */
export interface Onboarding {
  id: string;
  user_id?: string;
  responses: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// USER CONTEXT (for API responses)
// ============================================================================

/**
 * User Context - aggregated data for AI calls
 * 
 * Simplified from old version:
 * - Removed todayPromises, yesterdayPromises, recentStreakPattern (promises table gone)
 * - Added callMemory, recentCallAnalytics
 */
export interface UserContext {
  user: User;
  identity: Identity | null;
  status: Status | null;
  callMemory: CallMemory | null;
  
  // Recent call data (last 7 days)
  recentCallAnalytics: CallAnalytics[];
  
  // Computed stats
  stats: {
    totalCalls: number;
    currentStreak: number;
    longestStreak: number;
    trustScore: number;
    promisesKeptTotal: number;
    promisesBrokenTotal: number;
    promisesKeptLast7Days: number;
    promisesBrokenLast7Days: number;
    successRate: number;
  };
}

// ============================================================================
// DATABASE SCHEMA TYPE
// ============================================================================

/**
 * Complete database schema type for type-safe Supabase client
 */
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
      status: {
        Row: Status;
        Insert: Omit<Status, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Status, "id" | "created_at">>;
      };
      call_memory: {
        Row: CallMemory;
        Insert: Omit<CallMemory, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CallMemory, "id" | "created_at">>;
      };
      call_analytics: {
        Row: CallAnalytics;
        Insert: Omit<CallAnalytics, "id" | "created_at">;
        Update: Partial<Omit<CallAnalytics, "id" | "created_at">>;
      };
      excuse_patterns: {
        Row: ExcusePattern;
        Insert: Omit<ExcusePattern, "id" | "created_at">;
        Update: Partial<Omit<ExcusePattern, "id" | "created_at">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
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
      update_trust_score: {
        Args: { p_user_id: string; p_change: number; p_reason: string };
        Returns: number;
      };
      get_excuse_callout_data: {
        Args: { p_user_id: string };
        Returns: Array<{
          excuse_pattern: string;
          times_this_week: number;
          times_total: number;
          days_used: number[];
          is_favorite: boolean;
          last_used: string;
        }>;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
