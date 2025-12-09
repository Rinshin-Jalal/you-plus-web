-- ============================================================================
-- Migration 012: Mascot Gamification System
-- ============================================================================
-- 
-- Implements the gamification layer for YOU+:
--   - XP & Leveling (100 levels with exponential curve)
--   - Mascot Evolution (5 stages: Spark, Ember, Flame, Blaze, Inferno)
--   - Mascot Mood (7 states based on user behavior)
--   - Achievements (45+ across 6 categories)
--   - Accessories (25+ cosmetic items)
--   - Daily Challenges (rotating objectives)
--   - Streak Shields (protect against streak breaks)
--   - Weekly Leaderboard (anonymous rankings)
--
-- Tables created:
--   1. user_progression - XP, level, streak multiplier, mascot state
--   2. achievements - Static achievement definitions (seeded)
--   3. user_achievements - User's unlocked achievements
--   4. xp_transactions - Audit log of all XP changes
--   5. daily_challenges - User's daily challenges
--   6. mascot_accessories - Static accessory definitions (seeded)
--   7. user_accessories - User's unlocked/equipped accessories
--   8. weekly_leaderboard - Aggregated weekly XP for rankings
--
-- ============================================================================

-- ============================================================================
-- 1. MASCOT_ACCESSORIES (must be created first due to FK from achievements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mascot_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('headwear', 'eyewear', 'effects', 'backgrounds', 'props')),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlock_method VARCHAR(30) NOT NULL
    CHECK (unlock_method IN ('achievement', 'level', 'streak', 'special', 'default')),
  unlock_requirement VARCHAR(100),
  asset_key VARCHAR(100) NOT NULL,
  z_index INTEGER NOT NULL DEFAULT 20,
  preview_offset_x INTEGER DEFAULT 0,
  preview_offset_y INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mascot_accessories_category ON mascot_accessories(category);
CREATE INDEX IF NOT EXISTS idx_mascot_accessories_unlock_method ON mascot_accessories(unlock_method);

-- ============================================================================
-- 2. ACHIEVEMENTS (static definitions, seeded)
-- ============================================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  xp_reward INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  rarity VARCHAR(20) NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('streaks', 'calls', 'pillars', 'trust', 'levels', 'special')),
  requirement_type VARCHAR(30) NOT NULL
    CHECK (requirement_type IN ('streak', 'count', 'threshold', 'milestone', 'special')),
  requirement_value INTEGER,
  requirement_config JSONB DEFAULT '{}',
  accessory_unlock VARCHAR(50) REFERENCES mascot_accessories(key),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- ============================================================================
-- 3. USER_PROGRESSION (primary gamification state)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progression (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- XP & Level
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 100),
  xp_in_current_level INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 100,
  
  -- Streak & Multiplier
  streak_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (streak_multiplier >= 1.0 AND streak_multiplier <= 2.0),
  streak_shields INTEGER NOT NULL DEFAULT 0 CHECK (streak_shields >= 0 AND streak_shields <= 3),
  
  -- Mascot State
  mascot_stage INTEGER NOT NULL DEFAULT 1 CHECK (mascot_stage >= 1 AND mascot_stage <= 5),
  mascot_mood VARCHAR(20) NOT NULL DEFAULT 'neutral' 
    CHECK (mascot_mood IN ('celebrating', 'proud', 'happy', 'neutral', 'concerned', 'sad', 'sleeping')),
  mascot_energy INTEGER NOT NULL DEFAULT 100 CHECK (mascot_energy >= 0 AND mascot_energy <= 100),
  
  -- Timestamps
  last_xp_earned_at TIMESTAMPTZ,
  last_level_up_at TIMESTAMPTZ,
  last_achievement_at TIMESTAMPTZ,
  last_energy_decay_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_progression_user_id ON user_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progression_level ON user_progression(current_level);

