-- =====================================================
-- REMOVE BLOAT TABLES AND COLUMNS
-- =====================================================
-- Super MVP Bloat Elimination Migration
-- Removes deprecated tables and columns that are no longer used
-- Version: 3.0.0-bloat-removal
-- Date: 2025-01-15
-- =====================================================
-- 
-- This migration removes:
-- 1. Deprecated tables (memory_embeddings, brutal_reality, onboarding_response_v3)
-- 2. Deprecated columns from users table (voice_clone_id, voice_reclone_count, schedule_change_count)
-- 3. Deprecated columns from identity_status table (trust_percentage, promises_made_count, promises_broken_count)
--
-- All these features were removed in Super MVP redesign:
-- - Memory embeddings feature dropped (bloat elimination)
-- - Voice cloning removed (no voice cloning in MVP)
-- - Schedule change limits removed (no change limits in MVP)
-- - Trust percentage removed (psychological pressure mechanism removed)
-- - Promise counts removed (simplified tracking - using current_streak_days only)
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: DROP DEPRECATED TABLES
-- =====================================================

-- Drop memory_embeddings table (deprecated in Super MVP)
-- Memory embedding feature removed - no longer storing embeddings
DROP TABLE IF EXISTS memory_embeddings CASCADE;

-- Drop brutal_reality table (deprecated - not used in Super MVP)
DROP TABLE IF EXISTS brutal_reality CASCADE;

-- Drop old onboarding_response_v3 table (deprecated - replaced by identity table)
DROP TABLE IF EXISTS onboarding_response_v3 CASCADE;

-- Note: Old 'onboarding' table might still exist but is kept for backward compatibility
-- If you want to drop it, uncomment below (but verify no data dependencies first):
-- DROP TABLE IF EXISTS onboarding CASCADE;

RAISE NOTICE 'Phase 1 Complete: Deprecated tables dropped';

-- =====================================================
-- PHASE 2: REMOVE DEPRECATED COLUMNS FROM USERS TABLE
-- =====================================================

-- Remove voice cloning columns (voice cloning feature removed in Super MVP)
ALTER TABLE users
DROP COLUMN IF EXISTS voice_clone_id,
DROP COLUMN IF EXISTS voice_reclone_count;

-- Remove schedule change count (no change limits in Super MVP)
ALTER TABLE users
DROP COLUMN IF EXISTS schedule_change_count;

RAISE NOTICE 'Phase 2 Complete: Deprecated columns removed from users table';

-- =====================================================
-- PHASE 3: REMOVE DEPRECATED COLUMNS FROM IDENTITY_STATUS TABLE
-- =====================================================

-- Remove trust_percentage (psychological pressure mechanism removed in Super MVP)
ALTER TABLE identity_status
DROP COLUMN IF EXISTS trust_percentage;

-- Remove promise count columns (simplified tracking - using current_streak_days only)
ALTER TABLE identity_status
DROP COLUMN IF EXISTS promises_made_count,
DROP COLUMN IF EXISTS promises_broken_count;

RAISE NOTICE 'Phase 3 Complete: Deprecated columns removed from identity_status table';

-- =====================================================
-- PHASE 4: VERIFICATION
-- =====================================================

DO $$
DECLARE
    bloat_table_count INTEGER;
    users_bloat_column_count INTEGER;
    identity_status_bloat_column_count INTEGER;
BEGIN
    -- Verify bloat tables are dropped
    SELECT COUNT(*) INTO bloat_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('memory_embeddings', 'brutal_reality', 'onboarding_response_v3');

    IF bloat_table_count > 0 THEN
        RAISE WARNING 'Some bloat tables still exist! Count: %', bloat_table_count;
    ELSE
        RAISE NOTICE '✅ All bloat tables successfully dropped';
    END IF;

    -- Verify deprecated columns removed from users table
    SELECT COUNT(*) INTO users_bloat_column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN ('voice_clone_id', 'voice_reclone_count', 'schedule_change_count');

    IF users_bloat_column_count > 0 THEN
        RAISE WARNING 'Some deprecated columns still exist in users table! Count: %', users_bloat_column_count;
    ELSE
        RAISE NOTICE '✅ All deprecated columns removed from users table';
    END IF;

    -- Verify deprecated columns removed from identity_status table
    SELECT COUNT(*) INTO identity_status_bloat_column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'identity_status'
    AND column_name IN ('trust_percentage', 'promises_made_count', 'promises_broken_count');

    IF identity_status_bloat_column_count > 0 THEN
        RAISE WARNING 'Some deprecated columns still exist in identity_status table! Count: %', identity_status_bloat_column_count;
    ELSE
        RAISE NOTICE '✅ All deprecated columns removed from identity_status table';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ BLOAT REMOVAL MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   - 3 deprecated tables dropped';
    RAISE NOTICE '   - 3 deprecated columns removed from users';
    RAISE NOTICE '   - 3 deprecated columns removed from identity_status';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =====================================================

-- Run these after migration to verify success:

-- 1. Verify bloat tables are gone
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('memory_embeddings', 'brutal_reality', 'onboarding_response_v3');
-- -- Should return 0 rows

-- 2. Check users table columns (should NOT have voice_clone_id, voice_reclone_count, schedule_change_count)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'users'
-- AND column_name IN ('voice_clone_id', 'voice_reclone_count', 'schedule_change_count');
-- -- Should return 0 rows

-- 3. Check identity_status table columns (should NOT have trust_percentage, promises_made_count, promises_broken_count)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'identity_status'
-- AND column_name IN ('trust_percentage', 'promises_made_count', 'promises_broken_count');
-- -- Should return 0 rows

-- 4. Verify identity_status still has essential columns
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'identity_status'
-- ORDER BY ordinal_position;
-- -- Should show: id, user_id, current_streak_days, total_calls_completed, last_call_at, created_at, updated_at

