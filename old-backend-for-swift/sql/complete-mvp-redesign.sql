-- =====================================================
-- COMPLETE MVP DATABASE REDESIGN
-- Drop bloat, simplify tables, clean architecture
-- =====================================================
-- Version: 2.0.0-super-mvp
-- Date: 2025-11-04
-- Author: Super MVP Redesign - No Bloat, Only Essentials
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: DROP BLOAT TABLES
-- =====================================================

DROP TABLE IF EXISTS brutal_reality CASCADE;
DROP TABLE IF EXISTS memory_embeddings CASCADE;
DROP TABLE IF EXISTS onboarding_response_v3 CASCADE;
DROP TABLE IF EXISTS onboarding CASCADE;  -- Drop old JSONB onboarding

RAISE NOTICE 'Phase 1 Complete: Bloat tables dropped';

-- =====================================================
-- PHASE 2: SIMPLIFY IDENTITY TABLE
-- All onboarding data stored here in concise format
-- =====================================================

-- Drop old complex identity table
DROP TABLE IF EXISTS identity CASCADE;

-- Create super simplified identity table
CREATE TABLE identity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Core identity fields (used in app logic)
    name TEXT NOT NULL,
    daily_commitment TEXT NOT NULL,  -- "30 min coding" or "1 hour gym"
    chosen_path TEXT NOT NULL CHECK (chosen_path IN ('hopeful', 'doubtful')),
    call_time TIME NOT NULL,  -- "20:30" - when to call user
    strike_limit INT NOT NULL CHECK (strike_limit BETWEEN 1 AND 5),

    -- Voice recordings (R2 URLs for AI calls)
    why_it_matters_audio_url TEXT,
    cost_of_quitting_audio_url TEXT,
    commitment_audio_url TEXT,

    -- Everything else from onboarding (context for AI personalization)
    onboarding_context JSONB,
    -- Example JSONB structure:
    -- {
    --   "goal": "Get fit and lose 20 pounds by June 2025",
    --   "motivation_level": 8,
    --   "attempt_history": "Failed 3 times. Last time gave up after 2 weeks.",
    --   "favorite_excuse": "Too busy with work",
    --   "who_disappointed": "My kids and myself",
    --   "quit_pattern": "Usually quits 2 weeks in",
    --   "future_if_no_change": "Overweight, unhappy, watching life pass by",
    --   "witness": "My spouse",
    --   "will_do_this": true,
    --   "permissions": {"notifications": true, "calls": true},
    --   "completed_at": "2025-01-15T10:30:00Z",
    --   "time_spent_minutes": 20
    -- }

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_user_id ON identity(user_id);
CREATE INDEX idx_identity_onboarding_context ON identity USING GIN (onboarding_context);
ALTER TABLE identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identity"
    ON identity FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity"
    ON identity FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identity"
    ON identity FOR UPDATE USING (auth.uid() = user_id);

RAISE NOTICE 'Phase 2 Complete: Identity table simplified (12 columns total)';

-- =====================================================
-- PHASE 3: SIMPLIFY IDENTITY_STATUS TABLE
-- Keep just basic stats
-- =====================================================

-- Drop old status table
DROP TABLE IF EXISTS identity_status CASCADE;

-- Create simplified status table
CREATE TABLE identity_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Basic performance tracking
    current_streak_days INT NOT NULL DEFAULT 0,
    total_calls_completed INT NOT NULL DEFAULT 0,
    last_call_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_status_user_id ON identity_status(user_id);
ALTER TABLE identity_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own status"
    ON identity_status FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own status"
    ON identity_status FOR UPDATE USING (auth.uid() = user_id);

RAISE NOTICE 'Phase 3 Complete: Identity status simplified';

-- =====================================================
-- PHASE 4: SIMPLIFY PROMISES TABLE
-- =====================================================

-- Drop old complex promises table
DROP TABLE IF EXISTS promises CASCADE;

