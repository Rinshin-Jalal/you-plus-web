-- ============================================================================
-- Migration 009: Future Self Transformation System
-- ============================================================================
-- 
-- Implements the unified Future-Self identity system with 5 pillars:
--   - Body (health, energy, physical)
--   - Mission (work, craft, building)
--   - Stack (money, resources, freedom)
--   - Tribe (relationships, family, community)
--   - Why (purpose, meaning - integration layer, no daily action)
--
-- This migration creates:
--   1. future_self - Core identity and patterns
--   2. future_self_pillars - Per-pillar transformation states
--   3. pillar_checkins - Daily check-ins per pillar
--
-- ============================================================================

-- ============================================================================
-- 1. FUTURE_SELF - Core identity, patterns, and voice recordings
-- ============================================================================
CREATE TABLE IF NOT EXISTS future_self (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Core identity
  core_identity text NOT NULL,                      -- "I am becoming a disciplined builder who..."
  primary_pillar text NOT NULL CHECK (primary_pillar IN ('body', 'mission', 'stack', 'tribe')),
  
  -- The Why (integration layer - not a daily action)
  the_why text NOT NULL,                            -- Deep purpose connecting all pillars
  dark_future text,                                 -- What happens if they don't change (5 years)
  
  -- Patterns (AI learns and adapts from these)
  quit_pattern text,                                -- "Week 2 when novelty wears off"
  favorite_excuse text,                             -- "Too tired"
  who_disappointed text[],                          -- ["my kids", "my wife", "myself"]
  fears text[],                                     -- ["being seen as a fraud", "dying early"]
  
  -- Voice recordings (Cloudflare R2 URLs)
  future_self_intro_url text,                       -- Act 2: "I am [core identity]"
  why_recording_url text,                           -- Act 3: Their emotional why
  pledge_recording_url text,                        -- Act 7: The commitment pledge
  
  -- Voice cloning
  cartesia_voice_id text,                           -- Cloned voice for agent
  
  -- Overall trust (aggregate of all pillars)
  overall_trust_score integer DEFAULT 50 CHECK (overall_trust_score >= 0 AND overall_trust_score <= 100),
  
  -- Supermemory integration
  supermemory_container_id text,                    -- For rich narrative context
  
  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_future_self_user_id ON future_self(user_id);

-- Trigger for updated_at
CREATE TRIGGER trigger_future_self_updated_at
  BEFORE UPDATE ON future_self
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. FUTURE_SELF_PILLARS - Per-pillar transformation states
-- ============================================================================
CREATE TABLE IF NOT EXISTS future_self_pillars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  future_self_id uuid NOT NULL REFERENCES future_self(id) ON DELETE CASCADE,
  
  -- Pillar type (4 actionable pillars, "why" is in future_self table)
  pillar text NOT NULL CHECK (pillar IN ('body', 'mission', 'stack', 'tribe')),
  
  -- The transformation
  current_state text NOT NULL,                      -- "Overweight, tired, avoiding mirrors"
  future_state text NOT NULL,                       -- "150lbs, energetic, proud of my body"
  identity_statement text NOT NULL,                 -- "I am an athlete"
  
  -- Daily behavior
  non_negotiable text NOT NULL,                     -- "I move my body every single day"
  
  -- Tracking
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  priority integer DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  last_checked_at timestamptz,                      -- When AI last focused on this pillar
  consecutive_kept integer DEFAULT 0,               -- Current streak for this pillar
  consecutive_broken integer DEFAULT 0,             -- Current broken streak
  total_kept integer DEFAULT 0,                     -- All-time completions
  total_checked integer DEFAULT 0,                  -- All-time check-ins
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'achieved')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One pillar per type per user
  UNIQUE(user_id, pillar)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_future_self_pillars_user_id ON future_self_pillars(user_id);
