-- ============================================================================
-- Migration 006: Simplify Identity Table for Supermemory Integration
-- ============================================================================
-- 
-- This migration prepares the identity table for Supermemory integration.
-- Psychological data will be stored in Supermemory, not in the database.
--
-- WHAT STAYS in identity table:
--   - daily_commitment (scheduling - Supermemory can't schedule calls)
--   - call_time (scheduling)
--   - cartesia_voice_id (voice cloning reference)
--   - supermemory_container_id (links to Supermemory)
--
-- WHAT MOVES to Supermemory:
--   - All onboarding_context JSONB data (goal, fears, excuses, etc.)
--   - Will be handled by migration script after Supermemory service is ready
--
-- WHAT MOVES to voice_samples table:
--   - why_it_matters_audio_url
--   - cost_of_quitting_audio_url
--   - commitment_audio_url
--
-- ============================================================================

-- 1. Add Supermemory container reference
ALTER TABLE identity 
ADD COLUMN IF NOT EXISTS supermemory_container_id text;

-- 2. Add timezone column (useful for call scheduling)
ALTER TABLE identity 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';

-- 3. For existing users, set supermemory_container_id to user_id
-- (We use user_id as the container tag in Supermemory)
UPDATE identity 
SET supermemory_container_id = user_id::text
WHERE supermemory_container_id IS NULL;

-- 4. Add comment explaining the new architecture
COMMENT ON TABLE identity IS 
'Minimal identity data. Psychological profile is in Supermemory. Voice samples in voice_samples table.';

COMMENT ON COLUMN identity.supermemory_container_id IS 
'Container tag in Supermemory. Usually equals user_id. All user memories are grouped by this.';

COMMENT ON COLUMN identity.onboarding_context IS 
'DEPRECATED: Will be removed after migration to Supermemory. Do not use in new code.';

-- ============================================================================
-- NOTE: The following columns will be dropped AFTER:
--   1. All existing users are migrated to Supermemory (Task 03)
--   2. Voice samples are migrated to voice_samples table (Migration 007)
--   3. Agent is confirmed working with Supermemory (Task 04)
--   4. 7 days of successful operation
--
-- DO NOT RUN THESE YET:
-- ALTER TABLE identity DROP COLUMN IF EXISTS onboarding_context;
-- ALTER TABLE identity DROP COLUMN IF EXISTS why_it_matters_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS cost_of_quitting_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS commitment_audio_url;
-- ALTER TABLE identity DROP COLUMN IF EXISTS name;  -- Already in users table
-- ============================================================================
