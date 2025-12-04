-- ============================================================================
-- Migration 008: Multi-Goal & Multi-Task Support
-- ============================================================================
-- 
-- Adds support for multiple goals per user, with tasks and check-ins.
-- 
-- DATA ARCHITECTURE:
--   Supabase (this file): Structured data - goals, tasks, check-ins, trust scores
--   Supermemory: Psychological context - why goals matter, fears, patterns
--
-- GOAL FLOW:
--   1. User mentions goal in call → Agent extracts → Creates in Supabase
--   2. Goal context (why it matters) → Stored in Supermemory
--   3. Daily check-ins → Tracked in task_checkins table
--   4. Trust scores → Calculated from check-in history
--
-- ============================================================================

-- 1. Goals table (user's life goals)
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Goal definition
  goal_text text NOT NULL,                      -- "Get to 150lbs"
  goal_category text CHECK (goal_category IN (
    'health', 'career', 'relationships', 'finance', 'personal', 'learning', 'other'
  )),
  goal_deadline text,                           -- "by March 2025" (free text, AI parses)
  
  -- AI-managed fields (updated by agent after each call)
  priority integer DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  trust_score integer DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  
  -- Supermemory reference (psychological context stored there)
  -- The full "why it matters" and emotional context is in Supermemory
  supermemory_synced boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  -- One goal text per user (prevent duplicates)
  UNIQUE(user_id, goal_text)
);

-- 2. Tasks table (daily/regular actions toward goals)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Task definition
  task_text text NOT NULL,                      -- "Work out for 30 minutes"
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'specific_days', 'as_needed')),
  specific_days integer[],                      -- [1,3,5] for Mon/Wed/Fri (1=Mon, 7=Sun)
  preferred_time text,                          -- "7am", "after work" (free text)
  
  -- Tracking
  last_checked_at timestamptz,                  -- When AI last asked about this
  consecutive_kept integer DEFAULT 0,           -- Current streak for this task
  consecutive_broken integer DEFAULT 0,         -- Current broken streak
  total_kept integer DEFAULT 0,                 -- All-time completions
  total_checked integer DEFAULT 0,              -- All-time check-ins
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Task check-ins (daily accountability records)
CREATE TABLE IF NOT EXISTS task_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  call_id uuid,                                 -- Which call this came from
  
  -- Result
  kept boolean NOT NULL,                        -- Did they do it?
  
  -- Context
  excuse_text text,                             -- If not kept, what did they say?
  excuse_pattern text,                          -- Normalized pattern (too_tired, no_time, etc.)
  difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  notes text,
  
  -- Trust score delta applied (-5 to +5)
  trust_delta integer DEFAULT 0,
  
  -- Timestamp
  checked_at timestamptz DEFAULT now(),
  checked_for_date date DEFAULT CURRENT_DATE
);

-- 4. Add overall trust score to status table
ALTER TABLE status 
ADD COLUMN IF NOT EXISTS overall_trust_score integer DEFAULT 50 
  CHECK (overall_trust_score >= 0 AND overall_trust_score <= 100);

