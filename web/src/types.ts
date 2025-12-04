// ============================================================================
// YOU+ WEB TYPES - Aligned with migrations 002-005
// ============================================================================

// Design System Types
export type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
export type Size = 'sm' | 'md' | 'lg';

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
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
  
  // Core identity
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
 * Identity Table
 */
export interface Identity {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;

  // Core fields
  name: string;
  daily_commitment: string;
  call_time: string;

  // Voice (Cartesia)
  cartesia_voice_id?: string;

  // Voice recordings (R2 URLs)
  why_it_matters_audio_url?: string | null;
  cost_of_quitting_audio_url?: string | null;
  commitment_audio_url?: string | null;

  // All onboarding context (JSONB)
  onboarding_context: OnboardingContext;
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
 * Status Table (renamed from identity_status)
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
  narrative_arc: NarrativeArc;
  last_mood: CallMood | string;

  current_persona: PersonaType;
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
  mood: CallMood | string;
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
  retry_reason?: RetryReason;

  acknowledged: boolean;
  acknowledged_at?: string;
  timeout_at?: string;

  conversation_id?: string;
  source?: CallSource;

  audio_url?: string;
  transcript_json?: Record<string, unknown>;
  transcript_summary?: string;

  call_successful: CallOutcome;
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
// ENUMS
// ============================================================================

export type CallMood =
  | 'motivated'
  | 'tired'
  | 'defensive'
  | 'honest'
  | 'defeated'
  | 'energized';

export type PersonaType =
  | 'mentor'
  | 'champion'
  | 'drill_sergeant'
  | 'disappointed'
  | 'strategist'
  | 'ally';

export type NarrativeArc =
  | 'early_struggle'
  | 'building_momentum'
  | 'breakthrough'
  | 'maintaining'
  | 'recovery';

export type CallSource = 'cartesia' | 'elevenlabs';

export type CallOutcome = 'success' | 'failure' | 'unknown';

export type RetryReason = 'missed' | 'declined' | 'failed';

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
}

export interface DashboardData {
  user: User | null;
  identity: Identity | null;
  status: Status | null;
  callMemory: CallMemory | null;
  recentCalls: CallAnalytics[];
  subscription: Subscription | null;
  stats: DashboardStats;
  nextCallTime: Date | null;
}
