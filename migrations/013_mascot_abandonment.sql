-- ============================================================================
-- Migration 013: Mascot Abandonment System
-- ============================================================================
-- The mascot reflects real life progress, not just activity.
-- When users abandon their goals, the mascot shows it visually.
-- This creates healthy shame that motivates return and prevents quitting cycles.
--
-- Philosophy: "The mascot is a mirror. It shows them what they did."
-- ============================================================================

-- Add days_absent tracking to user_progression
ALTER TABLE user_progression 
  ADD COLUMN IF NOT EXISTS days_absent INTEGER DEFAULT 0;

-- Add last_activity_check_at for decay calculation
ALTER TABLE user_progression
  ADD COLUMN IF NOT EXISTS last_activity_check_at DATE DEFAULT CURRENT_DATE;

-- ============================================================================
-- Function: Calculate days since last XP activity
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_days_absent(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_xp_at TIMESTAMPTZ;
  v_days_absent INTEGER;
BEGIN
  SELECT last_xp_earned_at INTO v_last_xp_at
  FROM user_progression
  WHERE user_id = p_user_id;
  
  IF v_last_xp_at IS NULL THEN
    RETURN 0;
  END IF;
  
  v_days_absent := EXTRACT(DAY FROM (NOW() - v_last_xp_at))::INTEGER;
  RETURN COALESCE(v_days_absent, 0);
END;
$$;

-- ============================================================================
-- Function: Accelerated energy decay for absent users
-- ============================================================================
-- Decay rates:
--   Days 1-2: -15 energy/day (standard)
--   Days 3+:  -25 energy/day (accelerated - they're ghosting)
-- ============================================================================
CREATE OR REPLACE FUNCTION decay_mascot_energy_accelerated(p_user_id UUID)
RETURNS TABLE(
  new_energy INTEGER,
  days_absent INTEGER,
  mood_updated VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_energy INTEGER;
  v_last_decay_at DATE;
  v_last_xp_at TIMESTAMPTZ;
  v_days_since_decay INTEGER;
  v_days_absent INTEGER;
  v_total_decay INTEGER := 0;
  v_new_energy INTEGER;
  v_new_mood VARCHAR;
  i INTEGER;
BEGIN
  -- Get current state
  SELECT mascot_energy, last_energy_decay_at, last_xp_earned_at
  INTO v_current_energy, v_last_decay_at, v_last_xp_at
  FROM user_progression
  WHERE user_id = p_user_id;
  
  -- If no record, return defaults
  IF v_current_energy IS NULL THEN
    RETURN QUERY SELECT 100, 0, 'neutral'::VARCHAR;
    RETURN;
  END IF;
  
  -- Calculate days since last decay
  v_days_since_decay := CURRENT_DATE - COALESCE(v_last_decay_at, CURRENT_DATE - 1);
  
  -- Calculate total days absent (since last XP earned)
  v_days_absent := calculate_days_absent(p_user_id);
  
  -- If already decayed today, return current state
  IF v_days_since_decay <= 0 THEN
    SELECT mascot_mood INTO v_new_mood FROM user_progression WHERE user_id = p_user_id;
    RETURN QUERY SELECT v_current_energy, v_days_absent, v_new_mood;
    RETURN;
  END IF;
  
  -- Calculate decay for each day missed
  FOR i IN 1..v_days_since_decay LOOP
    -- Days 1-2 of absence: standard decay (-15)
    -- Days 3+: accelerated decay (-25)
    IF (v_days_absent - v_days_since_decay + i) <= 2 THEN
      v_total_decay := v_total_decay + 15;
    ELSE
      v_total_decay := v_total_decay + 25;
    END IF;
  END LOOP;
  
  -- Apply decay (minimum 0)
  v_new_energy := GREATEST(0, v_current_energy - v_total_decay);
  
  -- Determine mood based on energy
  IF v_new_energy <= 0 THEN
    v_new_mood := 'sleeping';
  ELSIF v_days_absent >= 3 THEN
    v_new_mood := 'sad';  -- They abandoned the mascot
  ELSE
    v_new_mood := 'concerned';
  END IF;
  
  -- Update the record
  UPDATE user_progression
  SET 
    mascot_energy = v_new_energy,
    days_absent = v_days_absent,
    last_energy_decay_at = CURRENT_DATE,
    mascot_mood = v_new_mood
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_new_energy, v_days_absent, v_new_mood;
END;
$$;

-- ============================================================================
-- Function: Restore energy when user returns
-- ============================================================================
-- Recovery rates:
--   Complete a call:      +25 energy
--   Pillar check-in:      +10 energy
--   Maximum energy:       100
-- ============================================================================
CREATE OR REPLACE FUNCTION restore_mascot_energy(
  p_user_id UUID,
  p_action VARCHAR,  -- 'call_completed' or 'pillar_checkin'
  p_amount INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_energy INTEGER;
  v_restore_amount INTEGER;
  v_new_energy INTEGER;
BEGIN
  -- Determine restore amount
  IF p_amount IS NOT NULL THEN
    v_restore_amount := p_amount;
  ELSIF p_action = 'call_completed' OR p_action = 'call_answered' THEN
    v_restore_amount := 25;
  ELSIF p_action = 'pillar_checkin' THEN
    v_restore_amount := 10;
  ELSE
    v_restore_amount := 10;  -- Default
  END IF;
  
  -- Get current energy
  SELECT mascot_energy INTO v_current_energy
  FROM user_progression
  WHERE user_id = p_user_id;
  
  -- Calculate new energy (max 100)
  v_new_energy := LEAST(100, COALESCE(v_current_energy, 0) + v_restore_amount);
  
  -- Update energy and reset days_absent
  UPDATE user_progression
  SET 
    mascot_energy = v_new_energy,
    days_absent = 0,
    last_xp_earned_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_new_energy;
END;
$$;

-- ============================================================================
-- Function: Get pillar health metrics for mood calculation
-- ============================================================================
CREATE OR REPLACE FUNCTION get_pillar_health(p_user_id UUID)
RETURNS TABLE(
  avg_trust NUMERIC,
  lowest_trust INTEGER,
  pillar_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(trust_score), 50)::NUMERIC as avg_trust,
    COALESCE(MIN(trust_score), 50)::INTEGER as lowest_trust,
    COUNT(*)::INTEGER as pillar_count
  FROM future_self_pillars
  WHERE user_id = p_user_id
    AND status = 'active';
END;
$$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON COLUMN user_progression.days_absent IS 
  'Number of days since user last earned XP. Used for abandonment visuals (dust, cobwebs).';

COMMENT ON COLUMN user_progression.last_activity_check_at IS 
  'Last date we checked/updated the days_absent counter.';

COMMENT ON FUNCTION decay_mascot_energy_accelerated IS 
  'Decays mascot energy with acceleration for absent users. Days 1-2: -15/day, Days 3+: -25/day. The mascot shows abandonment visually.';

COMMENT ON FUNCTION restore_mascot_energy IS 
  'Restores mascot energy when user takes action. Call: +25, Pillar check-in: +10. Recovery is slower than decay (asymmetric by design).';

COMMENT ON FUNCTION get_pillar_health IS 
  'Returns average and minimum trust scores across active pillars. Used to calculate mood based on real life progress, not just activity.';
