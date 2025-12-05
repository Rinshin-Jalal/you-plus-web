-- ============================================================================
-- Migration 009: Remove Voice Samples Table & Deprecated Identity Columns
-- ============================================================================
-- 
-- Voice recordings are now stored in Cloudflare R2 with predictable paths:
--   audio/{user_id}/{step_name}.m4a
-- 
-- Examples:
--   audio/abc123/why_it_matters.m4a
--   audio/abc123/cost_of_quitting.m4a
--   audio/abc123/commitment.m4a
--
-- No need to store URLs in the database - they can be constructed on demand.
-- Transcriptions are stored in Supermemory for AI context.
--
-- ============================================================================

-- 1. Drop the voice_samples table (no longer needed)
DROP TABLE IF EXISTS voice_samples CASCADE;

-- 2. Drop deprecated audio URL columns from identity table
ALTER TABLE identity DROP COLUMN IF EXISTS why_it_matters_audio_url;
ALTER TABLE identity DROP COLUMN IF EXISTS cost_of_quitting_audio_url;
ALTER TABLE identity DROP COLUMN IF EXISTS commitment_audio_url;

-- 3. Update table comment
COMMENT ON TABLE identity IS 
'Minimal identity data. Psychological profile is in Supermemory. Voice recordings in Cloudflare R2.';

-- ============================================================================
-- VOICE STORAGE ARCHITECTURE (Post-Migration)
-- ============================================================================
--
-- AUDIO FILES:
--   Location: Cloudflare R2 bucket
--   Path pattern: audio/{user_id}/{step_name}.{extension}
--   Public URL: https://audio.yourbigbruhh.app/audio/{user_id}/{step_name}.m4a
--
-- TRANSCRIPTIONS:
--   Stored in Supermemory as voice_transcript memories
--   Used by agent for psychological context
--
-- VOICE CLONING:
--   Cartesia voice ID stored in identity.cartesia_voice_id
--   Cloned from commitment audio during onboarding
--
-- ============================================================================
