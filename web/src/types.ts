// ============================================================================
// YOU+ WEB TYPES - Aligned with migrations 002-005 + 009 (5 Pillars)
// ============================================================================

// Design System Types
export type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'outline' | 'ghost';
export type Size = 'sm' | 'md' | 'lg';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// ============================================================================
// DYNAMIC PILLARS SYSTEM (Migration 010)
// ============================================================================
// Pillars are now user-selected from presets (see pillarPresets.ts)
// IDs can be preset IDs (health, career, etc.) or custom_* for user-created

export type PillarType = string; // Now dynamic - any pillar ID

/**
 * Future Self Table - Core identity and patterns
 */
export interface FutureSelf {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  
  // Core identity
  core_identity: string;
  primary_pillar: PillarType;
  
  // The Why (integration layer)
  the_why: string;
  dark_future?: string;
  
  // Patterns (AI learns from these)
  quit_pattern?: string;
  favorite_excuse?: string;
  who_disappointed?: string[];
  fears?: string[];
  
  // Voice recordings (R2 URLs)
  future_self_intro_url?: string;
  why_recording_url?: string;
  pledge_recording_url?: string;
  
  // Voice cloning
  cartesia_voice_id?: string;
  
  // Overall trust (aggregate)
  overall_trust_score: number;
  
  // Supermemory
  supermemory_container_id?: string;
}

/**
 * Future Self Pillars Table - Per-pillar transformation states
 */
export interface FutureSelfPillar {
  id: string;
  user_id: string;
  future_self_id: string;
  created_at: string;
  updated_at: string;
  
  // Pillar type
  pillar: PillarType;
  
  // The transformation
  current_state: string;
  future_state: string;
  identity_statement: string;
  
  // Daily behavior
  non_negotiable: string;
  
  // Tracking
  trust_score: number;
  priority: number;
  last_checked_at?: string;
  consecutive_kept: number;
  consecutive_broken: number;
  total_kept: number;
  total_checked: number;
  
  // Status
  status: 'active' | 'paused' | 'achieved';
}

/**
 * Pillar Checkin Table - Daily check-ins per pillar
 */
export interface PillarCheckin {
  id: string;
  pillar_id: string;
  user_id: string;
  call_id?: string;
  
  // Result
  showed_up: boolean;
  
  // Context
  what_happened?: string;
  excuse_used?: string;
  matched_pattern: boolean;
  
  // Identity tracking
  identity_vote?: 'positive' | 'negative' | 'neutral';
  reinforcement_given?: string;
  
  // Difficulty
  difficulty_level?: 'easy' | 'medium' | 'hard';
  
  checked_at: string;
  checked_for_date: string;
}

/**
 * Pillar with trend information for dashboard
 */
export interface PillarWithTrend extends FutureSelfPillar {
  trend: 'up' | 'down' | 'stable';
  kept_last_7_days: number;
  total_last_7_days: number;
}

/**
 * Identity alignment for dashboard
 */
export interface IdentityAlignment {
  overall_alignment: number;
  pillar_alignments: Array<{
    pillar: PillarType;
    identity: string;
    alignment: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  transformation_status: 'becoming' | 'progressing' | 'struggling' | 'slipping';
}

// ============================================================================
// DATABASE TYPES (matching backend)
// ============================================================================

/**
 * Users Table
 */
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Core
  name: string;
  email: string;
  timezone: string;
  
  // Subscription (DodoPayments)
  subscription_status: 'active' | 'trialing' | 'cancelled' | 'past_due';
  dodo_customer_id?: string;
  
  // Telephony (Cartesia Line)
  phone_number?: string;
  
  // Onboarding
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
}

/**
 * Onboarding Context JSONB
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
  
  success_vision?: string;
  future_if_no_change: string;
  what_spent?: string;
  biggest_fear?: string;
  
  witness?: string;
  will_do_this?: boolean;
  
  permissions: {
    notifications: boolean;
    calls: boolean;
    voice?: boolean;
  };
  
  completed_at: string;
  time_spent_minutes: number;
  
  [key: string]: unknown;
}

/**
 * Status Table
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
  call_time?: string; // Preferred call time (HH:MM:SS)

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
 */
export interface CallMemory {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

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

  last_call_type: string;
  call_type_history: string[];
  narrative_arc: string;
  last_mood: string;

  current_persona: string;
  severity_level: number;

  last_commitment?: string;
  last_commitment_time?: string;
  last_commitment_specific: boolean;
}

/**
 * Call Analytics Table
 */
export interface CallAnalytics {
  id: string;
  user_id: string;
  created_at: string;

  call_type: string;
  mood: string;
  call_duration_seconds: number;
  call_quality_score: number;

  promise_kept?: boolean;
  tomorrow_commitment?: string;
  commitment_time?: string;
  commitment_is_specific: boolean;

  sentiment_trajectory: Array<{
    timestamp: string;
    sentiment: string;
    score: number;
  }>;

  excuses_detected: Array<{
    excuse: string;
    pattern: string;
    confidence: number;
  }>;

  quotes_captured: Array<{
    quote: string;
    context: string;
  }>;

  is_retry: boolean;
  retry_attempt_number: number;
  original_call_uuid?: string;
  retry_reason?: string;

  acknowledged: boolean;
  acknowledged_at?: string;
  timeout_at?: string;

  conversation_id?: string;
  source?: string;

  audio_url?: string;
  transcript_json?: Record<string, unknown>;
  transcript_summary?: string;

  call_successful: string;
  start_time?: string;
  end_time?: string;
  cost_cents?: number;
}

/**
 * Subscriptions Table
 */
export interface Subscription {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  provider: 'dodopayments';
  provider_subscription_id: string;
  provider_customer_id?: string;

  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';
  
  plan_id?: string;
  plan_name?: string;
  amount_cents?: number;
  currency: string;

  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  cancel_at_period_end: boolean;

  trial_start?: string;
  trial_end?: string;
}


// ============================================================================
// DASHBOARD / UI TYPES
// ============================================================================

export interface DashboardStats {
  currentStreak: number;
  longestStreak: number;
  trustScore: number;
  promisesKeptTotal: number;
  promisesBrokenTotal: number;
  promisesKeptLast7Days: number;
  promisesBrokenLast7Days: number;
  totalCalls: number;
  successRate: number;
  // 5 Pillars additions
  identityAlignment?: number;
  transformationStatus?: 'becoming' | 'progressing' | 'struggling' | 'slipping';
}

export interface DashboardData {
  user: User | null;
  status: Status | null;
  callMemory: CallMemory | null;
  recentCalls: CallAnalytics[];
  subscription: Subscription | null;
  stats: DashboardStats;
  nextCallTime: Date | null;
  // 5 Pillars
  futureSelf: FutureSelf | null;
  pillars: FutureSelfPillar[];
  pillarAlignment: IdentityAlignment | null;
}
