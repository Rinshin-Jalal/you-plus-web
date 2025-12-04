-- =====================================================
-- Add CORRECT Missing Onboarding Fields to Identity Table  
-- =====================================================
-- Based on ACTUAL db_field names from onboarding step definitions
-- These are the real field names used in the frontend onboarding steps

-- Add the missing BIGBRUH onboarding fields to Identity table
-- Using ACTUAL db_field names from step definitions
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS disappointment_check TEXT,      -- Step 15: Who's most disappointed in you
ADD COLUMN IF NOT EXISTS procrastination_now TEXT,       -- Step 10: What you're procrastinating on RIGHT NOW  
ADD COLUMN IF NOT EXISTS sabotage_pattern TEXT,          -- Step 22: How you sabotage yourself
ADD COLUMN IF NOT EXISTS time_waster TEXT,               -- Step 12: What's killing your potential
ADD COLUMN IF NOT EXISTS success_metric TEXT,            -- Step 29: Measurable success indicator
ADD COLUMN IF NOT EXISTS transformation_date TEXT,       -- Step 30: Target transformation date
ADD COLUMN IF NOT EXISTS streak_target TEXT,             -- Step 33: Target streak duration
ADD COLUMN IF NOT EXISTS failure_threshold TEXT,         -- Step 39: Failures before escalation
ADD COLUMN IF NOT EXISTS contract_seal BOOLEAN,          -- Step 43: Long press commitment seal
ADD COLUMN IF NOT EXISTS first_action TEXT;              -- Step 46: First action after onboarding

-- Add detailed comments explaining each field from step definitions
COMMENT ON COLUMN identity.disappointment_check IS 'Step 15: Who is most disappointed in you (choice field) - emotional leverage';
COMMENT ON COLUMN identity.procrastination_now IS 'Step 10: What are you procrastinating on RIGHT NOW (voice field) - immediate accountability';
COMMENT ON COLUMN identity.sabotage_pattern IS 'Step 22: How do you sabotage yourself when succeeding (voice field) - self-destruction patterns';
COMMENT ON COLUMN identity.time_waster IS 'Step 12: What is killing your potential (choice field) - biggest distraction';
COMMENT ON COLUMN identity.success_metric IS 'Step 29: Measurable success indicator (text field) - concrete goal';
COMMENT ON COLUMN identity.transformation_date IS 'Step 30: Target date for transformation (text field) - deadline pressure';
COMMENT ON COLUMN identity.streak_target IS 'Step 33: Target streak duration (text field) - consistency goal';
COMMENT ON COLUMN identity.failure_threshold IS 'Step 39: Failures before escalation (choice field) - tolerance limit';
COMMENT ON COLUMN identity.contract_seal IS 'Step 43: Long press commitment completed (boolean field) - binding ceremony';
COMMENT ON COLUMN identity.first_action IS 'Step 46: First action after onboarding (text field) - immediate next step';

-- Verify migration completed successfully
-- Run this query to check all new fields exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns  
-- WHERE table_name = 'identity'
-- AND column_name IN ('disappointment_check', 'procrastination_now', 'sabotage_pattern', 'time_waster', 'success_metric', 'transformation_date', 'streak_target', 'failure_threshold', 'contract_seal', 'first_action')
-- ORDER BY column_name;