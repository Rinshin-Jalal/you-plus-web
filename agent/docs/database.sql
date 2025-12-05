-- ============================================================================
-- YOU+ DATABASE SCHEMA (Post-Cleanup v5 - R2 Voice Storage)
-- ============================================================================
-- 
-- This is the CLEAN schema with Supermemory integration.
-- 7 core tables + 1 billing table + Supermemory for dynamic profiles.
--
-- ARCHITECTURE:
-- - identity table: Minimal - only scheduling + voice cloning
-- - Supermemory: All psychological data (goal, fears, patterns, etc.)
-- - Voice recordings: Stored in Cloudflare R2 with predictable paths
--   - Path pattern: audio/{user_id}/{step_name}.m4a
--   - Public URL: https://audio.yourbigbruhh.app/audio/{user_id}/{step_name}.m4a
--   - No URLs stored in database (can be reconstructed on demand)
--
-- WARNING: This schema is for context only and is not meant to be run.
-- ============================================================================

-- ============================================================================
-- 1. USERS - Core user table (auth + billing basics)
-- ============================================================================
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'User'::text,
  timezone text DEFAULT 'UTC'::text,
  subscription_status text DEFAULT 'trialing'::text 
    CHECK (subscription_status = ANY (ARRAY['active', 'trialing', 'cancelled', 'past_due'])),
  payment_provider varchar DEFAULT 'dodopayments' 
    CHECK (payment_provider = ANY (ARRAY['dodopayments', 'revenuecat'])),
  dodo_customer_id varchar,
  phone_number text CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9]\d{1,14}$'),
  onboarding_completed boolean DEFAULT false,
  onboarding_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ============================================================================
