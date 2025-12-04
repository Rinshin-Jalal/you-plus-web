-- Update get_users_ready_for_calls to include phone_number for Cartesia Line calls
-- Run this after add_phone_number_to_users.sql

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
  phone_number TEXT,  -- NEW: For Cartesia Line telephony
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
    -- OPTIMIZED: Get active users with ALL fields including phone_number
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
      u.phone_number,  -- NEW: For Cartesia Line
      u.onboarding_completed,
      u.onboarding_completed_at,
      u.schedule_change_count,
      u.voice_reclone_count,
      u.revenuecat_customer_id
    FROM users u
    WHERE u.subscription_status = 'active'
      AND u.onboarding_completed = true
      AND u.phone_number IS NOT NULL  -- IMPORTANT: Only users with phone numbers
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
        THEN 'daily_reckoning'  -- Changed from 'evening' to match call_type
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
    eu.phone_number,  -- NEW: For Cartesia Line
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
    AND NOT (eu.is_first_day = true AND eu.current_call_type = 'daily_reckoning')
  
  ORDER BY 
    -- Prioritize first-day calls
    eu.is_first_day DESC,
    -- Then by user name
    eu.name;
    
END;
$$;

-- Add index for phone_number to speed up queries
CREATE INDEX IF NOT EXISTS idx_users_phone_number 
ON users (phone_number) 
WHERE phone_number IS NOT NULL;
