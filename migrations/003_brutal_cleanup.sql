-- ============================================================================
-- YOU+ BRUTAL DATABASE CLEANUP v3
-- ============================================================================
-- 
-- This migration DELETES everything the agent doesn't use.
-- 
-- WHAT GETS DELETED:
-- - 9 tables (brutal_color_psychology, brutal_reality_reviews, identity_backup_v2,
--   livekit_rooms, livekit_sessions, subscription_history, waitlist, calls, promises)
-- - Unused columns from users, identity, identity_status, call_memory
-- - Unused functions
--
-- WHAT REMAINS (6 tables):
-- - users (slimmed)
-- - identity (slimmed) 
-- - identity_status (with trust_score)
-- - call_memory (slimmed)
-- - call_analytics (per-call data)
-- - excuse_patterns (for callouts)
-- - subscriptions (billing, not agent)
--
-- ⚠️  RUN THIS IN A TRANSACTION - BACKUP FIRST IF PARANOID
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: NO BACKUPS - BRUTAL MODE
-- ============================================================================

-- We're not backing up anything. This is a cleanup.

-- ============================================================================
-- PART 2: DROP FOREIGN KEY CONSTRAINTS (must do before dropping tables)
-- ============================================================================

-- Drop FK from calls to livekit tables
ALTER TABLE IF EXISTS calls DROP CONSTRAINT IF EXISTS calls_livekit_session_id_fkey;
ALTER TABLE IF EXISTS calls DROP CONSTRAINT IF EXISTS calls_livekit_room_sid_fkey;

-- Drop FK from brutal_reality_reviews to auth.users
ALTER TABLE IF EXISTS brutal_reality_reviews DROP CONSTRAINT IF EXISTS brutal_reality_reviews_user_id_fkey;

-- ============================================================================
-- PART 3: DROP DEAD TABLES
-- ============================================================================

-- UI feature tables (not used by agent)
DROP TABLE IF EXISTS brutal_color_psychology CASCADE;
DROP TABLE IF EXISTS brutal_reality_reviews CASCADE;

-- Dead backup table
DROP TABLE IF EXISTS identity_backup_v2 CASCADE;

-- Old infrastructure (now using Cartesia Line SDK)
DROP TABLE IF EXISTS livekit_sessions CASCADE;
DROP TABLE IF EXISTS livekit_rooms CASCADE;

-- Billing history (not needed - subscriptions table is enough)
DROP TABLE IF EXISTS subscription_history CASCADE;

-- Marketing table (not agent)
DROP TABLE IF EXISTS waitlist CASCADE;

-- Old calls table (replaced by call_analytics)
DROP TABLE IF EXISTS calls CASCADE;

-- Old promises table (commitment now in call_analytics)
DROP TABLE IF EXISTS promises CASCADE;

-- ============================================================================
-- PART 4: DROP UNUSED COLUMNS FROM users
-- ============================================================================

-- RevenueCat (not using, future use = delete for now)
ALTER TABLE users DROP COLUMN IF EXISTS revenuecat_customer_id;

-- Duplicate of identity.call_time
ALTER TABLE users DROP COLUMN IF EXISTS call_window_start;
ALTER TABLE users DROP COLUMN IF EXISTS call_window_timezone;

-- Not used by agent
ALTER TABLE users DROP COLUMN IF EXISTS push_token;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;

-- ============================================================================
-- PART 5: DROP UNUSED COLUMNS FROM identity
-- ============================================================================

-- Not used by agent
ALTER TABLE identity DROP COLUMN IF EXISTS chosen_path;
ALTER TABLE identity DROP COLUMN IF EXISTS strike_limit;

-- ============================================================================
-- PART 6: DROP UNUSED COLUMNS FROM identity_status
-- ============================================================================

-- Overkill - just keep current trust_score, not history
ALTER TABLE identity_status DROP COLUMN IF EXISTS trust_score_history;

-- ============================================================================
-- PART 7: DROP UNUSED COLUMNS FROM call_memory
-- ============================================================================