-- 5. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_goals_user_priority ON goals(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON tasks(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_task_checkins_task ON task_checkins(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checkins_user_date ON task_checkins(user_id, checked_for_date);
CREATE INDEX IF NOT EXISTS idx_task_checkins_recent ON task_checkins(user_id, checked_at DESC);

-- 6. RLS Policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checkins ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to goals"
  ON goals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Tasks policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to tasks"
  ON tasks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Task checkins policies
CREATE POLICY "Users can view own checkins"
  ON task_checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON task_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to checkins"
  ON task_checkins FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 7. Get goals to focus on for a call (AI picks 1-3 based on priority/recency)
CREATE OR REPLACE FUNCTION get_call_focus_goals(p_user_id uuid, p_limit integer DEFAULT 3)
RETURNS TABLE (
  goal_id uuid,
  goal_text text,
  goal_category text,
  priority integer,
  trust_score integer,
  days_since_checked integer,
  active_task_count bigint,
  needs_attention boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as goal_id,
    g.goal_text,
    g.goal_category,
    g.priority,
    g.trust_score,
    COALESCE(
      EXTRACT(DAY FROM now() - MAX(tc.checked_at))::integer,
      999
    ) as days_since_checked,
    COUNT(DISTINCT t.id) as active_task_count,
    -- Needs attention if: low trust, not checked recently, or broken streak
    (g.trust_score < 40 OR 
     EXTRACT(DAY FROM now() - MAX(tc.checked_at)) > 2 OR
     MAX(t.consecutive_broken) >= 2) as needs_attention
  FROM goals g
  LEFT JOIN tasks t ON t.goal_id = g.id AND t.status = 'active'
  LEFT JOIN task_checkins tc ON tc.task_id = t.id
  WHERE g.user_id = p_user_id AND g.status = 'active'
  GROUP BY g.id, g.goal_text, g.goal_category, g.priority, g.trust_score
  ORDER BY 
    -- Prioritize goals needing attention
    (g.trust_score < 40 OR EXTRACT(DAY FROM now() - MAX(tc.checked_at)) > 2) DESC,
    -- Then by days since checked
    COALESCE(EXTRACT(DAY FROM now() - MAX(tc.checked_at)), 999) DESC,
    -- Then by priority
    g.priority DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get tasks to check for a specific goal
CREATE OR REPLACE FUNCTION get_goal_tasks_to_check(p_goal_id uuid)
RETURNS TABLE (
  task_id uuid,
  task_text text,
  frequency text,
  preferred_time text,
  consecutive_kept integer,
  consecutive_broken integer,
  last_checked_at timestamptz,
  should_check_today boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as task_id,
    t.task_text,
    t.frequency,
    t.preferred_time,
    t.consecutive_kept,
    t.consecutive_broken,
    t.last_checked_at,
    -- Should check if: daily and not checked today, or specific day matches
    (
      (t.frequency = 'daily' AND (t.last_checked_at IS NULL OR t.last_checked_at::date < CURRENT_DATE))
      OR
      (t.frequency = 'specific_days' AND EXTRACT(ISODOW FROM CURRENT_DATE)::integer = ANY(t.specific_days) 
       AND (t.last_checked_at IS NULL OR t.last_checked_at::date < CURRENT_DATE))
      OR
      (t.frequency = 'weekly' AND (t.last_checked_at IS NULL OR t.last_checked_at < now() - interval '7 days'))
    ) as should_check_today
  FROM tasks t
  WHERE t.goal_id = p_goal_id AND t.status = 'active'
  ORDER BY 
    -- Prioritize tasks that should be checked today
    (t.last_checked_at IS NULL OR t.last_checked_at::date < CURRENT_DATE) DESC,
    t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Record a task check-in and update streaks
CREATE OR REPLACE FUNCTION record_task_checkin(
  p_task_id uuid,
  p_user_id uuid,
  p_kept boolean,
  p_excuse_text text DEFAULT NULL,
  p_excuse_pattern text DEFAULT NULL,
  p_call_id uuid DEFAULT NULL
)
RETURNS TABLE (
  checkin_id uuid,
  new_consecutive_kept integer,
  new_consecutive_broken integer,
  trust_delta integer
) AS $$
DECLARE
  v_checkin_id uuid;
  v_goal_id uuid;
  v_new_kept integer;
  v_new_broken integer;
  v_trust_delta integer;
  v_current_trust integer;
BEGIN
  -- Get goal_id for the task
  SELECT goal_id INTO v_goal_id FROM tasks WHERE id = p_task_id;
  
  -- Calculate trust delta
  IF p_kept THEN
    v_trust_delta := 5;
    -- Bonus for maintaining streak
    SELECT consecutive_kept INTO v_new_kept FROM tasks WHERE id = p_task_id;
    IF v_new_kept >= 7 THEN
      v_trust_delta := v_trust_delta + 2; -- Streak bonus
    END IF;
  ELSE
    v_trust_delta := -5;
    -- Extra penalty for using favorite excuse (detected by pattern)
    IF p_excuse_pattern IS NOT NULL THEN
      v_trust_delta := v_trust_delta - 2;
    END IF;
  END IF;
  
  -- Insert check-in
  INSERT INTO task_checkins (task_id, user_id, goal_id, call_id, kept, excuse_text, excuse_pattern, trust_delta)
  VALUES (p_task_id, p_user_id, v_goal_id, p_call_id, p_kept, p_excuse_text, p_excuse_pattern, v_trust_delta)
  RETURNING id INTO v_checkin_id;
  
  -- Update task streaks
  IF p_kept THEN
    UPDATE tasks 
    SET 
      consecutive_kept = consecutive_kept + 1,
      consecutive_broken = 0,
      total_kept = total_kept + 1,
      total_checked = total_checked + 1,
      last_checked_at = now(),
      updated_at = now()
    WHERE id = p_task_id
    RETURNING consecutive_kept, consecutive_broken INTO v_new_kept, v_new_broken;
  ELSE
    UPDATE tasks 
    SET 
      consecutive_kept = 0,
      consecutive_broken = consecutive_broken + 1,
      total_checked = total_checked + 1,
      last_checked_at = now(),
      updated_at = now()
    WHERE id = p_task_id
    RETURNING consecutive_kept, consecutive_broken INTO v_new_kept, v_new_broken;
  END IF;
  
  -- Update goal trust score
  SELECT trust_score INTO v_current_trust FROM goals WHERE id = v_goal_id;
  UPDATE goals 
  SET 
    trust_score = GREATEST(0, LEAST(100, v_current_trust + v_trust_delta)),
    updated_at = now()
  WHERE id = v_goal_id;
  
  -- Update overall trust score
  SELECT overall_trust_score INTO v_current_trust FROM status WHERE user_id = p_user_id;
  IF v_current_trust IS NOT NULL THEN
    UPDATE status 
    SET overall_trust_score = GREATEST(0, LEAST(100, v_current_trust + v_trust_delta))
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT v_checkin_id, v_new_kept, v_new_broken, v_trust_delta;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Get user's check-in summary for prompt context
CREATE OR REPLACE FUNCTION get_user_checkin_summary(p_user_id uuid, p_days integer DEFAULT 7)
RETURNS TABLE (
  total_checkins bigint,
  total_kept bigint,
  total_broken bigint,
  keep_rate numeric,
  top_excuse_pattern text,
  top_excuse_count bigint,
  goals_with_low_trust bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_checkins AS (
    SELECT * FROM task_checkins 
    WHERE user_id = p_user_id AND checked_at > now() - (p_days || ' days')::interval
  ),
  excuse_counts AS (
    SELECT excuse_pattern, COUNT(*) as cnt
    FROM recent_checkins
    WHERE excuse_pattern IS NOT NULL
    GROUP BY excuse_pattern
    ORDER BY cnt DESC
    LIMIT 1
  )
  SELECT 
    COUNT(*)::bigint as total_checkins,
    COUNT(*) FILTER (WHERE kept)::bigint as total_kept,
    COUNT(*) FILTER (WHERE NOT kept)::bigint as total_broken,
    CASE WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE kept)::numeric / COUNT(*)::numeric) * 100, 1)
      ELSE 0 
    END as keep_rate,
    (SELECT excuse_pattern FROM excuse_counts) as top_excuse_pattern,
    (SELECT cnt FROM excuse_counts) as top_excuse_count,
    (SELECT COUNT(*) FROM goals WHERE user_id = p_user_id AND status = 'active' AND trust_score < 40)::bigint as goals_with_low_trust
  FROM recent_checkins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Comments
COMMENT ON TABLE goals IS 'User goals - added through conversations. Structured data in Supabase, psychological context in Supermemory.';
COMMENT ON TABLE tasks IS 'Regular actions toward goals. User defines at onboarding + AI extracts from calls.';
COMMENT ON TABLE task_checkins IS 'Daily check-ins for tasks. Drives trust score calculation.';
COMMENT ON COLUMN goals.priority IS 'AI-inferred priority 0-100. Higher = more important. AI adjusts based on conversation.';
COMMENT ON COLUMN goals.trust_score IS 'Per-goal trust 0-100. Based on weighted average of recent check-ins.';
COMMENT ON COLUMN goals.supermemory_synced IS 'True if goal context has been stored in Supermemory.';

-- ============================================================================
-- MIGRATION NOTE: After running this migration:
-- 1. Run data migration to move existing identity.daily_commitment to goals/tasks
-- 2. Update agent services to use new tables
-- 3. Keep identity.daily_commitment for backward compat during transition
-- ============================================================================