CREATE TRIGGER trigger_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 4. USER_ACHIEVEMENTS (user's unlocked achievements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(user_id, unlocked_at DESC);

-- ============================================================================
-- 5. XP_TRANSACTIONS (audit log of all XP changes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL
    CHECK (reason IN (
      'call_answered', 'call_completed', 
      'pillar_checkin', 'all_pillars_complete',
      'promise_kept', 'promise_broken',
      'achievement_unlock', 'daily_challenge',
      'streak_bonus', 'level_up_bonus',
      'admin_adjustment'
    )),
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  base_amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_reason ON xp_transactions(reason);

-- ============================================================================
-- 6. DAILY_CHALLENGES (user's daily challenges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  challenge_type VARCHAR(30) NOT NULL
    CHECK (challenge_type IN (
      'pillar_focus', 'all_pillars', 'call_speed',
      'no_excuse', 'reflection', 'streak_protect'
    )),
  challenge_config JSONB NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50 CHECK (xp_reward > 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, challenge_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON daily_challenges(user_id, challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_expires ON daily_challenges(expires_at) WHERE completed = FALSE;

-- ============================================================================
-- 7. USER_ACCESSORIES (user's unlocked and equipped accessories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES mascot_accessories(id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, accessory_id)
);

CREATE INDEX IF NOT EXISTS idx_user_accessories_user_id ON user_accessories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accessories_equipped ON user_accessories(user_id) WHERE equipped = TRUE;

-- ============================================================================
-- 8. WEEKLY_LEADERBOARD (aggregated weekly XP for rankings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  mascot_stage INTEGER NOT NULL DEFAULT 1,
  current_level INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_week ON weekly_leaderboard(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_rank ON weekly_leaderboard(week_start, rank) WHERE rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_xp ON weekly_leaderboard(week_start, xp_earned DESC);

-- ============================================================================
-- 9. RLS POLICIES
-- ============================================================================

-- user_progression
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progression"
  ON user_progression FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to progression"
  ON user_progression FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_achievements"
  ON user_achievements FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- xp_transactions
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON xp_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to xp_transactions"
  ON xp_transactions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- daily_challenges
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON daily_challenges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to daily_challenges"
  ON daily_challenges FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- user_accessories
ALTER TABLE user_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessories"
  ON user_accessories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_accessories"
  ON user_accessories FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- weekly_leaderboard (public read for rankings)
ALTER TABLE weekly_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON weekly_leaderboard FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role full access to weekly_leaderboard"
  ON weekly_leaderboard FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- achievements (public read, service write)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role full access to achievements"
  ON achievements FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- mascot_accessories (public read, service write)
ALTER TABLE mascot_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accessories"
  ON mascot_accessories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role full access to mascot_accessories"
  ON mascot_accessories FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Calculate level from total XP
-- Formula: XP required for level N = floor(100 * 1.15^(N-1))
CREATE OR REPLACE FUNCTION calculate_level(p_total_xp INTEGER)
RETURNS TABLE (
  level INTEGER,
  xp_in_level INTEGER,
  xp_to_next INTEGER
) AS $$
DECLARE
  v_level INTEGER := 1;
  v_cumulative INTEGER := 0;
  v_required INTEGER;
BEGIN
  LOOP
    v_required := FLOOR(100 * POWER(1.15, v_level - 1))::INTEGER;
    IF v_cumulative + v_required > p_total_xp OR v_level >= 100 THEN
      EXIT;
    END IF;
    v_cumulative := v_cumulative + v_required;
    v_level := v_level + 1;
  END LOOP;
  
  RETURN QUERY SELECT 
    v_level,
    (p_total_xp - v_cumulative)::INTEGER,
    v_required;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get streak multiplier from streak days
CREATE OR REPLACE FUNCTION get_streak_multiplier(p_streak_days INTEGER)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  RETURN CASE
    WHEN p_streak_days >= 30 THEN 2.0
    WHEN p_streak_days >= 14 THEN 1.5
    WHEN p_streak_days >= 7 THEN 1.25
    WHEN p_streak_days >= 3 THEN 1.1
    ELSE 1.0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get mascot stage from level
CREATE OR REPLACE FUNCTION get_mascot_stage(p_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN p_level >= 76 THEN 5  -- Inferno
    WHEN p_level >= 51 THEN 4  -- Blaze
    WHEN p_level >= 26 THEN 3  -- Flame
    WHEN p_level >= 11 THEN 2  -- Ember
    ELSE 1                      -- Spark
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Award XP to a user (with multiplier)
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_base_amount INTEGER,
  p_reason VARCHAR(50),
  p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE (
  new_total_xp INTEGER,
  new_level INTEGER,
  xp_awarded INTEGER,
  leveled_up BOOLEAN,
  new_stage INTEGER
) AS $$
DECLARE
  v_multiplier DECIMAL(3,2);
  v_final_amount INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_xp INTEGER;
  v_xp_in_level INTEGER;
  v_xp_to_next INTEGER;
  v_old_stage INTEGER;
  v_new_stage INTEGER;
  v_leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get current state
  SELECT up.streak_multiplier, up.current_level, up.total_xp, up.mascot_stage
  INTO v_multiplier, v_old_level, v_new_xp, v_old_stage
  FROM user_progression up
  WHERE up.user_id = p_user_id;
  
  -- If no progression record, create one
  IF NOT FOUND THEN
    INSERT INTO user_progression (user_id)
    VALUES (p_user_id);
    v_multiplier := 1.0;
    v_old_level := 1;
    v_new_xp := 0;
    v_old_stage := 1;
  END IF;
  
  -- Calculate final amount (no multiplier on negative XP)
  IF p_base_amount > 0 THEN
    v_final_amount := FLOOR(p_base_amount * v_multiplier)::INTEGER;
  ELSE
    v_final_amount := p_base_amount;
    v_multiplier := 1.0;
  END IF;
  
  -- Update total XP (cannot go below 0)
  v_new_xp := GREATEST(0, v_new_xp + v_final_amount);
  
  -- Calculate new level
  SELECT level, xp_in_level, xp_to_next
  INTO v_new_level, v_xp_in_level, v_xp_to_next
  FROM calculate_level(v_new_xp);
  
  -- Check if leveled up
  v_leveled_up := v_new_level > v_old_level;
  
  -- Get new mascot stage
  v_new_stage := get_mascot_stage(v_new_level);
  
  -- Record transaction
  INSERT INTO xp_transactions (user_id, amount, reason, multiplier, base_amount, metadata)
  VALUES (p_user_id, v_final_amount, p_reason, v_multiplier, p_base_amount, p_metadata);
  
  -- Update progression
  UPDATE user_progression SET
    total_xp = v_new_xp,
    current_level = v_new_level,
    xp_in_current_level = v_xp_in_level,
    xp_to_next_level = v_xp_to_next,
    mascot_stage = v_new_stage,
    last_xp_earned_at = NOW(),
    last_level_up_at = CASE WHEN v_leveled_up THEN NOW() ELSE last_level_up_at END,
    mascot_mood = CASE WHEN v_leveled_up THEN 'celebrating' ELSE mascot_mood END,
    mascot_energy = LEAST(100, mascot_energy + 10)  -- Restore energy on activity
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT 
    v_new_xp,
    v_new_level,
    v_final_amount,
    v_leveled_up,
    v_new_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize gamification for a user (call after user creation)
CREATE OR REPLACE FUNCTION initialize_user_gamification(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_progression_id UUID;
BEGIN
  INSERT INTO user_progression (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_progression_id;
  
  RETURN v_progression_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. SEED DATA: ACCESSORIES
-- ============================================================================
INSERT INTO mascot_accessories (key, name, description, category, rarity, unlock_method, unlock_requirement, asset_key, z_index, sort_order) VALUES
-- Headwear (z_index 30 - on top)
('party_hat', 'Party Hat', 'Celebrate your achievements!', 'headwear', 'common', 'achievement', 'first_step', 'accessories/headwear/party_hat.svg', 30, 1),
('crown', 'Golden Crown', 'For the king of accountability', 'headwear', 'legendary', 'level', '50', 'accessories/headwear/crown.svg', 30, 2),
('graduation_cap', 'Graduation Cap', 'You made it!', 'headwear', 'epic', 'achievement', 'level_25', 'accessories/headwear/graduation_cap.svg', 30, 3),
('halo', 'Angel Halo', 'Perfect trust, perfect you', 'headwear', 'legendary', 'achievement', 'perfect_trust', 'accessories/headwear/halo.svg', 30, 4),
('chef_hat', 'Chef Hat', 'Cooking up success', 'headwear', 'rare', 'level', '15', 'accessories/headwear/chef_hat.svg', 30, 5),
('wizard_hat', 'Wizard Hat', 'Master of habits', 'headwear', 'epic', 'achievement', 'monthly_master', 'accessories/headwear/wizard_hat.svg', 30, 6),
('headband', 'Sweat Headband', 'For the fitness focused', 'headwear', 'common', 'achievement', 'body_builder', 'accessories/headwear/headband.svg', 30, 7),
('thinking_cap', 'Thinking Cap', 'Always learning', 'headwear', 'rare', 'streak', '14', 'accessories/headwear/thinking_cap.svg', 30, 8),

-- Eyewear (z_index 25)
('sunglasses', 'Cool Shades', 'Too cool for school', 'eyewear', 'common', 'level', '5', 'accessories/eyewear/sunglasses.svg', 25, 1),
('reading_glasses', 'Reading Glasses', 'Studious and focused', 'eyewear', 'common', 'achievement', 'first_contact', 'accessories/eyewear/reading_glasses.svg', 25, 2),
('monocle', 'Fancy Monocle', 'Distinguished accountability', 'eyewear', 'rare', 'level', '20', 'accessories/eyewear/monocle.svg', 25, 3),
('3d_glasses', '3D Glasses', 'See things differently', 'eyewear', 'rare', 'achievement', 'comeback_kid', 'accessories/eyewear/3d_glasses.svg', 25, 4),
('vr_headset', 'VR Headset', 'Future focused', 'eyewear', 'epic', 'level', '40', 'accessories/eyewear/vr_headset.svg', 25, 5),

-- Effects (z_index 35 - topmost)
('fire_aura', 'Fire Aura', 'You are on fire!', 'effects', 'epic', 'streak', '30', 'accessories/effects/fire_aura.svg', 35, 1),
('rainbow_trail', 'Rainbow Trail', 'Spread the joy', 'effects', 'rare', 'achievement', 'balanced_life', 'accessories/effects/rainbow_trail.svg', 35, 2),
('star_sparkle', 'Star Sparkle', 'You are a star', 'effects', 'common', 'level', '10', 'accessories/effects/star_sparkle.svg', 35, 3),
('lightning_bolt', 'Lightning Bolt', 'Charged with energy', 'effects', 'rare', 'achievement', 'early_bird', 'accessories/effects/lightning_bolt.svg', 35, 4),
('confetti', 'Confetti Shower', 'Always celebrating', 'effects', 'epic', 'achievement', 'century_legend', 'accessories/effects/confetti.svg', 35, 5),

-- Backgrounds (z_index 5 - behind mascot)
('sunrise', 'Sunrise', 'A new day, a new chance', 'backgrounds', 'common', 'default', NULL, 'accessories/backgrounds/sunrise.svg', 5, 1),
('mountain', 'Mountain Peak', 'Climbing to the top', 'backgrounds', 'rare', 'level', '25', 'accessories/backgrounds/mountain.svg', 5, 2),
('space', 'Outer Space', 'Sky is not the limit', 'backgrounds', 'legendary', 'level', '75', 'accessories/backgrounds/space.svg', 5, 3),
('cityscape', 'City Skyline', 'Urban achiever', 'backgrounds', 'rare', 'achievement', 'mission_driven', 'accessories/backgrounds/cityscape.svg', 5, 4),

-- Props (z_index 20)
('trophy', 'Golden Trophy', 'A winner!', 'props', 'epic', 'achievement', 'level_50', 'accessories/props/trophy.svg', 20, 1),
('dumbbell', 'Dumbbell', 'Getting stronger every day', 'props', 'common', 'achievement', 'body_builder', 'accessories/props/dumbbell.svg', 20, 2),
('coffee_cup', 'Coffee Cup', 'Fueled by caffeine and dreams', 'props', 'common', 'streak', '7', 'accessories/props/coffee_cup.svg', 20, 3)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 12. SEED DATA: ACHIEVEMENTS
-- ============================================================================
INSERT INTO achievements (key, name, description, icon, xp_reward, rarity, category, requirement_type, requirement_value, requirement_config, accessory_unlock, sort_order) VALUES
-- STREAKS (7 achievements)
('first_step', 'First Step', 'Complete your first day', '1', 50, 'common', 'streaks', 'streak', 1, '{}', 'party_hat', 1),
('three_day_spark', 'Three Day Spark', 'Maintain a 3-day streak', '3', 75, 'common', 'streaks', 'streak', 3, '{}', NULL, 2),
('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', '7', 100, 'common', 'streaks', 'streak', 7, '{}', NULL, 3),
('two_week_titan', 'Two Week Titan', 'Maintain a 14-day streak', '14', 200, 'rare', 'streaks', 'streak', 14, '{}', NULL, 4),
('monthly_master', 'Monthly Master', 'Maintain a 30-day streak', '30', 500, 'epic', 'streaks', 'milestone', 30, '{}', 'wizard_hat', 5),
('quarterly_queen', 'Quarterly Champion', 'Maintain a 90-day streak', '90', 1500, 'legendary', 'streaks', 'milestone', 90, '{}', NULL, 6),
('century_legend', 'Century Legend', 'Maintain a 100-day streak', '100', 2500, 'legendary', 'streaks', 'milestone', 100, '{}', 'confetti', 7),

-- CALLS (7 achievements)
('first_contact', 'First Contact', 'Complete your first call', NULL, 50, 'common', 'calls', 'count', 1, '{"type": "calls_completed"}', 'reading_glasses', 10),
('call_regular', 'Call Regular', 'Complete 10 calls', NULL, 100, 'common', 'calls', 'count', 10, '{"type": "calls_completed"}', NULL, 11),
('call_veteran', 'Call Veteran', 'Complete 50 calls', NULL, 300, 'rare', 'calls', 'count', 50, '{"type": "calls_completed"}', NULL, 12),
('call_master', 'Call Master', 'Complete 100 calls', NULL, 750, 'epic', 'calls', 'count', 100, '{"type": "calls_completed"}', NULL, 13),
('early_bird', 'Early Bird', 'Answer a call before 7 AM', NULL, 150, 'rare', 'calls', 'special', NULL, '{"type": "early_call", "before_hour": 7}', 'lightning_bolt', 14),
('night_owl', 'Night Owl', 'Answer a call after 10 PM', NULL, 150, 'rare', 'calls', 'special', NULL, '{"type": "late_call", "after_hour": 22}', NULL, 15),
('speed_demon', 'Speed Demon', 'Answer a call within 5 seconds', NULL, 100, 'rare', 'calls', 'special', NULL, '{"type": "fast_answer", "max_seconds": 5}', NULL, 16),

-- PILLARS (6 achievements)
('body_builder', 'Body Builder', 'Complete 30 Body pillar check-ins', NULL, 200, 'rare', 'pillars', 'count', 30, '{"pillar": "health"}', 'headband', 20),
('mission_driven', 'Mission Driven', 'Complete 30 Mission pillar check-ins', NULL, 200, 'rare', 'pillars', 'count', 30, '{"pillar": "career"}', 'cityscape', 21),
('stack_master', 'Stack Master', 'Complete 30 Stack pillar check-ins', NULL, 200, 'rare', 'pillars', 'count', 30, '{"pillar": "finances"}', NULL, 22),
('tribe_leader', 'Tribe Leader', 'Complete 30 Tribe pillar check-ins', NULL, 200, 'rare', 'pillars', 'count', 30, '{"pillar": "relationships"}', NULL, 23),
('balanced_life', 'Balanced Life', 'Complete all pillars for 7 consecutive days', NULL, 500, 'epic', 'pillars', 'special', 7, '{"type": "all_pillars_streak"}', 'rainbow_trail', 24),
('pillar_perfect', 'Pillar Perfect', 'Complete all pillars for 30 consecutive days', NULL, 1500, 'legendary', 'pillars', 'special', 30, '{"type": "all_pillars_streak"}', NULL, 25),

-- TRUST (4 achievements)
('building_trust', 'Building Trust', 'Reach 60% overall trust score', NULL, 150, 'common', 'trust', 'threshold', 60, '{}', NULL, 30),
('trusted_partner', 'Trusted Partner', 'Reach 75% overall trust score', NULL, 300, 'rare', 'trust', 'threshold', 75, '{}', NULL, 31),
('trust_elite', 'Trust Elite', 'Reach 90% overall trust score', NULL, 750, 'epic', 'trust', 'threshold', 90, '{}', NULL, 32),
('perfect_trust', 'Perfect Trust', 'Reach 100% overall trust score', NULL, 2000, 'legendary', 'trust', 'threshold', 100, '{}', 'halo', 33),

-- LEVELS (5 achievements)
('level_10', 'Double Digits', 'Reach level 10', NULL, 200, 'common', 'levels', 'milestone', 10, '{}', NULL, 40),
('level_25', 'Quarter Century', 'Reach level 25', NULL, 500, 'rare', 'levels', 'milestone', 25, '{}', 'graduation_cap', 41),
('level_50', 'Half Century', 'Reach level 50', NULL, 1000, 'epic', 'levels', 'milestone', 50, '{}', 'trophy', 42),
('level_75', 'Diamond Tier', 'Reach level 75', NULL, 1500, 'epic', 'levels', 'milestone', 75, '{}', NULL, 43),
('level_100', 'Maximum Power', 'Reach level 100', NULL, 5000, 'legendary', 'levels', 'milestone', 100, '{}', NULL, 44),

-- SPECIAL (6 achievements)
('comeback_kid', 'Comeback Kid', 'Restart a streak after breaking one', NULL, 100, 'common', 'special', 'special', NULL, '{"type": "comeback"}', '3d_glasses', 50),
('no_excuses', 'No Excuses', 'Complete 7 days without using an excuse', NULL, 300, 'rare', 'special', 'special', 7, '{"type": "no_excuses"}', NULL, 51),
('honest_soul', 'Honest Soul', 'Admit to breaking a promise 5 times', NULL, 150, 'common', 'special', 'count', 5, '{"type": "promises_broken_admitted"}', NULL, 52),
('promise_keeper', 'Promise Keeper', 'Keep 50 promises in a row', NULL, 750, 'epic', 'special', 'count', 50, '{"type": "consecutive_promises_kept"}', NULL, 53),
('night_shift', 'Night Shift', 'Complete a late-night check-in (after midnight)', NULL, 100, 'rare', 'special', 'special', NULL, '{"type": "late_checkin"}', NULL, 54),
('perfectionist', 'Perfectionist', 'Complete all daily challenges for 7 days', NULL, 500, 'epic', 'special', 'special', 7, '{"type": "all_challenges"}', NULL, 55)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 13. COMMENTS
-- ============================================================================
COMMENT ON TABLE user_progression IS 'Primary gamification state for each user: XP, level, streak multiplier, mascot state';
COMMENT ON TABLE achievements IS 'Static achievement definitions. Seeded at deploy.';
COMMENT ON TABLE user_achievements IS 'Junction table: which achievements a user has unlocked';
COMMENT ON TABLE xp_transactions IS 'Audit log of all XP changes for a user';
COMMENT ON TABLE daily_challenges IS 'Daily challenges generated for each user, one per day';
COMMENT ON TABLE mascot_accessories IS 'Static accessory definitions. Seeded at deploy.';
COMMENT ON TABLE user_accessories IS 'Junction table: which accessories a user has unlocked and equipped';
COMMENT ON TABLE weekly_leaderboard IS 'Pre-computed weekly XP rankings, updated nightly';

COMMENT ON FUNCTION calculate_level IS 'Calculate level, XP in level, and XP to next from total XP. Uses exponential curve: 100 * 1.15^(level-1)';
COMMENT ON FUNCTION get_streak_multiplier IS 'Get XP multiplier based on streak days: 1.0x (0-2), 1.1x (3-6), 1.25x (7-13), 1.5x (14-29), 2.0x (30+)';
COMMENT ON FUNCTION get_mascot_stage IS 'Get mascot evolution stage from level: 1 (L1-10), 2 (L11-25), 3 (L26-50), 4 (L51-75), 5 (L76-100)';
COMMENT ON FUNCTION award_xp IS 'Award XP to user with multiplier, update level, record transaction';
COMMENT ON FUNCTION initialize_user_gamification IS 'Initialize gamification record for new user';

-- ============================================================================
-- 14. INITIALIZE GAMIFICATION FOR EXISTING USERS
-- ============================================================================
-- Create progression records for existing users who don't have one
INSERT INTO user_progression (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_progression up WHERE up.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Initialized gamification for % existing users', (
    SELECT COUNT(*) FROM user_progression WHERE created_at > NOW() - INTERVAL '1 minute'
  );
END $$;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- 
-- NEW TABLES:
--   - user_progression (XP, level, mascot state)
--   - achievements (45 seeded definitions)
--   - user_achievements (unlocked achievements)
--   - xp_transactions (audit log)
--   - daily_challenges (daily objectives)
--   - mascot_accessories (25 seeded definitions)
--   - user_accessories (unlocked/equipped accessories)
--   - weekly_leaderboard (rankings)
--
-- NEW FUNCTIONS:
--   - calculate_level(total_xp) -> level, xp_in_level, xp_to_next
--   - get_streak_multiplier(streak_days) -> multiplier
--   - get_mascot_stage(level) -> stage (1-5)
--   - award_xp(user_id, amount, reason, metadata) -> new_total, new_level, etc.
--   - initialize_user_gamification(user_id) -> progression_id
--
-- XP VALUES:
--   - call_answered: 25
--   - call_completed: 30
--   - pillar_checkin: 15
--   - all_pillars_complete: 50
--   - promise_kept: 20
--   - promise_broken: -10
--   - daily_challenge: 50-100
--   - achievements: 50-5000
--
-- MASCOT STAGES:
--   - Stage 1 (Spark): Levels 1-10
--   - Stage 2 (Ember): Levels 11-25
--   - Stage 3 (Flame): Levels 26-50
--   - Stage 4 (Blaze): Levels 51-75
--   - Stage 5 (Inferno): Levels 76-100
--
-- ============================================================================
