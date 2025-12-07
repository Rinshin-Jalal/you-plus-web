-- ============================================================================
-- Migration 010: Dynamic Pillars System
-- ============================================================================
-- 
-- Removes the hardcoded body/mission/stack/tribe constraints.
-- Users can now select from 18+ preset pillars or create custom ones.
--
-- Changes:
--   1. Remove CHECK constraint on future_self.primary_pillar
--   2. Remove CHECK constraint on future_self_pillars.pillar
--   3. Add selected_pillars TEXT[] column to future_self
--   4. Remove UNIQUE constraint on (user_id, pillar) - users can have any pillars
--
-- ============================================================================

-- ============================================================================
-- 1. DROP CHECK CONSTRAINTS
-- ============================================================================

-- Remove the primary_pillar CHECK constraint from future_self
ALTER TABLE future_self 
DROP CONSTRAINT IF EXISTS future_self_primary_pillar_check;

-- Remove the pillar CHECK constraint from future_self_pillars
ALTER TABLE future_self_pillars 
DROP CONSTRAINT IF EXISTS future_self_pillars_pillar_check;

-- Also try alternate constraint names (PostgreSQL sometimes auto-names them differently)
DO $$
BEGIN
  -- Try to drop any check constraint on primary_pillar
  EXECUTE (
    SELECT 'ALTER TABLE future_self DROP CONSTRAINT ' || quote_ident(conname)
    FROM pg_constraint 
    WHERE conrelid = 'future_self'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%primary_pillar%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No check constraint found on future_self.primary_pillar';
END $$;

DO $$
BEGIN
  -- Try to drop any check constraint on pillar
  EXECUTE (
    SELECT 'ALTER TABLE future_self_pillars DROP CONSTRAINT ' || quote_ident(conname)
    FROM pg_constraint 
    WHERE conrelid = 'future_self_pillars'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%pillar%'
    AND pg_get_constraintdef(oid) LIKE '%body%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No check constraint found on future_self_pillars.pillar';
END $$;

-- ============================================================================
-- 2. ADD SELECTED_PILLARS COLUMN
-- ============================================================================

-- Add selected_pillars array to store which pillars user chose during onboarding
ALTER TABLE future_self 
ADD COLUMN IF NOT EXISTS selected_pillars TEXT[] DEFAULT '{}';

-- ============================================================================
-- 3. UPDATE UNIQUE CONSTRAINT
-- ============================================================================

-- Drop the old unique constraint that limited to one pillar per type
ALTER TABLE future_self_pillars 
DROP CONSTRAINT IF EXISTS future_self_pillars_user_id_pillar_key;

-- Add new unique constraint that just prevents duplicate pillar IDs for a user
-- (same pillar ID can't be added twice for the same user)
ALTER TABLE future_self_pillars 
ADD CONSTRAINT future_self_pillars_user_pillar_unique UNIQUE (user_id, pillar);

-- ============================================================================
-- 4. MIGRATE EXISTING DATA
-- ============================================================================

-- For existing users, populate selected_pillars based on their existing pillars
UPDATE future_self fs
SET selected_pillars = (
  SELECT ARRAY_AGG(pillar ORDER BY max_priority DESC)
  FROM (
    SELECT pillar, MAX(priority) AS max_priority
    FROM future_self_pillars
    WHERE user_id = fs.user_id
      AND status = 'active'
    GROUP BY pillar
  ) deduped
)
WHERE selected_pillars IS NULL OR selected_pillars = '{}';

-- ============================================================================
-- 5. ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN future_self.selected_pillars IS 'Array of pillar IDs the user selected during onboarding. Can be preset IDs (health, career, finances) or custom IDs (custom_gaming_less).';
COMMENT ON COLUMN future_self.primary_pillar IS 'The primary pillar ID the user wants to focus on. No longer constrained to body/mission/stack/tribe.';
COMMENT ON COLUMN future_self_pillars.pillar IS 'The pillar type ID. Can be any string: preset IDs (health, career, finances, etc.) or custom IDs (custom_xyz).';

-- ============================================================================
-- 6. UPDATE FUNCTIONS
-- ============================================================================

-- Update get_call_focus_pillars to work with any pillar type
CREATE OR REPLACE FUNCTION get_call_focus_pillars(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS TABLE (
  pillar_id uuid,
  pillar text,
  identity_statement text,
  non_negotiable text,
  priority integer,
  trust_score integer,
  days_since_checked integer,
  consecutive_broken integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fsp.id as pillar_id,
    fsp.pillar,
    fsp.identity_statement,
    fsp.non_negotiable,
    fsp.priority,
    fsp.trust_score,
    COALESCE(
      EXTRACT(DAY FROM now() - fsp.last_checked_at)::integer,
      999
    ) as days_since_checked,
    fsp.consecutive_broken
  FROM future_self_pillars fsp
  WHERE fsp.user_id = p_user_id AND fsp.status = 'active'
  ORDER BY 
    -- Priority 1: Pillars with broken streaks (need attention)
    fsp.consecutive_broken DESC,
    -- Priority 2: Pillars not checked recently
    COALESCE(EXTRACT(DAY FROM now() - fsp.last_checked_at), 999) DESC,
    -- Priority 3: Lowest trust score (struggling)
    fsp.trust_score ASC,
    -- Priority 4: User-set priority
    fsp.priority DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- 
-- BEFORE: 
--   - primary_pillar CHECK (primary_pillar IN ('body', 'mission', 'stack', 'tribe'))
--   - pillar CHECK (pillar IN ('body', 'mission', 'stack', 'tribe'))
--
-- AFTER:
--   - primary_pillar TEXT (any string)
--   - pillar TEXT (any string)
--   - selected_pillars TEXT[] (array of pillar IDs)
--
-- PRESET PILLAR IDS:
--   health, mental_health, career, business, side_project, academics, 
--   learning, finances, relationships, family, social, creativity,
--   content, habits, productivity, addiction, spirituality, purpose
--
-- CUSTOM PILLAR IDS:
--   Format: custom_{user_defined_name} (e.g., custom_gaming_less)
--
-- ============================================================================
