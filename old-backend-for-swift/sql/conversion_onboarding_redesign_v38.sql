-- =====================================================
-- CONVERSION ONBOARDING REDESIGN (38 STEPS)
-- =====================================================
-- Adds support for new conversion-optimized onboarding flow
-- Version: 4.0.0-conversion-redesign
-- Date: 2025-01-16
-- =====================================================
--
-- This migration adds:
-- 1. Indexes on new demographic JSONB fields for analytics
-- 2. Indexes on new conversion tracking fields
-- 3. Comments documenting the new onboarding_context schema
--
-- New fields in onboarding_context JSONB:
-- - Demographics: age, gender, location, acquisition_source
-- - Conversion tracking: demo_call_rating, voice_clone_id
-- - Pattern recognition: biggest_obstacle, how_did_quit, quit_pattern
-- - Emotional tracking: success_vision, what_spent, biggest_fear
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: ADD COMMENTS TO IDENTITY TABLE
-- =====================================================

COMMENT ON COLUMN identity.onboarding_context IS
'JSONB context from 38-step conversion onboarding. Expected fields:
  Identity & Aspiration:
    - goal (string): User''s main goal
    - goal_deadline (string): ISO date deadline
    - motivation_level (number): 1-10 slider value

  Pattern Recognition:
    - attempt_count (number): Times tried before
    - who_disappointed (string): Choice input
    - biggest_obstacle (string): Choice input
    - how_did_quit (string): Choice input
    - quit_pattern (string): Choice input
    - favorite_excuse (string): Choice input

  Demographics (NEW):
    - age (number): 13-100
    - gender (string): Male/Female/Non-binary/Prefer not to say
    - location (string): Optional city/country
    - acquisition_source (string): App Store/Friend/Social Media/etc

  The Cost:
    - success_vision (string): What success looks like
    - future_if_no_change (string): Choice input
    - what_spent (string): Multi-select CSV
    - biggest_fear (string): Choice input

  Conversion Tracking (NEW):
    - demo_call_rating (number): 1-5 stars
    - voice_clone_id (string): Cloned voice ID from step 24

  Commitment:
    - witness (string): Optional accountability partner
    - will_do_this (boolean): Final decision

  Permissions:
    - permissions.notifications (boolean)
    - permissions.calls (boolean)

  Metadata:
    - completed_at (string): ISO timestamp
    - time_spent_minutes (number): Total onboarding time';

RAISE NOTICE 'Phase 1 Complete: Comments added to identity table';

-- =====================================================
-- PHASE 2: CREATE GIN INDEXES FOR ANALYTICS QUERIES
-- =====================================================

-- Index for demographic analytics (age queries)
-- Example: Find users aged 25-35 for cohort analysis
CREATE INDEX IF NOT EXISTS idx_identity_context_age
ON identity USING GIN ((onboarding_context -> 'age'))
WHERE onboarding_context ? 'age';

-- Index for gender-based analytics
-- Example: Analyze conversion rates by gender
CREATE INDEX IF NOT EXISTS idx_identity_context_gender
ON identity USING GIN ((onboarding_context -> 'gender'))
WHERE onboarding_context ? 'gender';

-- Index for acquisition source tracking
-- Example: Calculate ROI by acquisition channel
CREATE INDEX IF NOT EXISTS idx_identity_context_acquisition
ON identity USING GIN ((onboarding_context -> 'acquisition_source'))
WHERE onboarding_context ? 'acquisition_source';

-- Index for demo call rating correlation
-- Example: Find correlation between demo rating and conversion
CREATE INDEX IF NOT EXISTS idx_identity_context_demo_rating
ON identity USING GIN ((onboarding_context -> 'demo_call_rating'))
WHERE onboarding_context ? 'demo_call_rating';

-- Index for motivation level analysis
-- Example: Analyze conversion rates by motivation level
CREATE INDEX IF NOT EXISTS idx_identity_context_motivation
ON identity USING GIN ((onboarding_context -> 'motivation_level'))
WHERE onboarding_context ? 'motivation_level';

-- Composite index for multi-dimensional analytics
-- Example: Analyze age + gender + acquisition source together
CREATE INDEX IF NOT EXISTS idx_identity_context_demographics
ON identity USING GIN (onboarding_context jsonb_path_ops);

RAISE NOTICE 'Phase 2 Complete: GIN indexes created for analytics';

-- =====================================================
-- PHASE 3: VERIFICATION
-- =====================================================

DO $$
DECLARE
    index_count INTEGER;
    comment_exists BOOLEAN;
BEGIN
    -- Verify indexes were created
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'identity'
    AND indexname IN (
        'idx_identity_context_age',
        'idx_identity_context_gender',
        'idx_identity_context_acquisition',
        'idx_identity_context_demo_rating',
        'idx_identity_context_motivation',
        'idx_identity_context_demographics'
    );

    IF index_count < 6 THEN
        RAISE WARNING 'Not all indexes created! Expected 6, found: %', index_count;
    ELSE
        RAISE NOTICE '✅ All 6 analytics indexes created successfully';
    END IF;

    -- Verify comment was added
    SELECT EXISTS (
        SELECT 1
        FROM pg_description d
        JOIN pg_class c ON c.oid = d.objoid
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.objsubid
        WHERE c.relname = 'identity'
        AND a.attname = 'onboarding_context'
    ) INTO comment_exists;

    IF comment_exists THEN
        RAISE NOTICE '✅ Comment added to onboarding_context column';
    ELSE
        RAISE WARNING 'Comment not found on onboarding_context column';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CONVERSION REDESIGN MIGRATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   - 6 GIN indexes created for analytics';
    RAISE NOTICE '   - Column comments added';
    RAISE NOTICE '   - Ready for 38-step onboarding flow';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'New analytics capabilities:';
    RAISE NOTICE '   - Demographic segmentation (age, gender, location)';
    RAISE NOTICE '   - Acquisition source tracking';
    RAISE NOTICE '   - Demo call rating correlation';
    RAISE NOTICE '   - Motivation level analysis';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION ANALYTICS QUERIES
