-- Efficient Supabase SQL function to find users ready for ritual calls
-- Includes first-day call rules and timezone handling
-- Call with: SELECT * FROM get_users_ready_for_calls();
DROP FUNCTION IF EXISTS get_ready_calls_count();
DROP FUNCTION IF EXISTS check_first_day_call_eligibility(UUID);

CREATE OR REPLACE FUNCTION get_users_ready_for_calls()
RETURNS TABLE (
  -- Complete User object fields
  id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  name TEXT,
  email TEXT,
  subscription_status TEXT,
  timezone TEXT,
  morning_window_start TIME,
  morning_window_end TIME,
  evening_window_start TIME,
  evening_window_end TIME,
  voice_clone_id TEXT,
  push_token TEXT,
  onboarding_completed BOOLEAN,
  onboarding_completed_at TIMESTAMPTZ,
  schedule_change_count INTEGER,
  voice_reclone_count INTEGER,
  revenuecat_customer_id TEXT,
  -- Call scheduling metadata
  call_type TEXT,
  is_first_day_call BOOLEAN,
  window_start TIME,
  window_end TIME,
  local_time TIMESTAMPTZ,
  next_call_window_start TIMESTAMPTZ,
  next_call_window_end TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_utc TIMESTAMPTZ := NOW();
BEGIN
  RETURN QUERY
  WITH active_users AS (
    -- OPTIMIZED: Get active users with ALL fields
    SELECT 
      u.id,
      u.created_at,
      u.updated_at,
      u.name,
      u.email,
      u.subscription_status,
      u.timezone,
      u.morning_window_start,
      u.morning_window_end,
      u.evening_window_start,
      u.evening_window_end,
      u.voice_clone_id,
      u.push_token,
      u.onboarding_completed,
      u.onboarding_completed_at,
      u.schedule_change_count,
      u.voice_reclone_count,
      u.revenuecat_customer_id
    FROM users u
    WHERE u.subscription_status = 'active'
      AND u.onboarding_completed = true
      AND u.morning_window_start IS NOT NULL
      AND u.evening_window_start IS NOT NULL
  ),
  
  recent_calls AS (
    -- BATCH QUERY: Get recent calls (last 2 hours) for duplicate prevention
    SELECT DISTINCT
      cr.user_id,
      cr.call_type
    FROM calls cr
    WHERE cr.created_at >= (current_utc - INTERVAL '2 hours')
  ),
  
  weekly_call_counts AS (
    -- WEEKLY LIMIT CHECK: Count calls in last 7 days per user
    SELECT 
      cr.user_id,
      COUNT(*) as weekly_calls
    FROM calls cr
    WHERE cr.created_at >= (current_utc - INTERVAL '7 days')
    GROUP BY cr.user_id
  ),
  
  user_timezones AS (
    -- Calculate local time for each user
    SELECT 
      au.*,
      (current_utc AT TIME ZONE au.timezone) AS user_local_time,
      -- Check if onboarding was completed today in user's timezone
      DATE((au.onboarding_completed_at AT TIME ZONE au.timezone)::DATE) = 
      DATE((current_utc AT TIME ZONE au.timezone)::DATE) AS is_first_day
    FROM active_users au
  ),
  
  eligible_users AS (
    SELECT 
      ut.*,
      -- Evening-only window check (single call system)
      CASE 
        WHEN ut.user_local_time::TIME BETWEEN ut.evening_window_start AND ut.evening_window_end
        THEN 'evening'
        ELSE NULL
      END AS current_call_type,
      
      -- FIRST-DAY CALL RULES: Check if first day call is allowed
      CASE 
        WHEN ut.is_first_day THEN
          -- Allow first day call only if current time hasn't passed evening window start
          ut.user_local_time::TIME < ut.evening_window_start
        ELSE true
      END AS first_day_call_allowed
      
    FROM user_timezones ut
  )
  
  SELECT 
    -- Complete User object fields
    eu.id,
    eu.created_at,
    eu.updated_at,
    eu.name,
    eu.email,
    eu.subscription_status,
    eu.timezone,
    eu.morning_window_start,
    eu.morning_window_end,
    eu.evening_window_start,
    eu.evening_window_end,
    eu.voice_clone_id,
    eu.push_token,
    eu.onboarding_completed,
    eu.onboarding_completed_at,
    eu.schedule_change_count,
    eu.voice_reclone_count,
    eu.revenuecat_customer_id,
    -- Call scheduling metadata
    eu.current_call_type AS call_type,
    eu.is_first_day AS is_first_day_call,
    
    -- Return evening window times (single call system)
    eu.evening_window_start AS window_start,
    eu.evening_window_end AS window_end,
    
    eu.user_local_time AS local_time,
    
    -- Calculate next call window timestamps (evening only)
    (DATE(eu.user_local_time) + eu.evening_window_start)::TIMESTAMPTZ AT TIME ZONE eu.timezone AS next_call_window_start,
    (DATE(eu.user_local_time) + eu.evening_window_end)::TIMESTAMPTZ AT TIME ZONE eu.timezone AS next_call_window_end
    
  FROM eligible_users eu
  LEFT JOIN recent_calls rc ON (eu.id = rc.user_id AND eu.current_call_type = rc.call_type)
  LEFT JOIN weekly_call_counts wcc ON eu.id = wcc.user_id
  
  WHERE 
    -- User is in a call window
    eu.current_call_type IS NOT NULL
    
    -- First-day call rules are satisfied
    AND eu.first_day_call_allowed = true
    
    -- Not called recently (duplicate prevention)
    AND rc.user_id IS NULL
    
    -- Weekly call limit check (max 7 calls per week)
    AND COALESCE(wcc.weekly_calls, 0) < 7
    
    -- FIRST-DAY SPECIAL RULE: No evening calls on first day
    AND NOT (eu.is_first_day = true AND eu.current_call_type = 'evening')
  
  ORDER BY 
    -- Prioritize first-day calls
    eu.is_first_day DESC,
    -- Then by user name (only evening calls now)
    eu.name;
    
END;
$$;

-- Index optimization for the function (without non-immutable functions)
CREATE INDEX IF NOT EXISTS idx_users_subscription_onboarding 
ON users (subscription_status, onboarding_completed) 
WHERE subscription_status = 'active' AND onboarding_completed = true;

-- Index for calls without time-based WHERE clause to avoid immutable function issues
CREATE INDEX IF NOT EXISTS idx_calls_user_type_time 
ON calls (user_id, call_type, created_at DESC);

-- Additional indexes for user timezone calculations
CREATE INDEX IF NOT EXISTS idx_users_timezone_windows 
ON users (timezone, morning_window_start, morning_window_end, evening_window_start, evening_window_end)
WHERE subscription_status = 'active' AND onboarding_completed = true;

-- Drop and recreate the count function with new signature
DROP FUNCTION IF EXISTS get_ready_calls_count();

CREATE FUNCTION get_ready_calls_count()
RETURNS TABLE (
  total_ready INTEGER,
  daily_reckoning_calls INTEGER,
  first_day_calls INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ready_calls AS (
    SELECT * FROM get_users_ready_for_calls()
  )
  SELECT 
    COUNT(*)::INTEGER AS total_ready,
    COUNT(*) FILTER (WHERE call_type = 'evening')::INTEGER AS daily_reckoning_calls,
    COUNT(*) FILTER (WHERE is_first_day_call = true)::INTEGER AS first_day_calls
  FROM ready_calls;
END;
$$;

-- Drop and recreate first-day eligibility function with new signature
DROP FUNCTION IF EXISTS check_first_day_call_eligibility(UUID);

CREATE FUNCTION check_first_day_call_eligibility(p_user_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  reason TEXT,
  user_local_time TIMESTAMPTZ,
  evening_window_start TIME,
  is_first_day BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_record RECORD;
  current_utc TIMESTAMPTZ := NOW();
BEGIN
  -- Get user data
  SELECT 
    u.timezone,
    u.evening_window_start,
    u.onboarding_completed_at,
    u.subscription_status,
    u.onboarding_completed
  INTO user_record
  FROM users u
  WHERE u.id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found', NULL::TIMESTAMPTZ, NULL::TIME, false;
    RETURN;
  END IF;
  
  IF user_record.subscription_status != 'active' THEN
    RETURN QUERY SELECT false, 'User not active', NULL::TIMESTAMPTZ, NULL::TIME, false;
    RETURN;
  END IF;
  
  IF NOT user_record.onboarding_completed THEN
    RETURN QUERY SELECT false, 'Onboarding not completed', NULL::TIMESTAMPTZ, NULL::TIME, false;
    RETURN;
  END IF;
  
  DECLARE
    user_local_time TIMESTAMPTZ := current_utc AT TIME ZONE user_record.timezone;
    is_first_day BOOLEAN := DATE((user_record.onboarding_completed_at AT TIME ZONE user_record.timezone)::DATE) = 
                           DATE((current_utc AT TIME ZONE user_record.timezone)::DATE);
  BEGIN
    IF is_first_day THEN
      -- FIRST-DAY RULE: Allow only if current time hasn't passed evening window (single call system)
      IF user_local_time::TIME < user_record.evening_window_start THEN
        RETURN QUERY SELECT true, 'First day call allowed - before evening window', 
                    user_local_time, user_record.evening_window_start, is_first_day;
      ELSE
        RETURN QUERY SELECT false, 'First day call blocked - after evening window', 
                    user_local_time, user_record.evening_window_start, is_first_day;
      END IF;
    ELSE
      RETURN QUERY SELECT true, 'Not first day - normal rules apply', 
                  user_local_time, user_record.evening_window_start, is_first_day;
    END IF;
  END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_ready_for_calls() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ready_calls_count() TO authenticated;
GRANT EXECUTE ON FUNCTION check_first_day_call_eligibility(UUID) TO authenticated;