CREATE INDEX IF NOT EXISTS idx_future_self_pillars_future_self_id ON future_self_pillars(future_self_id);
CREATE INDEX IF NOT EXISTS idx_future_self_pillars_user_active ON future_self_pillars(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_future_self_pillars_trust ON future_self_pillars(user_id, trust_score);

-- Trigger for updated_at
CREATE TRIGGER trigger_future_self_pillars_updated_at
  BEFORE UPDATE ON future_self_pillars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. PILLAR_CHECKINS - Daily check-ins per pillar
-- ============================================================================
CREATE TABLE IF NOT EXISTS pillar_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id uuid NOT NULL REFERENCES future_self_pillars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_id uuid,                                     -- Which call this came from
  
  -- Result
  showed_up boolean NOT NULL,                       -- Did they embody this identity today?
  
  -- Context
  what_happened text,                               -- Their explanation
  excuse_used text,                                 -- If applicable
  matched_pattern boolean DEFAULT false,            -- Was this a repeat excuse?
  
  -- Identity tracking
  identity_vote text CHECK (identity_vote IN ('positive', 'negative', 'neutral')),
  reinforcement_given text,                         -- What the agent said
  
  -- Difficulty and quality
  difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  checked_at timestamptz DEFAULT now(),
  checked_for_date date DEFAULT CURRENT_DATE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pillar_checkins_pillar_id ON pillar_checkins(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pillar_checkins_user_id ON pillar_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_pillar_checkins_user_date ON pillar_checkins(user_id, checked_for_date);
CREATE INDEX IF NOT EXISTS idx_pillar_checkins_recent ON pillar_checkins(user_id, checked_at DESC);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================
ALTER TABLE future_self ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_self_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillar_checkins ENABLE ROW LEVEL SECURITY;

-- Future Self policies
CREATE POLICY "Users can view own future_self"
  ON future_self FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own future_self"
  ON future_self FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own future_self"
  ON future_self FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to future_self"
  ON future_self FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Future Self Pillars policies
CREATE POLICY "Users can view own pillars"
  ON future_self_pillars FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pillars"
  ON future_self_pillars FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pillars"
  ON future_self_pillars FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to pillars"
  ON future_self_pillars FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Pillar Checkins policies
CREATE POLICY "Users can view own checkins"
  ON pillar_checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON pillar_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to checkins"
  ON pillar_checkins FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Get pillars to focus on for a call
CREATE OR REPLACE FUNCTION get_call_focus_pillars(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS TABLE (
  pillar_id uuid,
  pillar text,
  identity_statement text,
  non_negotiable text,
  priority integer,
  trust_score integer,
  days_since_checked integer,
  consecutive_broken integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fsp.id as pillar_id,
    fsp.pillar,
    fsp.identity_statement,
    fsp.non_negotiable,
    fsp.priority,
    fsp.trust_score,
    COALESCE(
      EXTRACT(DAY FROM now() - fsp.last_checked_at)::integer,
      999
    ) as days_since_checked,
    fsp.consecutive_broken
  FROM future_self_pillars fsp
  WHERE fsp.user_id = p_user_id AND fsp.status = 'active'
  ORDER BY 
    -- Priority 1: Pillars with broken streaks (need attention)
    fsp.consecutive_broken DESC,
    -- Priority 2: Pillars not checked recently
    COALESCE(EXTRACT(DAY FROM now() - fsp.last_checked_at), 999) DESC,
    -- Priority 3: Lowest trust score (struggling)
    fsp.trust_score ASC,
    -- Priority 4: User-set priority
    fsp.priority DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record a pillar check-in and update pillar stats
CREATE OR REPLACE FUNCTION record_pillar_checkin(
  p_pillar_id uuid,
  p_user_id uuid,
  p_showed_up boolean,
  p_what_happened text DEFAULT NULL,
  p_excuse_used text DEFAULT NULL,
  p_matched_pattern boolean DEFAULT false,
  p_identity_vote text DEFAULT NULL,
  p_call_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_checkin_id uuid;
  v_current_kept integer;
  v_current_broken integer;
  v_new_trust integer;
BEGIN
  -- Insert the check-in
  INSERT INTO pillar_checkins (
    pillar_id, user_id, showed_up, what_happened, 
    excuse_used, matched_pattern, identity_vote, call_id
  ) VALUES (
    p_pillar_id, p_user_id, p_showed_up, p_what_happened,
    p_excuse_used, p_matched_pattern, p_identity_vote, p_call_id
  ) RETURNING id INTO v_checkin_id;
  
  -- Get current streaks
  SELECT consecutive_kept, consecutive_broken, trust_score
  INTO v_current_kept, v_current_broken, v_new_trust
  FROM future_self_pillars WHERE id = p_pillar_id;
  
  -- Update pillar stats
  IF p_showed_up THEN
    -- They showed up - increase trust, reset broken streak
    v_new_trust := LEAST(100, v_new_trust + 5);
    UPDATE future_self_pillars SET
      consecutive_kept = v_current_kept + 1,
      consecutive_broken = 0,
      total_kept = total_kept + 1,
      total_checked = total_checked + 1,
      trust_score = v_new_trust,
      last_checked_at = now(),
      updated_at = now()
    WHERE id = p_pillar_id;
  ELSE
    -- They didn't show up - decrease trust, reset kept streak
    v_new_trust := GREATEST(0, v_new_trust - 5);
    IF p_matched_pattern THEN
      v_new_trust := GREATEST(0, v_new_trust - 3); -- Extra penalty for repeat excuse
    END IF;
    UPDATE future_self_pillars SET
      consecutive_kept = 0,
      consecutive_broken = v_current_broken + 1,
      total_checked = total_checked + 1,
      trust_score = v_new_trust,
      last_checked_at = now(),
      updated_at = now()
    WHERE id = p_pillar_id;
  END IF;
  
  -- Update overall trust score in future_self (average of all pillars)
  UPDATE future_self SET
    overall_trust_score = (
      SELECT ROUND(AVG(trust_score))::integer
      FROM future_self_pillars
      WHERE user_id = p_user_id AND status = 'active'
    ),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN v_checkin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pillar check-in summary for a user
CREATE OR REPLACE FUNCTION get_pillar_summary(p_user_id uuid)
RETURNS TABLE (
  pillar text,
  identity_statement text,
  trust_score integer,
  consecutive_kept integer,
  consecutive_broken integer,
  kept_last_7_days integer,
  total_last_7_days integer,
  last_checked_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fsp.pillar,
    fsp.identity_statement,
    fsp.trust_score,
    fsp.consecutive_kept,
    fsp.consecutive_broken,
    COALESCE(
      (SELECT COUNT(*) FROM pillar_checkins pc 
       WHERE pc.pillar_id = fsp.id 
       AND pc.showed_up = true 
       AND pc.checked_at > now() - interval '7 days')::integer,
      0
    ) as kept_last_7_days,
    COALESCE(
      (SELECT COUNT(*) FROM pillar_checkins pc 
       WHERE pc.pillar_id = fsp.id 
       AND pc.checked_at > now() - interval '7 days')::integer,
      0
    ) as total_last_7_days,
    fsp.last_checked_at
  FROM future_self_pillars fsp
  WHERE fsp.user_id = p_user_id AND fsp.status = 'active'
  ORDER BY fsp.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate overall identity alignment percentage
CREATE OR REPLACE FUNCTION get_identity_alignment(p_user_id uuid)
RETURNS TABLE (
  overall_alignment integer,
  pillar_alignments jsonb,
  transformation_status text
) AS $$
DECLARE
  v_alignment integer;
  v_pillars jsonb;
BEGIN
  -- Calculate average trust score as alignment
  SELECT ROUND(AVG(trust_score))::integer INTO v_alignment
  FROM future_self_pillars
  WHERE user_id = p_user_id AND status = 'active';
  
  v_alignment := COALESCE(v_alignment, 50);
  
  -- Build pillar breakdown
  SELECT jsonb_agg(jsonb_build_object(
    'pillar', pillar,
    'identity', identity_statement,
    'alignment', trust_score,
    'trend', CASE 
      WHEN consecutive_kept > 0 THEN 'up'
      WHEN consecutive_broken > 0 THEN 'down'
      ELSE 'stable'
    END
  )) INTO v_pillars
  FROM future_self_pillars
  WHERE user_id = p_user_id AND status = 'active';
  
  RETURN QUERY SELECT 
    v_alignment,
    COALESCE(v_pillars, '[]'::jsonb),
    CASE 
      WHEN v_alignment >= 80 THEN 'becoming'
      WHEN v_alignment >= 60 THEN 'progressing'
      WHEN v_alignment >= 40 THEN 'struggling'
      ELSE 'slipping'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================
COMMENT ON TABLE future_self IS 'Core future-self identity - who the user is becoming. Contains patterns, fears, and voice recordings.';
COMMENT ON TABLE future_self_pillars IS 'The 4 actionable life pillars (body, mission, stack, tribe) with transformation states and trust scores.';
COMMENT ON TABLE pillar_checkins IS 'Daily check-ins per pillar. Tracks identity votes (positive/negative) not just task completion.';
COMMENT ON COLUMN future_self.the_why IS 'The 5th pillar - purpose and meaning. Integration layer, not a daily action.';
COMMENT ON COLUMN future_self.dark_future IS 'What happens if they dont change (5 years). Used for dark prophetic persona.';
COMMENT ON COLUMN future_self_pillars.identity_statement IS 'The "I am..." statement. E.g., "I am an athlete" not "I want to be fit".';
COMMENT ON COLUMN future_self_pillars.non_negotiable IS 'The daily behavior that proves identity. E.g., "I move my body every day".';
COMMENT ON COLUMN pillar_checkins.identity_vote IS 'Each check-in is a vote for or against their identity. Positive = showed up, Negative = didnt.';

-- ============================================================================
-- MIGRATION NOTE
-- ============================================================================
-- After running this migration:
-- 1. Update onboarding to use the new 7-Act flow
-- 2. Migrate existing identity.daily_commitment to future_self + pillars
-- 3. Update agent prompts to use pillar-based accountability
-- 4. Update dashboard to show identity alignment instead of streaks
-- ============================================================================

-- ============================================================================
-- 7. DATA MIGRATION FROM LEGACY TABLES
-- ============================================================================
-- Migrate existing identity data to future_self (if identity table exists and has data)
-- This is a one-time migration for existing users

DO $$
BEGIN
  -- Check if identity table exists and future_self is empty
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'identity') THEN
    -- Migrate users who have identity but no future_self yet
    INSERT INTO future_self (
      user_id,
      core_identity,
      primary_pillar,
      the_why,
      dark_future,
      quit_pattern,
      favorite_excuse,
      cartesia_voice_id,
      overall_trust_score
    )
    SELECT 
      i.user_id,
      COALESCE(i.daily_commitment, 'Becoming my best self'),
      'body', -- Default to body as primary
      COALESCE(
        (i.onboarding_context->>'future_if_no_change'),
        'To become who I know I can be'
      ),
      (i.onboarding_context->>'future_if_no_change'),
      (i.onboarding_context->>'quit_pattern'),
      (i.onboarding_context->>'favorite_excuse'),
      i.cartesia_voice_id,
      COALESCE(s.trust_score, 50)
    FROM identity i
    LEFT JOIN status s ON s.user_id = i.user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM future_self fs WHERE fs.user_id = i.user_id
    );
    
    RAISE NOTICE 'Migrated % users from identity to future_self', (
      SELECT COUNT(*) FROM future_self WHERE created_at > now() - interval '1 minute'
    );
  END IF;
END $$;

-- Create default pillars for migrated users (based on their single commitment)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT fs.id as future_self_id, fs.user_id, fs.core_identity
    FROM future_self fs
    WHERE NOT EXISTS (
      SELECT 1 FROM future_self_pillars fsp WHERE fsp.user_id = fs.user_id
    )
  LOOP
    -- Create a default MISSION pillar from their commitment
    INSERT INTO future_self_pillars (
      user_id, future_self_id, pillar,
      current_state, future_state, identity_statement, non_negotiable,
      trust_score, priority, status
    ) VALUES (
      r.user_id, r.future_self_id, 'mission',
      'Working towards my goals',
      'Achieved my mission',
      r.core_identity,
      'I show up and do the work every single day',
      50, 100, 'active'
    );
    
    RAISE NOTICE 'Created default pillar for user %', r.user_id;
  END LOOP;
END $$;

-- ============================================================================
-- 8. DROP ALL LEGACY TABLES
-- ============================================================================
-- These tables are replaced by the new pillar system.
-- Drop in order of dependencies.

-- Drop task_checkins first (depends on tasks)
DROP TABLE IF EXISTS task_checkins CASCADE;

-- Drop tasks (depends on goals)
DROP TABLE IF EXISTS tasks CASCADE;

-- Drop goals
DROP TABLE IF EXISTS goals CASCADE;

-- Drop identity (replaced by future_self)
DROP TABLE IF EXISTS identity CASCADE;

-- Notify about drops
DO $$
BEGIN
  RAISE NOTICE 'Dropped legacy tables: identity, goals, tasks, task_checkins (replaced by future_self + pillar system)';
END $$;

-- ============================================================================
-- 9. CLEANUP SUMMARY
-- ============================================================================
-- 
-- DROPPED (this migration):
--   - identity (replaced by future_self)
--   - goals (never used)
--   - tasks (never used)  
--   - task_checkins (replaced by pillar_checkins)
--
-- KEPT:
--   - status (still used for streaks, call counts)
--   - users (core user table)
--   - call_memory (narrative state)
--   - call_analytics (call history)
--   - subscriptions (billing)
--
-- NEW TABLES (this migration):
--   - future_self (core identity)
--   - future_self_pillars (4 pillars)
--   - pillar_checkins (daily check-ins)
--
-- ============================================================================