-- Create simplified promises table
CREATE TABLE promises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Promise details
    promise_text TEXT NOT NULL,  -- "I will code for 30 minutes"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE NOT NULL,

    -- Completion tracking
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,

    -- Metadata
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promises_user_id ON promises(user_id);
CREATE INDEX idx_promises_due_date ON promises(due_date);
CREATE INDEX idx_promises_completed ON promises(user_id, completed);
ALTER TABLE promises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promises"
    ON promises FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own promises"
    ON promises FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promises"
    ON promises FOR UPDATE USING (auth.uid() = user_id);

RAISE NOTICE 'Phase 4 Complete: Promises table simplified';

-- =====================================================
-- PHASE 5: CLEAN UP USERS TABLE
-- Remove unnecessary fields, keep MVP only
-- =====================================================

-- Drop unused fields from users table
ALTER TABLE users
DROP COLUMN IF EXISTS voice_clone_id,
DROP COLUMN IF EXISTS schedule_change_count,
DROP COLUMN IF EXISTS voice_reclone_count;

-- Ensure essential fields exist (may already exist)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS call_window_start TIME,
ADD COLUMN IF NOT EXISTS call_window_timezone TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS push_token TEXT;

RAISE NOTICE 'Phase 5 Complete: Users table cleaned up';

-- =====================================================
-- PHASE 6: HELPER FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated_at trigger function (if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_identity_updated_at
    BEFORE UPDATE ON identity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identity_status_updated_at
    BEFORE UPDATE ON identity_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promises_updated_at
    BEFORE UPDATE ON promises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create identity_status when identity is created
CREATE OR REPLACE FUNCTION create_identity_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO identity_status (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_status
    AFTER INSERT ON identity
    FOR EACH ROW
    EXECUTE FUNCTION create_identity_status();

RAISE NOTICE 'Phase 6 Complete: Helper functions and triggers created';

-- =====================================================
-- PHASE 7: VERIFICATION
-- =====================================================

DO $$
DECLARE
    bloat_count INTEGER;
    new_table_count INTEGER;
BEGIN
    -- Verify bloat tables dropped
    SELECT COUNT(*) INTO bloat_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('brutal_reality', 'memory_embeddings', 'onboarding_response_v3', 'onboarding');

    IF bloat_count > 0 THEN
        RAISE EXCEPTION 'Bloat tables still exist!';
    END IF;

    -- Verify new tables created (only 4 core tables)
    SELECT COUNT(*) INTO new_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('identity', 'identity_status', 'promises', 'users');

    IF new_table_count != 4 THEN
        RAISE EXCEPTION 'Not all tables created correctly! Found: % Expected: 4', new_table_count;
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUPER MVP DATABASE REDESIGN COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   - 4 bloat tables dropped';
    RAISE NOTICE '   - identity: 12 columns (core fields + voice URLs + JSONB context)';
    RAISE NOTICE '   - identity_status: 7 columns (3 stats)';
    RAISE NOTICE '   - promises: 8 columns';
    RAISE NOTICE '   - users: cleaned up (MVP fields only)';
    RAISE NOTICE '   - NO conversion_onboarding table (all data in identity)';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- =====================================================

-- Run these after migration to verify success:

-- 1. Check all tables exist with correct column counts
-- SELECT table_name,
--        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public'
-- AND table_name IN ('users', 'identity', 'identity_status', 'promises', 'calls')
-- ORDER BY table_name;

-- 2. Verify bloat tables are gone
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('brutal_reality', 'memory_embeddings', 'onboarding_response_v3', 'onboarding');
-- -- Should return 0 rows

-- 3. Check identity table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'identity'
-- ORDER BY ordinal_position;
-- -- Should show: id, user_id, name, daily_commitment, chosen_path, call_time, strike_limit,
-- --             why_it_matters_audio_url, cost_of_quitting_audio_url, commitment_audio_url,
-- --             onboarding_context (JSONB), created_at, updated_at

-- 4. Test JSONB querying (example)
-- SELECT name,
--        onboarding_context->>'goal' as goal,
--        onboarding_context->>'motivation_level' as motivation_level
-- FROM identity
-- LIMIT 5;
