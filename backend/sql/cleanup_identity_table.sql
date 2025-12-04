-- =====================================================
-- CLEANUP IDENTITY TABLE - Remove Unwanted Columns
-- =====================================================
-- Remove columns that shouldn't be in the intelligent identity schema
-- Keep only the 17 essential columns for the clean AI-powered system

-- Remove unwanted columns that are still present
ALTER TABLE identity
DROP COLUMN IF EXISTS achievements,
DROP COLUMN IF EXISTS failure_reasons;

-- Fix call_window data type - needs super accurate timezone-aware TIME (no foolish dates!)
-- Current: TIME WITHOUT TIME ZONE (only stores single time, no timezone)
-- Better: Separate TIME and TIMEZONE fields (PostgreSQL doesn't support TIME WITH TIME ZONE)
-- End time will be auto-calculated as start + 30 minutes
ALTER TABLE identity 
DROP COLUMN IF EXISTS call_window;

-- Add proper call window fields: TIME + separate timezone field
ALTER TABLE identity
ADD COLUMN call_window_start TIME,
ADD COLUMN call_window_timezone TEXT;

-- Verify the final schema should have exactly these 17 columns:
-- Core system columns (6): id, user_id, name, identity_summary, created_at, updated_at
-- Operational fields (4): daily_non_negotiable, call_window_start, call_window_timezone, transformation_target_date
-- Identity fields (7): current_identity, aspirated_identity, fear_identity, core_struggle, biggest_enemy, primary_excuse, sabotage_method  
-- Behavioral fields (6): weakness_time_window, procrastination_focus, last_major_failure, past_success_story, accountability_trigger, war_cry

-- VERIFICATION QUERY - Run this to check final schema:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'identity' 
-- ORDER BY column_name;

-- Expected final columns (17 total):
-- accountability_trigger, aspirated_identity, biggest_enemy, call_window_start, call_window_timezone, core_struggle, created_at, current_identity, daily_non_negotiable, fear_identity, id, identity_summary, last_major_failure, name, past_success_story, primary_excuse, procrastination_focus, sabotage_method, transformation_target_date, updated_at, war_cry, weakness_time_window

-- Example call window usage:
-- call_window_start: '18:00:00' (6 PM)
-- call_window_timezone: 'America/New_York' (Eastern timezone)
-- End time auto-calculated: start + 30 minutes = 18:30:00
-- System converts to user's timezone at runtime for accurate scheduling