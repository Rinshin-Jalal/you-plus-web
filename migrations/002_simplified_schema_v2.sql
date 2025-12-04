-- ============================================================================
-- YOU+ SIMPLIFIED DATABASE SCHEMA v2
-- ============================================================================
-- This migration simplifies the database for the Future-You AI agent.
-- It's designed to work with the CURRENT production state.
--
-- RUN EACH SECTION SEPARATELY IF NEEDED!
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE NEW TABLES THAT DON'T EXIST YET
-- ============================================================================

-- Call Analytics (if not exists)
CREATE TABLE IF NOT EXISTS call_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Call metadata
    call_type TEXT NOT NULL,
    mood TEXT NOT NULL,
    call_duration_seconds INTEGER DEFAULT 0,
    call_quality_score DECIMAL(3,2) DEFAULT 0.50,
    
    -- Promise tracking
    promise_kept BOOLEAN,
    
    -- Commitment tracking
    tomorrow_commitment TEXT,
    commitment_time TEXT,
    commitment_is_specific BOOLEAN DEFAULT FALSE,
    
    -- Sentiment tracking
    sentiment_trajectory JSONB DEFAULT '[]'::jsonb,
    
    -- Excuse tracking
    excuses_detected JSONB DEFAULT '[]'::jsonb,
    
    -- Engagement
    quotes_captured JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for call_analytics
CREATE INDEX IF NOT EXISTS idx_call_analytics_user_id ON call_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_created_at ON call_analytics(created_at DESC);

-- Excuse Patterns (if not exists)
CREATE TABLE IF NOT EXISTS excuse_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    excuse_text TEXT NOT NULL,
    excuse_pattern TEXT NOT NULL,
    matches_favorite BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(3,2) DEFAULT 0.80,
    
    streak_day INTEGER,
    call_type TEXT,
    was_called_out BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for excuse_patterns
CREATE INDEX IF NOT EXISTS idx_excuse_patterns_user_id ON excuse_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_excuse_patterns_pattern ON excuse_patterns(excuse_pattern);

-- Call Memory (if not exists)
CREATE TABLE IF NOT EXISTS call_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    memorable_quotes JSONB DEFAULT '[]'::jsonb,
    emotional_peaks JSONB DEFAULT '[]'::jsonb,
    open_loops JSONB DEFAULT '[]'::jsonb,
    
    last_call_type TEXT,
    call_type_history JSONB DEFAULT '[]'::jsonb,
    
    narrative_arc TEXT DEFAULT 'early_struggle',
    reveals_unlocked TEXT[] DEFAULT '{}'::text[],
    active_challenge JSONB,
    
    last_mood TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_memory_user_id ON call_memory(user_id);

-- ============================================================================
-- PART 2: ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add Trust Score to identity_status
ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS trust_score_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS promises_kept_total INTEGER DEFAULT 0;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS promises_broken_total INTEGER DEFAULT 0;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS promises_kept_last_7_days INTEGER DEFAULT 0;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS promises_broken_last_7_days INTEGER DEFAULT 0;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS calls_paused BOOLEAN DEFAULT FALSE;

ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS calls_paused_until TIMESTAMPTZ;

-- Add check constraint for trust_score (if not exists, this may fail if already exists)
DO $$ 
BEGIN
    ALTER TABLE identity_status ADD CONSTRAINT trust_score_range CHECK (trust_score >= 0 AND trust_score <= 100);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add Persona columns to call_memory
ALTER TABLE call_memory 
ADD COLUMN IF NOT EXISTS current_persona TEXT DEFAULT 'mentor';

ALTER TABLE call_memory 
ADD COLUMN IF NOT EXISTS persona_blend JSONB DEFAULT '{"mentor": 1.0}'::jsonb;

ALTER TABLE call_memory 
ADD COLUMN IF NOT EXISTS severity_level INTEGER DEFAULT 1;

ALTER TABLE call_memory 
ADD COLUMN IF NOT EXISTS last_persona_shift_reason TEXT;

