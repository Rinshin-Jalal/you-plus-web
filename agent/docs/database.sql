-- ============================================================================
-- YOU+ DATABASE SCHEMA
-- ============================================================================
-- 
-- 6 core tables + 1 billing table.
-- User psychological profile lives in Supermemory, not in database.
-- Voice recordings stored in Cloudflare R2 (not in database).
--
-- WARNING: This schema is for reference only.
-- ============================================================================

-- ============================================================================
-- 1. USERS - Core user table (auth + billing + scheduling)
-- ============================================================================
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'User',
  timezone text DEFAULT 'UTC',
  call_time time DEFAULT '21:00:00',  -- User's preferred call time
  subscription_status text DEFAULT 'trialing' 
    CHECK (subscription_status IN ('active', 'trialing', 'cancelled', 'past_due')),
  payment_provider varchar DEFAULT 'dodopayments' 
    CHECK (payment_provider IN ('dodopayments', 'revenuecat')),
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
-- 2. IDENTITY - Voice cloning + daily commitment
-- ============================================================================
CREATE TABLE public.identity (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  daily_commitment text NOT NULL,
  cartesia_voice_id text,
  supermemory_container_id text,
  onboarding_context jsonb,  -- Legacy fallback, profile now in Supermemory
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identity_pkey PRIMARY KEY (id),
  CONSTRAINT identity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================================================
-- 3. STATUS - User progress (streak, trust score, promises)
-- ============================================================================
CREATE TABLE public.status (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  current_streak_days integer NOT NULL DEFAULT 0,
  longest_streak_days integer DEFAULT 0,
  total_calls_completed integer NOT NULL DEFAULT 0,
  last_call_at timestamptz,
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  promises_kept_total integer DEFAULT 0,
  promises_broken_total integer DEFAULT 0,
  promises_kept_last_7_days integer DEFAULT 0,
  promises_broken_last_7_days integer DEFAULT 0,
  calls_paused boolean DEFAULT false,
  calls_paused_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_pkey PRIMARY KEY (id),
  CONSTRAINT status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- ============================================================================
-- 4. CALL_MEMORY - Narrative memory (quotes, loops, persona)
-- ============================================================================
CREATE TABLE public.call_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  memorable_quotes jsonb DEFAULT '[]',
  emotional_peaks jsonb DEFAULT '[]',
  open_loops jsonb DEFAULT '[]',
  last_call_type text,
  call_type_history jsonb DEFAULT '[]',
  narrative_arc text DEFAULT 'early_struggle',
  last_mood text,
  current_persona text DEFAULT 'mentor',
  severity_level integer DEFAULT 1 CHECK (severity_level >= 1 AND severity_level <= 4),
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
-- 5. CALL_ANALYTICS - Per-call data
-- ============================================================================
CREATE TABLE public.call_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  call_type text NOT NULL,
  mood text NOT NULL,
  call_duration_seconds integer DEFAULT 0,
  call_quality_score decimal(3,2) DEFAULT 0.50,
  promise_kept boolean,
  tomorrow_commitment text,
  commitment_time text,
  commitment_is_specific boolean DEFAULT false,
  sentiment_trajectory jsonb DEFAULT '[]',
  excuses_detected jsonb DEFAULT '[]',
  quotes_captured jsonb DEFAULT '[]',
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
-- 7. SUBSCRIPTIONS - Billing
-- ============================================================================
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  status varchar NOT NULL DEFAULT 'inactive' 
    CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'pending')),
  payment_provider varchar NOT NULL 
    CHECK (payment_provider IN ('dodopayments', 'revenuecat')),
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
-- FUNCTIONS
-- ============================================================================

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

CREATE TRIGGER trigger_identity_updated_at
  BEFORE UPDATE ON identity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