-- Overengineered features we don't need
ALTER TABLE call_memory DROP COLUMN IF EXISTS reveals_unlocked;
ALTER TABLE call_memory DROP COLUMN IF EXISTS active_challenge;
ALTER TABLE call_memory DROP COLUMN IF EXISTS persona_blend;
ALTER TABLE call_memory DROP COLUMN IF EXISTS last_persona_shift_reason;

-- ============================================================================
-- PART 8: ADD MISSING COLUMNS TO call_memory (for commitment tracking)
-- ============================================================================

-- These replace the promises table functionality
ALTER TABLE call_memory ADD COLUMN IF NOT EXISTS last_commitment TEXT;
ALTER TABLE call_memory ADD COLUMN IF NOT EXISTS last_commitment_time TEXT;
ALTER TABLE call_memory ADD COLUMN IF NOT EXISTS last_commitment_specific BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 9: DROP UNUSED FUNCTIONS
-- ============================================================================

-- Will redo persona logic in Python, not SQL
DROP FUNCTION IF EXISTS get_recommended_persona(UUID, BOOLEAN, BOOLEAN, BOOLEAN);

-- ============================================================================
-- PART 10: DROP VIEWS
-- ============================================================================

-- Drop the user_promise_stats view (not needed, can compute on-demand)
DROP VIEW IF EXISTS user_promise_stats;

-- ============================================================================
-- PART 11: UPDATE COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Core user table - auth + billing basics';
COMMENT ON TABLE identity IS 'User identity - name, commitment, voice, psychological profile';
COMMENT ON TABLE identity_status IS 'User progress - streak, trust score, promise stats';
COMMENT ON TABLE call_memory IS 'Narrative memory - quotes, loops, persona, last commitment';
COMMENT ON TABLE call_analytics IS 'Per-call analytics - promise tracking, sentiment, excuses';
COMMENT ON TABLE excuse_patterns IS 'Excuse history for pattern callouts';
COMMENT ON TABLE subscriptions IS 'Billing - subscription status and provider info';

-- ============================================================================
-- PART 12: VERIFY FINAL SCHEMA
-- ============================================================================

-- This query will show what tables remain after cleanup
-- Run manually to verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

COMMIT;

-- ============================================================================
-- FINAL SCHEMA AFTER CLEANUP
-- ============================================================================
--
-- 1. users (7 columns)
--    id, email, name, timezone, subscription_status, 
--    payment_provider, dodo_customer_id, phone_number,
--    onboarding_completed, onboarding_completed_at, created_at, updated_at
--
-- 2. identity (8 columns)
--    id, user_id, name, daily_commitment, call_time,
--    cartesia_voice_id, onboarding_context (JSONB),
--    why_it_matters_audio_url, cost_of_quitting_audio_url, commitment_audio_url,
--    created_at, updated_at
--
-- 3. identity_status (12 columns)
--    id, user_id, current_streak_days, longest_streak_days,
--    total_calls_completed, last_call_at, trust_score,
--    promises_kept_total, promises_broken_total,
--    promises_kept_last_7_days, promises_broken_last_7_days,
--    calls_paused, calls_paused_until, created_at, updated_at
--
-- 4. call_memory (12 columns)
--    id, user_id, memorable_quotes (JSONB), emotional_peaks (JSONB),
--    open_loops (JSONB), last_call_type, call_type_history (JSONB),
--    narrative_arc, last_mood, current_persona, severity_level,
--    last_commitment, last_commitment_time, last_commitment_specific,
--    created_at, updated_at
--
-- 5. call_analytics (13 columns)
--    id, user_id, call_type, mood, call_duration_seconds,
--    call_quality_score, promise_kept, tomorrow_commitment,
--    commitment_time, commitment_is_specific, sentiment_trajectory (JSONB),
--    excuses_detected (JSONB), quotes_captured (JSONB), created_at
--
-- 6. excuse_patterns (9 columns)
--    id, user_id, excuse_text, excuse_pattern, matches_favorite,
--    confidence, streak_day, call_type, was_called_out, created_at
--
-- 7. subscriptions (billing - not agent related)
--
-- BACKUP TABLES (delete after confirming migration works):
-- - _backup_calls
-- - _backup_promises  
-- - _backup_livekit_sessions
-- - _backup_livekit_rooms
--
-- ============================================================================
