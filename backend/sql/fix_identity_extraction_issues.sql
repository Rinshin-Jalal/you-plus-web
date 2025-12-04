-- =====================================================
-- FIX IDENTITY EXTRACTION ISSUES
-- =====================================================
-- Fixes character length constraints and ensures operational fields are properly saved
-- Addresses issues with AI analysis field length limits and missing operational data

-- STEP 1: Fix character varying length constraints for AI analysis fields
-- These fields are receiving longer values from AI analysis than current limits allow
ALTER TABLE identity 
ALTER COLUMN accountability_trigger TYPE TEXT,
ALTER COLUMN weakness_time_window TYPE TEXT;

-- STEP 2: Ensure all operational fields exist and have proper types
-- These are basic fields that don't need AI analysis but must be saved
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS daily_non_negotiable TEXT,
ADD COLUMN IF NOT EXISTS transformation_target_date DATE,
ADD COLUMN IF NOT EXISTS call_window_start TIME,
ADD COLUMN IF NOT EXISTS call_window_timezone TEXT;

-- STEP 3: Increase identity_summary length to prevent truncation
-- Current summary is being cut off, needs more space for full psychological profile
ALTER TABLE identity 
ALTER COLUMN identity_summary TYPE TEXT;

-- STEP 4: Add comments to document the field purposes
COMMENT ON COLUMN identity.daily_non_negotiable IS 'Their ONE daily commitment (operational field - no AI needed)';
COMMENT ON COLUMN identity.transformation_target_date IS 'Target transformation date (operational field - no AI needed)';
COMMENT ON COLUMN identity.call_window_start IS 'When to call them - start time (operational field - no AI needed)';
COMMENT ON COLUMN identity.call_window_timezone IS 'Timezone for call window (operational field - no AI needed)';
COMMENT ON COLUMN identity.accountability_trigger IS 'What makes them move (AI-extracted psychological insight)';
COMMENT ON COLUMN identity.weakness_time_window IS 'When they typically break (AI-extracted behavioral pattern)';
COMMENT ON COLUMN identity.identity_summary IS 'Full psychological profile summary (AI-generated, no truncation)';

-- STEP 5: Verify the final schema
-- Run this query to check all columns are properly configured:
-- SELECT column_name, data_type, character_maximum_length, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'identity' 
-- ORDER BY column_name;

-- Expected operational fields (4): daily_non_negotiable, transformation_target_date, call_window_start, call_window_timezone
-- Expected AI fields (13): current_identity, aspirated_identity, fear_identity, core_struggle, biggest_enemy, primary_excuse, sabotage_method, weakness_time_window, procrastination_focus, last_major_failure, past_success_story, accountability_trigger, war_cry
-- Expected core fields (6): id, user_id, name, identity_summary, created_at, updated_at
-- Total: 23 fields
