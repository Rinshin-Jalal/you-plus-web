# Data Model: Mascot Gamification System

**Feature**: 002-mascot-gamification  
**Date**: 2025-12-09  
**Status**: Complete

---

## Database Schema

### Table: `user_progression`

Primary table for user's gamification state.

```sql
CREATE TABLE user_progression (
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

-- Indexes
CREATE INDEX idx_user_progression_user_id ON user_progression(user_id);
CREATE INDEX idx_user_progression_level ON user_progression(current_level);

-- Trigger for updated_at
CREATE TRIGGER trigger_user_progression_updated_at
  BEFORE UPDATE ON user_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users (unique per user) |
| total_xp | INTEGER | Lifetime XP earned (never decreases) |
| current_level | INTEGER | Current level (1-100) |
| xp_in_current_level | INTEGER | Progress toward next level |
| xp_to_next_level | INTEGER | XP required for next level |
| streak_multiplier | DECIMAL | Current XP multiplier (1.0-2.0) |
| streak_shields | INTEGER | Available streak shields (0-3) |
| mascot_stage | INTEGER | Evolution stage (1-5) |
| mascot_mood | VARCHAR | Current mood state |
| mascot_energy | INTEGER | Energy level (0-100) |
| last_xp_earned_at | TIMESTAMPTZ | When XP was last earned |
| last_level_up_at | TIMESTAMPTZ | When user last leveled up |
| last_achievement_at | TIMESTAMPTZ | When last achievement unlocked |
| last_energy_decay_at | DATE | Date of last energy decay (prevents double decay) |

---

### Table: `achievements`

Static achievement definitions (seeded).

```sql
CREATE TABLE achievements (
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

-- Indexes
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| key | VARCHAR | Unique identifier (e.g., "week_warrior") |
| name | VARCHAR | Display name |
| description | TEXT | How to unlock |
| icon | VARCHAR | Emoji or icon key |
| xp_reward | INTEGER | XP awarded on unlock |
| rarity | VARCHAR | common/rare/epic/legendary |
| category | VARCHAR | Achievement category |
| requirement_type | VARCHAR | Type of requirement check |
| requirement_value | INTEGER | Target value |
| requirement_config | JSONB | Additional config (pillar type, etc.) |
| accessory_unlock | VARCHAR | Optional accessory key to unlock |
| sort_order | INTEGER | Display order in UI |

---

### Table: `user_achievements`

User's unlocked achievements.

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(user_id, unlocked_at DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| achievement_id | UUID | FK to achievements |
| unlocked_at | TIMESTAMPTZ | When unlocked |
| notified | BOOLEAN | Has user seen notification |

---

### Table: `xp_transactions`

Audit log of all XP changes.

```sql
CREATE TABLE xp_transactions (
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

-- Indexes
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_xp_transactions_reason ON xp_transactions(reason);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| amount | INTEGER | Final XP (after multiplier) |
| reason | VARCHAR | What triggered the XP |
| multiplier | DECIMAL | Applied multiplier |
| base_amount | INTEGER | XP before multiplier |
| metadata | JSONB | Context (call_id, pillar, achievement_key) |
| created_at | TIMESTAMPTZ | When transaction occurred |

---

### Table: `daily_challenges`

User's daily challenges.

```sql
CREATE TABLE daily_challenges (
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

-- Indexes
CREATE INDEX idx_daily_challenges_user_date ON daily_challenges(user_id, challenge_date);
CREATE INDEX idx_daily_challenges_expires ON daily_challenges(expires_at) WHERE completed = FALSE;
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| challenge_date | DATE | Which day this is for |
| challenge_type | VARCHAR | Type of challenge |
| challenge_config | JSONB | Specific requirements |
| description | TEXT | Human-readable description |
| xp_reward | INTEGER | XP on completion |
| completed | BOOLEAN | Is it done |
| completed_at | TIMESTAMPTZ | When completed |
| expires_at | TIMESTAMPTZ | End of day in user TZ |

---

### Table: `mascot_accessories`

Static accessory definitions (seeded).

```sql
CREATE TABLE mascot_accessories (
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

-- Indexes
CREATE INDEX idx_mascot_accessories_category ON mascot_accessories(category);
CREATE INDEX idx_mascot_accessories_unlock_method ON mascot_accessories(unlock_method);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| key | VARCHAR | Unique identifier (e.g., "sunglasses") |
| name | VARCHAR | Display name |
| description | TEXT | Flavor text |
| category | VARCHAR | headwear/eyewear/effects/backgrounds/props |
| rarity | VARCHAR | common/rare/epic/legendary |
| unlock_method | VARCHAR | How it's unlocked |
| unlock_requirement | VARCHAR | Achievement key, level number, or streak days |
| asset_key | VARCHAR | Reference to SVG asset |
| z_index | INTEGER | Layer order for rendering |
| preview_offset_x/y | INTEGER | Position offset for preview |
| sort_order | INTEGER | Display order in shop |

---

### Table: `user_accessories`

User's unlocked and equipped accessories.

```sql
CREATE TABLE user_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES mascot_accessories(id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, accessory_id)
);

-- Indexes
CREATE INDEX idx_user_accessories_user_id ON user_accessories(user_id);
CREATE INDEX idx_user_accessories_equipped ON user_accessories(user_id) WHERE equipped = TRUE;
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| accessory_id | UUID | FK to mascot_accessories |
| equipped | BOOLEAN | Currently wearing |
| unlocked_at | TIMESTAMPTZ | When unlocked |

---

### Table: `weekly_leaderboard`

Aggregated weekly XP for rankings.

```sql
CREATE TABLE weekly_leaderboard (
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

-- Indexes
CREATE INDEX idx_weekly_leaderboard_week ON weekly_leaderboard(week_start);
CREATE INDEX idx_weekly_leaderboard_rank ON weekly_leaderboard(week_start, rank) WHERE rank IS NOT NULL;
CREATE INDEX idx_weekly_leaderboard_xp ON weekly_leaderboard(week_start, xp_earned DESC);
```

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| week_start | DATE | Monday of the week |
| xp_earned | INTEGER | XP earned this week |
| rank | INTEGER | Calculated rank (1 = top) |
| mascot_stage | INTEGER | Snapshot for display |
| current_level | INTEGER | Snapshot for display |
| updated_at | TIMESTAMPTZ | Last update |

---

## Entity Relationships

```
users (existing)
├── user_progression (1:1)
│   └── Contains XP, level, mascot state
├── user_achievements (1:N)
│   └── achievements (N:1)
├── user_accessories (1:N)
│   └── mascot_accessories (N:1)
├── xp_transactions (1:N)
│   └── Audit log of all XP changes
├── daily_challenges (1:N)
│   └── One per day
└── weekly_leaderboard (1:N)
    └── One per week

achievements (static)
└── Seeded at deploy, referenced by user_achievements

mascot_accessories (static)
└── Seeded at deploy, referenced by user_accessories
```

---

## RLS Policies

```sql
-- user_progression
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progression"
  ON user_progression FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON user_progression FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- xp_transactions
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON xp_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- daily_challenges
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON daily_challenges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- user_accessories
ALTER TABLE user_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accessories"
  ON user_accessories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- weekly_leaderboard (public read for top ranks)
ALTER TABLE weekly_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON weekly_leaderboard FOR SELECT TO authenticated
  USING (true);

-- achievements and mascot_accessories are public read
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT TO authenticated
  USING (true);

ALTER TABLE mascot_accessories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view accessories"
  ON mascot_accessories FOR SELECT TO authenticated
  USING (true);
```

---

## Functions

### Calculate Level from XP

```sql
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
```

### Get Streak Multiplier

```sql
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
```

### Get Mascot Stage

```sql
CREATE OR REPLACE FUNCTION get_mascot_stage(p_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN p_level >= 76 THEN 5
    WHEN p_level >= 51 THEN 4
    WHEN p_level >= 26 THEN 3
    WHEN p_level >= 11 THEN 2
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## Seed Data

See migration file for complete seed data. Summary:

### Achievements (45 total)

| Category | Count | Examples |
|----------|-------|----------|
| Streaks | 7 | first_step, week_warrior, century_legend |
| Calls | 7 | first_contact, call_veteran, early_bird |
| Pillars | 6 | body_builder, mission_driven, balanced_life |
| Trust | 4 | building_trust, perfect_trust |
| Levels | 5 | level_10, level_25, level_50, level_75, level_100 |
| Special | 6 | comeback_kid, no_excuses, honest_soul |

### Accessories (25 total)

| Category | Count | Examples |
|----------|-------|----------|
| Headwear | 8 | party_hat, crown, halo, graduation_cap |
| Eyewear | 5 | sunglasses, reading_glasses, 3d_glasses |
| Effects | 5 | fire_aura, rainbow_trail, star_sparkle |
| Backgrounds | 4 | sunrise, mountain, space |
| Props | 3 | trophy, dumbbell, coffee |
