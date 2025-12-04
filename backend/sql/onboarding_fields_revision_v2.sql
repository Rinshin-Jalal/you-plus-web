/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🔄 BIGBRUH ONBOARDING FIELDS REVISION V2 - Database Migration
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE: Update identity table to support new onboarding fields from 45-step revision
 *
 * CHANGES SUMMARY:
 * - Remove 4 old deprecated fields
 * - Add 8 new psychological profile fields
 * - Modify 2 existing fields with better names
 *
 * FIELDS REMOVED (4):
 * 1. morning_failure         → Replaced with physical_disgust_trigger
 * 2. commitment_time         → Removed (redundant with daily_non_negotiable)
 * 3. sabotage_pattern        → Replaced with financial_consequence (different angle)
 * 4. transformation_date     → Replaced with urgency_mortality
 *
 * FIELDS ADDED (8):
 * 1. physical_disgust_trigger   (TEXT) - Step 16: Physical self-confrontation
 * 2. daily_time_audit          (TEXT) - Step 18: Hour-by-hour reality check
 * 3. financial_consequence     (TEXT) - Step 22: Money lost to excuses
 * 4. intellectual_excuse       (TEXT) - Step 23: Smart-sounding BS excuse
 * 5. parental_sacrifice        (TEXT) - Step 24: Family guilt leverage
 * 6. breaking_point            (TEXT) - Step 31: What would force change
 * 7. urgency_mortality         (TEXT) - Step 35: 10 years left perspective
 * 8. emotional_quit_trigger    (TEXT) - Step 36: Which emotion causes quit
 * 9. accountability_graveyard  (TEXT) - Step 34: # of systems already abandoned
 * 10. relationship_damage      (TEXT) - Step 15: Who stopped believing
 *
 * BACKWARD COMPATIBILITY:
 * - Old fields are kept as nullable for existing users
 * - New users will have new field structure
 * - AI extraction logic updated to use new fields
 * ════════════════════════════════════════════════════════════════════════════════
 */

-- ════════════════════════════════════════════════════════════════════════════════
-- STEP 1: ADD NEW FIELDS TO IDENTITY TABLE
-- ════════════════════════════════════════════════════════════════════════════════

-- Step 15: Relationship damage (who stopped believing)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS relationship_damage TEXT;

COMMENT ON COLUMN identity.relationship_damage IS
'Step 15: Who STOPPED BELIEVING in you? When did you notice they gave up? (Voice response)';

-- Step 16: Physical disgust trigger (mirror confrontation)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS physical_disgust_trigger TEXT;

COMMENT ON COLUMN identity.physical_disgust_trigger IS
'Step 16: Look in the MIRROR right now. What do you see that disgusts you? (Voice response)';

-- Step 18: Daily time audit (hour-by-hour reality)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS daily_time_audit TEXT;

COMMENT ON COLUMN identity.daily_time_audit IS
'Step 18: Describe YESTERDAY hour by hour. Where did your time actually go? (Voice response)';

-- Step 22: Financial consequence (money not made)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS financial_consequence TEXT;

COMMENT ON COLUMN identity.financial_consequence IS
'Step 22: How much MONEY have you NOT MADE because of your excuses this year? (Voice response)';

-- Step 23: Intellectual excuse (smart-sounding BS)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS intellectual_excuse TEXT;

COMMENT ON COLUMN identity.intellectual_excuse IS
'Step 23: What excuse makes YOU sound smart but is still complete bullshit? (Voice response)';

-- Step 24: Parental sacrifice (family guilt)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS parental_sacrifice TEXT;

COMMENT ON COLUMN identity.parental_sacrifice IS
'Step 24: What did your PARENTS SACRIFICE for you that you''re wasting? (Voice response)';

-- Step 31: Breaking point (what would force change)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS breaking_point TEXT;

COMMENT ON COLUMN identity.breaking_point IS
'Step 31: What would have to HAPPEN for you to actually change? Not hope. What EVENT? (Voice response)';

-- Step 34: Accountability graveyard (systems abandoned)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS accountability_graveyard TEXT;

