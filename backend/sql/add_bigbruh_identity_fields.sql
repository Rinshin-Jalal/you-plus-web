-- =====================================================
-- BIGBRUH Identity Table Migration: Complete Overhaul
-- =====================================================
-- Adds essential psychological profile fields for BIGBRUH 46-step system (including dual sliders)
-- Removes redundant legacy fields no longer needed
-- Preserves core identity functionality and call system requirements

-- STEP 1: Add NEW BIGBRUH Psychological Profile Fields
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS current_struggle TEXT,
ADD COLUMN IF NOT EXISTS nightmare_self TEXT,
ADD COLUMN IF NOT EXISTS empty_excuse TEXT,
ADD COLUMN IF NOT EXISTS success_legacy TEXT,
ADD COLUMN IF NOT EXISTS betrayal_cost TEXT;

-- STEP 1B: Add Motivation Assessment Fields (for dual sliders)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS motivation_fear_intensity INTEGER,
ADD COLUMN IF NOT EXISTS motivation_desire_intensity INTEGER;

-- STEP 2: Add comments to document the psychological meaning
COMMENT ON COLUMN identity.current_struggle IS 'Core struggle they are facing right now - from voice commitment step';
COMMENT ON COLUMN identity.nightmare_self IS 'Fear version of who they might become if they fail - nightmare scenario';
COMMENT ON COLUMN identity.empty_excuse IS 'Their most common empty excuse pattern - biggest lie they tell themselves';
COMMENT ON COLUMN identity.success_legacy IS 'What success would mean for their personal legacy - success memory';
COMMENT ON COLUMN identity.betrayal_cost IS 'The cost of breaking their commitment - betrayal consequences';
COMMENT ON COLUMN identity.motivation_fear_intensity IS 'How much fear of failing motivates them (1-10 scale) - from dual sliders step';
COMMENT ON COLUMN identity.motivation_desire_intensity IS 'How much desire to win motivates them (1-10 scale) - from dual sliders step';

-- STEP 3: REMOVE LEGACY FIELDS no longer needed for BIGBRUH system
-- These fields have been replaced by BIGBRUH-specific mappings or are unused
ALTER TABLE identity
DROP COLUMN IF EXISTS single_truth_user_hides,  -- Now current_struggle
DROP COLUMN IF EXISTS fear_version_of_self,     -- Now nightmare_self
DROP COLUMN IF EXISTS fear_confirmed,           -- Not used in BIGBRUH
DROP COLUMN IF EXISTS most_common_slip_moment,  -- Not directly mapped
DROP COLUMN IF EXISTS derail_trigger,           -- Not directly mapped
DROP COLUMN IF EXISTS time_wasting,             -- Mapped to choice field
DROP COLUMN IF EXISTS procrastination,          -- Not directly used
DROP COLUMN IF EXISTS last_excuse,              -- Now empty_excuse
DROP COLUMN IF EXISTS near_term_missed_opportunity, -- Not used
DROP COLUMN IF EXISTS tomorrow_risk_plan,       -- Not used
DROP COLUMN IF EXISTS identity_oath;            -- Mapped to final_oath

-- STEP 4: Verify migration completed successfully
-- Run these queries to check the migration results:

-- Check all identity table columns:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'identity'
-- ORDER BY column_name;

-- Verify new BIGBRUH fields exist:
-- SELECT
--   'current_struggle' as field,
--   CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'current_struggle') THEN 'EXISTS' ELSE 'MISSING' END as status
-- UNION ALL
-- SELECT 'nightmare_self', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'nightmare_self') THEN 'EXISTS' ELSE 'MISSING' END
-- UNION ALL
-- SELECT 'empty_excuse', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'empty_excuse') THEN 'EXISTS' ELSE 'MISSING' END
-- UNION ALL
-- SELECT 'success_legacy', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'success_legacy') THEN 'EXISTS' ELSE 'MISSING' END
-- UNION ALL
-- SELECT 'betrayal_cost', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'betrayal_cost') THEN 'EXISTS' ELSE 'MISSING' END
-- UNION ALL
-- SELECT 'motivation_fear_intensity', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'motivation_fear_intensity') THEN 'EXISTS' ELSE 'MISSING' END
-- UNION ALL
-- SELECT 'motivation_desire_intensity', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'identity' AND column_name = 'motivation_desire_intensity') THEN 'EXISTS' ELSE 'MISSING' END;