-- Add check constraint for severity_level
DO $$ 
BEGIN
    ALTER TABLE call_memory ADD CONSTRAINT severity_level_range CHECK (severity_level >= 1 AND severity_level <= 4);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update trust score with history tracking
CREATE OR REPLACE FUNCTION update_trust_score(
    p_user_id UUID,
    p_change INTEGER,
    p_reason TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_current_score INTEGER;
    v_new_score INTEGER;
    v_history JSONB;
BEGIN
    -- Get current score and history
    SELECT trust_score, trust_score_history 
    INTO v_current_score, v_history
    FROM identity_status 
    WHERE user_id = p_user_id;
    
    -- Default values if null
    v_current_score := COALESCE(v_current_score, 50);
    v_history := COALESCE(v_history, '[]'::jsonb);
    
    -- Calculate new score (clamped 0-100)
    v_new_score := GREATEST(0, LEAST(100, v_current_score + p_change));
    
    -- Add to history (keep last 30)
    v_history := (
        SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
        FROM (
            SELECT item
            FROM jsonb_array_elements(
                v_history || jsonb_build_object(
                    'change', p_change,
                    'reason', p_reason,
                    'score_after', v_new_score,
                    'timestamp', NOW()
                )
            ) AS item
            ORDER BY (item->>'timestamp')::timestamptz DESC
            LIMIT 30
        ) sub
    );
    
    -- Update
    UPDATE identity_status
    SET 
        trust_score = v_new_score,
        trust_score_history = v_history,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_new_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get excuse callout data
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
        COUNT(*) FILTER (WHERE ep.created_at > NOW() - INTERVAL '7 days')::INTEGER as times_this_week,
        COUNT(*)::INTEGER as times_total,
        ARRAY_AGG(DISTINCT ep.streak_day ORDER BY ep.streak_day)::INTEGER[] as days_used,
        BOOL_OR(ep.matches_favorite) as is_favorite,
        MAX(ep.created_at) as last_used
    FROM excuse_patterns ep
    WHERE ep.user_id = p_user_id
      AND ep.created_at > NOW() - INTERVAL '30 days'
    GROUP BY ep.excuse_pattern
    ORDER BY times_this_week DESC, times_total DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended persona
CREATE OR REPLACE FUNCTION get_recommended_persona(
    p_user_id UUID,
    p_kept_promise_today BOOLEAN DEFAULT NULL,
    p_excuse_detected BOOLEAN DEFAULT FALSE,
    p_in_quit_zone BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    persona TEXT,
    confidence DECIMAL,
    reason TEXT
) AS $$
DECLARE
    v_trust INTEGER;
    v_severity INTEGER;
    v_promises_broken_week INTEGER;
BEGIN
    -- Get user's current state
    SELECT trust_score, promises_broken_last_7_days
    INTO v_trust, v_promises_broken_week
    FROM identity_status
    WHERE user_id = p_user_id;
    
    SELECT severity_level INTO v_severity
    FROM call_memory
    WHERE user_id = p_user_id;
    
    v_trust := COALESCE(v_trust, 50);
    v_severity := COALESCE(v_severity, 1);
    v_promises_broken_week := COALESCE(v_promises_broken_week, 0);
    
    -- DRILL SERGEANT: Excuse detected or pattern of avoidance
    IF p_excuse_detected AND v_promises_broken_week >= 2 THEN
        RETURN QUERY SELECT 'drill_sergeant'::TEXT, 0.9::DECIMAL, 'Excuse detected with pattern of broken promises'::TEXT;
        RETURN;
    END IF;
    
    -- DISAPPOINTED: Broken promise + low trust
    IF p_kept_promise_today = FALSE AND v_trust < 40 THEN
        RETURN QUERY SELECT 'disappointed'::TEXT, 0.85::DECIMAL, 'Broken promise with low trust score'::TEXT;
        RETURN;
    END IF;
    
    -- DARK PROPHETIC: In quit zone + broken promise + high severity
    IF p_in_quit_zone AND p_kept_promise_today = FALSE AND v_severity >= 3 THEN
        RETURN QUERY SELECT 'dark_prophetic'::TEXT, 0.8::DECIMAL, 'In quit zone with broken promise and high severity'::TEXT;
        RETURN;
    END IF;
    
    -- CHAMPION: Kept promise + high trust
    IF p_kept_promise_today = TRUE AND v_trust > 60 THEN
        RETURN QUERY SELECT 'champion'::TEXT, 0.9::DECIMAL, 'Kept promise with high trust'::TEXT;
        RETURN;
    END IF;
    
    -- CHAMPION: Kept promise (lower confidence if trust is medium)
    IF p_kept_promise_today = TRUE THEN
        RETURN QUERY SELECT 'champion'::TEXT, 0.7::DECIMAL, 'Kept promise'::TEXT;
        RETURN;
    END IF;
    
    -- MENTOR: Default for medium trust or unknown state
    IF v_trust BETWEEN 30 AND 70 THEN
        RETURN QUERY SELECT 'mentor'::TEXT, 0.7::DECIMAL, 'Default for medium trust'::TEXT;
        RETURN;
    END IF;
    
    -- STRATEGIST: Low trust but no excuse (they might need help)
    IF v_trust < 30 AND NOT p_excuse_detected THEN
        RETURN QUERY SELECT 'strategist'::TEXT, 0.6::DECIMAL, 'Low trust without excuses - may need help'::TEXT;
        RETURN;
    END IF;
    
    -- Default to mentor
    RETURN QUERY SELECT 'mentor'::TEXT, 0.5::DECIMAL, 'Default fallback'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: CREATE VIEWS FOR ANALYTICS
-- ============================================================================

-- User's promise keeping rate (last 30 days)
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
-- PART 5: UPDATE TRIGGERS
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to identity_status if not exists
DROP TRIGGER IF EXISTS trigger_identity_status_updated_at ON identity_status;
CREATE TRIGGER trigger_identity_status_updated_at
    BEFORE UPDATE ON identity_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply to call_memory if not exists
DROP TRIGGER IF EXISTS trigger_call_memory_updated_at ON call_memory;
CREATE TRIGGER trigger_call_memory_updated_at
    BEFORE UPDATE ON call_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 6: COMMENTS
-- ============================================================================

COMMENT ON TABLE call_analytics IS 'Per-call analytics and promise tracking';
COMMENT ON TABLE excuse_patterns IS 'Excuse pattern history for callouts';
COMMENT ON TABLE call_memory IS 'Narrative memory - quotes, loops, persona state';

COMMENT ON COLUMN identity_status.trust_score IS 'Self-trust score 0-100. Changes: +5 kept, -5 broke, +3 difficulty, -3 fav_excuse, +2 honest, -2 deflect, +1 specific, -1 vague';
COMMENT ON COLUMN call_memory.current_persona IS 'Current persona: mentor, champion, drill_sergeant, disappointed, strategist, ally';
COMMENT ON COLUMN call_memory.severity_level IS 'Escalation level 1-4: 1=Normal, 2=Concerned, 3=Serious, 4=Critical';

COMMENT ON FUNCTION update_trust_score IS 'Update trust score with history. Returns new score.';
COMMENT ON FUNCTION get_excuse_callout_data IS 'Get excuse patterns for agent callouts';
COMMENT ON FUNCTION get_recommended_persona IS 'Get AI persona recommendation based on context';

-- ============================================================================
-- DONE!
-- ============================================================================
-- 
-- This migration:
-- 1. Creates call_analytics, excuse_patterns, call_memory if they don't exist
-- 2. Adds trust_score and related columns to identity_status
-- 3. Adds persona tracking columns to call_memory
-- 4. Creates helper functions for trust score and persona selection
-- 5. Creates analytics views
--
-- It does NOT delete any tables - that's a separate manual step if you want.
-- ============================================================================