-- 2. IDENTITY - Minimal: scheduling, voice, Supermemory link
-- ============================================================================
-- Psychological profile is NOW IN SUPERMEMORY, not in onboarding_context.
-- The agent fetches profile with: await supermemory.get_user_profile(user_id)
-- ============================================================================
CREATE TABLE public.identity (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,  -- TODO: Remove, already in users table
  daily_commitment text NOT NULL,
  call_time time NOT NULL,
  timezone text DEFAULT 'UTC',
  cartesia_voice_id text,
  -- Link to Supermemory container (usually same as user_id)
  supermemory_container_id text,
  -- DEPRECATED: Profile now in Supermemory (migration 006)
  onboarding_context jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identity_pkey PRIMARY KEY (id),
  CONSTRAINT identity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- NOTE: Voice recordings are stored in Cloudflare R2, NOT in this table
-- Path: audio/{user_id}/{step_name}.m4a (why_it_matters, cost_of_quitting, commitment)
-- Public URL: https://audio.yourbigbruhh.app/audio/{user_id}/{step_name}.m4a

-- ============================================================================
-- 3. STATUS - User progress (streak, trust score, promise stats)
--    Renamed from identity_status in migration 004
-- ============================================================================
CREATE TABLE public.status (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  -- Streak tracking
  current_streak_days integer NOT NULL DEFAULT 0,
  longest_streak_days integer DEFAULT 0,
  total_calls_completed integer NOT NULL DEFAULT 0,
  last_call_at timestamptz,
  -- Trust score (0-100) - measures self-trust based on promise-keeping
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  -- Promise tracking for persona selection
  promises_kept_total integer DEFAULT 0,
  promises_broken_total integer DEFAULT 0,
  promises_kept_last_7_days integer DEFAULT 0,
  promises_broken_last_7_days integer DEFAULT 0,
  -- Call pausing
  calls_paused boolean DEFAULT false,
  calls_paused_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_pkey PRIMARY KEY (id),
  CONSTRAINT status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================================================
-- 4. CALL_MEMORY - Narrative memory (quotes, loops, persona, commitment)
-- ============================================================================
CREATE TABLE public.call_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Memorable quotes for callbacks
  -- Format: [{text, context, day, emotional_weight}]
  memorable_quotes jsonb DEFAULT '[]'::jsonb,
  -- Emotional peaks for narrative arc
  -- Format: [{moment, day, intensity}]
  emotional_peaks jsonb DEFAULT '[]'::jsonb,
  -- Open loops (things promised to reveal later)
  -- Format: [{loop_text, resolve_at_day, resolved}]
  open_loops jsonb DEFAULT '[]'::jsonb,
  -- Call type tracking for variety
  last_call_type text,
  call_type_history jsonb DEFAULT '[]'::jsonb,
  -- Narrative arc: early_struggle, proving_ground, building_momentum, transformation, mastery
  narrative_arc text DEFAULT 'early_struggle',
  -- Mood from last call
  last_mood text,
  -- Persona: mentor, champion, drill_sergeant, disappointed, strategist, ally
  current_persona text DEFAULT 'mentor',
  -- Severity level 1-4 (escalates with repeated broken promises)
  severity_level integer DEFAULT 1 CHECK (severity_level >= 1 AND severity_level <= 4),
  -- Tomorrow's commitment (replaces promises table)
  last_commitment text,
  last_commitment_time text,
  last_commitment_specific boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT call_memory_pkey PRIMARY KEY (id),
  CONSTRAINT call_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE INDEX idx_call_memory_user_id ON call_memory(user_id);

-- ============================================================================
-- 5. CALL_ANALYTICS - Per-call data (one row per call)
-- ============================================================================
CREATE TABLE public.call_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Call metadata
  call_type text NOT NULL,
  mood text NOT NULL,
  call_duration_seconds integer DEFAULT 0,
  call_quality_score decimal(3,2) DEFAULT 0.50,
  -- Promise tracking
  promise_kept boolean,
  -- Tomorrow's commitment
  tomorrow_commitment text,
  commitment_time text,
  commitment_is_specific boolean DEFAULT false,
  -- Sentiment trajectory during call
  sentiment_trajectory jsonb DEFAULT '[]'::jsonb,
  -- Excuses detected during call
  excuses_detected jsonb DEFAULT '[]'::jsonb,
  -- Quotes captured
  quotes_captured jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT call_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT call_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_call_analytics_user_id ON call_analytics(user_id);
CREATE INDEX idx_call_analytics_created_at ON call_analytics(created_at DESC);

-- ============================================================================
-- 6. EXCUSE_PATTERNS - Excuse history for callouts
-- ============================================================================
CREATE TABLE public.excuse_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  excuse_text text NOT NULL,
  -- Normalized pattern: too_tired, no_time, busy, forgot, sick, work, tomorrow, stressed, weather, traffic, family, other
  excuse_pattern text NOT NULL,
  matches_favorite boolean DEFAULT false,
  confidence decimal(3,2) DEFAULT 0.80,
  streak_day integer,
  call_type text,
  was_called_out boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT excuse_patterns_pkey PRIMARY KEY (id),
  CONSTRAINT excuse_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_excuse_patterns_user_id ON excuse_patterns(user_id);
CREATE INDEX idx_excuse_patterns_pattern ON excuse_patterns(excuse_pattern);

-- ============================================================================
-- 7. SUBSCRIPTIONS - Billing (not agent related)
-- ============================================================================
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  status varchar NOT NULL DEFAULT 'inactive' 
    CHECK (status = ANY (ARRAY['active', 'inactive', 'cancelled', 'past_due', 'pending'])),
  payment_provider varchar NOT NULL 
    CHECK (payment_provider = ANY (ARRAY['dodopayments', 'revenuecat'])),
  provider_subscription_id varchar,
  provider_customer_id varchar,
  plan_id varchar,
  plan_name varchar,
  amount_cents integer,
  currency varchar DEFAULT 'INR',
  started_at timestamp,
  current_period_start timestamp,
  current_period_end timestamp,
  cancelled_at timestamp,
  metadata jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update trust score
CREATE OR REPLACE FUNCTION update_trust_score(
  p_user_id UUID,
  p_change INTEGER,
  p_reason TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_current_score INTEGER;
  v_new_score INTEGER;
BEGIN
  SELECT trust_score INTO v_current_score
  FROM status WHERE user_id = p_user_id;
  
  v_current_score := COALESCE(v_current_score, 50);
  v_new_score := GREATEST(0, LEAST(100, v_current_score + p_change));
  
  UPDATE status
  SET trust_score = v_new_score, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql;

-- Get excuse callout data
CREATE OR REPLACE FUNCTION get_excuse_callout_data(p_user_id UUID)
RETURNS TABLE (
  excuse_pattern TEXT,
  times_this_week INTEGER,
  times_total INTEGER,
  days_used INTEGER[],
  is_favorite BOOLEAN,
  last_used TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.excuse_pattern,
    COUNT(*) FILTER (WHERE ep.created_at > NOW() - INTERVAL '7 days')::INTEGER,
    COUNT(*)::INTEGER,
    ARRAY_AGG(DISTINCT ep.streak_day ORDER BY ep.streak_day)::INTEGER[],
    BOOL_OR(ep.matches_favorite),
    MAX(ep.created_at)
  FROM excuse_patterns ep
  WHERE ep.user_id = p_user_id
    AND ep.created_at > NOW() - INTERVAL '30 days'
  GROUP BY ep.excuse_pattern
  ORDER BY 2 DESC, 3 DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User promise stats (last 30 days)
CREATE OR REPLACE VIEW user_promise_stats AS
SELECT 
  user_id,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE promise_kept = TRUE) as promises_kept,
  COUNT(*) FILTER (WHERE promise_kept = FALSE) as promises_broken,
  ROUND(
    COUNT(*) FILTER (WHERE promise_kept = TRUE)::decimal / 
    NULLIF(COUNT(*) FILTER (WHERE promise_kept IS NOT NULL), 0) * 100, 
    1
  ) as promise_kept_rate,
  AVG(call_quality_score) as avg_call_quality,
  AVG(call_duration_seconds) as avg_call_duration
FROM call_analytics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_status_updated_at
  BEFORE UPDATE ON status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_call_memory_updated_at
  BEFORE UPDATE ON call_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- WHAT AGENT READS
-- ============================================================================
-- 
-- fetch_user_context():
--   - identity: name, daily_commitment, cartesia_voice_id, onboarding_context
--   - status: current_streak_days, total_calls_completed, calls_paused
--
-- fetch_call_memory():
--   - call_memory: all columns
--
-- fetch_excuse_patterns():
--   - calls get_excuse_callout_data() function
--
-- ============================================================================
-- WHAT AGENT WRITES
-- ============================================================================
--
-- upsert_call_memory():
--   - call_memory: upserts after each call
--
-- save_call_analytics():
--   - call_analytics: inserts one row per call
--
-- save_excuse_pattern():
--   - excuse_patterns: inserts detected excuses
--
-- ============================================================================