COMMENT ON COLUMN identity.accountability_graveyard IS
'Step 34: How many accountability apps/coaches/systems have you ALREADY QUIT? (Text response)';

-- Step 35: Urgency/mortality (10 years left)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS urgency_mortality TEXT;

COMMENT ON COLUMN identity.urgency_mortality IS
'Step 35: You have 10 YEARS left to live. What changes TODAY? (Voice response)';

-- Step 36: Emotional quit trigger (which emotion causes quit)
ALTER TABLE identity
ADD COLUMN IF NOT EXISTS emotional_quit_trigger TEXT;

COMMENT ON COLUMN identity.emotional_quit_trigger IS
'Step 36: What EMOTION makes you quit? (Choice: Boredom/Frustration/Fear/Anxiety/Loneliness/Anger)';

-- ════════════════════════════════════════════════════════════════════════════════
-- STEP 2: MARK OLD FIELDS AS DEPRECATED (Keep for backward compatibility)
-- ════════════════════════════════════════════════════════════════════════════════

-- Note: We're keeping old fields for now to maintain backward compatibility
-- They will be deprecated in future versions

COMMENT ON COLUMN identity.morning_failure IS
'DEPRECATED: Replaced with physical_disgust_trigger. Will be removed in future version.';

COMMENT ON COLUMN identity.sabotage_pattern IS
'DEPRECATED: Replaced with financial_consequence (different angle). Will be removed in future version.';

COMMENT ON COLUMN identity.transformation_target_date IS
'DEPRECATED: Replaced with urgency_mortality. Will be removed in future version.';

-- ════════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE INDEXES FOR PERFORMANCE (Optional but recommended)
-- ════════════════════════════════════════════════════════════════════════════════

-- Index on user_id for fast lookups (should already exist)
CREATE INDEX IF NOT EXISTS idx_identity_user_id ON identity(user_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- STEP 4: VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Run these queries after migration to verify success:

-- Check if all new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'identity'
  AND column_name IN (
    'relationship_damage',
    'physical_disgust_trigger',
    'daily_time_audit',
    'financial_consequence',
    'intellectual_excuse',
    'parental_sacrifice',
    'breaking_point',
    'accountability_graveyard',
    'urgency_mortality',
    'emotional_quit_trigger'
  )
ORDER BY column_name;

-- Check column comments
SELECT
  c.column_name,
  pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns c ON (
  pgd.objsubid = c.ordinal_position
  AND c.table_schema = st.schemaname
  AND c.table_name = st.relname
)
WHERE c.table_name = 'identity'
  AND c.column_name IN (
    'relationship_damage',
    'physical_disgust_trigger',
    'daily_time_audit',
    'financial_consequence',
    'intellectual_excuse',
    'parental_sacrifice',
    'breaking_point',
    'accountability_graveyard',
    'urgency_mortality',
    'emotional_quit_trigger'
  );

-- ════════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ════════════════════════════════════════════════════════════════════════════════

-- Next steps:
-- 1. Update backend TypeScript types (types/database.ts)
-- 2. Update identity extraction logic to map new fields
-- 3. Update prompt engine to use new fields
-- 4. Update Swift app to send new field data
-- 5. Test end-to-end onboarding flow

-- Rollback instructions (if needed):
-- ALTER TABLE identity DROP COLUMN IF EXISTS relationship_damage;
-- ALTER TABLE identity DROP COLUMN IF EXISTS physical_disgust_trigger;
-- ALTER TABLE identity DROP COLUMN IF EXISTS daily_time_audit;
-- ALTER TABLE identity DROP COLUMN IF EXISTS financial_consequence;
-- ALTER TABLE identity DROP COLUMN IF EXISTS intellectual_excuse;
-- ALTER TABLE identity DROP COLUMN IF EXISTS parental_sacrifice;
-- ALTER TABLE identity DROP COLUMN IF EXISTS breaking_point;
-- ALTER TABLE identity DROP COLUMN IF EXISTS accountability_graveyard;
-- ALTER TABLE identity DROP COLUMN IF EXISTS urgency_mortality;
-- ALTER TABLE identity DROP COLUMN IF EXISTS emotional_quit_trigger;
