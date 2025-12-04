-- =====================================================
-- UPDATE USERS AND IDENTITY TABLE SCHEMA
-- =====================================================

-- 1. Remove old window fields from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS morning_window_start,
DROP COLUMN IF EXISTS morning_window_end,
DROP COLUMN IF EXISTS evening_window_start,
DROP COLUMN IF EXISTS evening_window_end;

-- 2. Add call window fields to users table (keep push_token)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS call_window_start TIME,
ADD COLUMN IF NOT EXISTS call_window_timezone TEXT;

-- 3. Keep push_token in users table (one token per user)
-- push_token text null

-- 4. Remove call window fields from identity table (moved to users)
ALTER TABLE identity
DROP COLUMN IF EXISTS call_window_start,
DROP COLUMN IF EXISTS call_window_timezone;

-- 5. Keep onboarding fields in users table (still needed for tracking)
-- onboarding_completed boolean null default false
-- onboarding_completed_at timestamp with time zone null