-- =====================================================

-- Run these after migration to test analytics capabilities:

-- 1. Count users by age group
-- SELECT
--     CASE
--         WHEN (onboarding_context->>'age')::int BETWEEN 13 AND 24 THEN '13-24'
--         WHEN (onboarding_context->>'age')::int BETWEEN 25 AND 34 THEN '25-34'
--         WHEN (onboarding_context->>'age')::int BETWEEN 35 AND 44 THEN '35-44'
--         WHEN (onboarding_context->>'age')::int BETWEEN 45 AND 54 THEN '45-54'
--         WHEN (onboarding_context->>'age')::int >= 55 THEN '55+'
--     END as age_group,
--     COUNT(*) as user_count
-- FROM identity
-- WHERE onboarding_context ? 'age'
-- GROUP BY age_group
-- ORDER BY age_group;

-- 2. Conversion rate by gender
-- SELECT
--     onboarding_context->>'gender' as gender,
--     COUNT(*) as total_users,
--     AVG((onboarding_context->>'motivation_level')::int) as avg_motivation
-- FROM identity
-- WHERE onboarding_context ? 'gender'
-- GROUP BY gender
-- ORDER BY total_users DESC;

-- 3. Acquisition source effectiveness
-- SELECT
--     onboarding_context->>'acquisition_source' as source,
--     COUNT(*) as user_count,
--     AVG((onboarding_context->>'demo_call_rating')::int) as avg_demo_rating,
--     COUNT(*) FILTER (WHERE onboarding_context->>'will_do_this' = 'true') as committed_users
-- FROM identity
-- WHERE onboarding_context ? 'acquisition_source'
-- GROUP BY source
-- ORDER BY user_count DESC;

-- 4. Demo call rating correlation with commitment
-- SELECT
--     (onboarding_context->>'demo_call_rating')::int as rating,
--     COUNT(*) as total_users,
--     COUNT(*) FILTER (WHERE onboarding_context->>'will_do_this' = 'true') as committed,
--     ROUND(
--         100.0 * COUNT(*) FILTER (WHERE onboarding_context->>'will_do_this' = 'true') / COUNT(*),
--         2
--     ) as commitment_rate_percent
-- FROM identity
-- WHERE onboarding_context ? 'demo_call_rating'
-- GROUP BY rating
-- ORDER BY rating DESC;

-- 5. Most common obstacles by age group
-- SELECT
--     CASE
--         WHEN (onboarding_context->>'age')::int BETWEEN 13 AND 24 THEN '13-24'
--         WHEN (onboarding_context->>'age')::int BETWEEN 25 AND 34 THEN '25-34'
--         WHEN (onboarding_context->>'age')::int BETWEEN 35 AND 44 THEN '35-44'
--         WHEN (onboarding_context->>'age')::int >= 45 THEN '45+'
--     END as age_group,
--     onboarding_context->>'biggest_obstacle' as obstacle,
--     COUNT(*) as user_count
-- FROM identity
-- WHERE onboarding_context ? 'age' AND onboarding_context ? 'biggest_obstacle'
-- GROUP BY age_group, obstacle
-- ORDER BY age_group, user_count DESC;

-- 6. Motivation level distribution
-- SELECT
--     (onboarding_context->>'motivation_level')::int as motivation,
--     COUNT(*) as user_count,
--     ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
-- FROM identity
-- WHERE onboarding_context ? 'motivation_level'
-- GROUP BY motivation
-- ORDER BY motivation DESC;

-- 7. Time spent in onboarding by conversion status
-- SELECT
--     CASE
--         WHEN onboarding_context->>'will_do_this' = 'true' THEN 'Committed'
--         ELSE 'Not Committed'
--     END as status,
--     AVG((onboarding_context->>'time_spent_minutes')::numeric) as avg_minutes,
--     COUNT(*) as user_count
-- FROM identity
-- WHERE onboarding_context ? 'time_spent_minutes'
-- GROUP BY status;

-- 8. Voice clone success tracking
-- SELECT
--     COUNT(*) as total_users,
--     COUNT(*) FILTER (WHERE onboarding_context ? 'voice_clone_id') as users_with_clone,
--     ROUND(
--         100.0 * COUNT(*) FILTER (WHERE onboarding_context ? 'voice_clone_id') / COUNT(*),
--         2
--     ) as clone_success_rate_percent
-- FROM identity;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================

-- To rollback this migration, run:
--
-- BEGIN;
--
-- DROP INDEX IF EXISTS idx_identity_context_age;
-- DROP INDEX IF EXISTS idx_identity_context_gender;
-- DROP INDEX IF EXISTS idx_identity_context_acquisition;
-- DROP INDEX IF EXISTS idx_identity_context_demo_rating;
-- DROP INDEX IF EXISTS idx_identity_context_motivation;
-- DROP INDEX IF EXISTS idx_identity_context_demographics;
--
-- COMMENT ON COLUMN identity.onboarding_context IS NULL;
--
-- COMMIT;
