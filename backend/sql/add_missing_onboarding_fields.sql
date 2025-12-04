-- =====================================================
-- Add Missing Onboarding Fields to Identity Table
-- =====================================================
-- Adds the 10 missing fields needed for complete onboarding data extraction
-- These fields cannot be consolidated as they have distinct psychological meanings

-- Add the 10 missing BIGBRUH onboarding fields to Identity table
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS current_disappointment TEXT,    -- Step 14: who's disappointed NOW
ADD COLUMN IF NOT EXISTS current_procrastination TEXT,   -- Step 10: what they're procrastinating on RIGHT NOW
ADD COLUMN IF NOT EXISTS sabotage_patterns TEXT,         -- Step 21: how they sabotage success
ADD COLUMN IF NOT EXISTS primary_time_waster TEXT,       -- Step 11: what's killing their potential
ADD COLUMN IF NOT EXISTS success_metric TEXT,            -- Step 28: measurable success indicator
ADD COLUMN IF NOT EXISTS transformation_date TEXT,       -- Step 29: target transformation date
ADD COLUMN IF NOT EXISTS streak_target TEXT,             -- Step 32: target streak duration
ADD COLUMN IF NOT EXISTS failure_threshold TEXT,         -- Step 38: failures before escalation
ADD COLUMN IF NOT EXISTS contract_seal BOOLEAN,          -- Step 42: long press commitment seal
ADD COLUMN IF NOT EXISTS first_action TEXT;              -- Step 45: first action after onboarding

-- Add detailed comments explaining the psychological purpose of each field
COMMENT ON COLUMN identity.current_disappointment IS 'Step 14: Who is most disappointed in their current behavior (emotional impact anchor)';
COMMENT ON COLUMN identity.current_procrastination IS 'Step 10: What they are procrastinating on RIGHT NOW (immediate accountability target)';
COMMENT ON COLUMN identity.sabotage_patterns IS 'Step 21: How they sabotage themselves when succeeding (self-destruction patterns)';
COMMENT ON COLUMN identity.primary_time_waster IS 'Step 11: Primary time-wasting habit killing their potential (distraction pattern)';
COMMENT ON COLUMN identity.success_metric IS 'Step 28: Measurable success indicator for transformation (concrete goal)';
COMMENT ON COLUMN identity.transformation_date IS 'Step 29: Target date for complete transformation (deadline pressure)';
COMMENT ON COLUMN identity.streak_target IS 'Step 32: Target streak duration to prove change (consistency goal)';
COMMENT ON COLUMN identity.failure_threshold IS 'Step 38: Number of failures before escalation activates (tolerance limit)';
COMMENT ON COLUMN identity.contract_seal IS 'Step 42: Whether they completed the long-press commitment ritual (binding ceremony)';
COMMENT ON COLUMN identity.first_action IS 'Step 45: First action to take after onboarding completion (immediate next step)';

-- Verify migration completed successfully
-- Run this query to check all new fields exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'identity'
-- AND column_name IN ('current_disappointment', 'current_procrastination', 'sabotage_patterns', 'primary_time_waster', 'success_metric', 'transformation_date', 'streak_target', 'failure_threshold', 'contract_seal', 'first_action')
-- ORDER BY column_name;