-- ============================================================================
-- YOU+ RLS POLICIES + RENAME identity_status → status
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: RENAME identity_status → status
-- ============================================================================

-- Rename the table
ALTER TABLE identity_status RENAME TO status;

-- Rename the constraint
ALTER TABLE status RENAME CONSTRAINT identity_status_pkey TO status_pkey;
ALTER TABLE status RENAME CONSTRAINT identity_status_user_id_fkey TO status_user_id_fkey;

-- Rename the trigger
DROP TRIGGER IF EXISTS trigger_identity_status_updated_at ON status;
CREATE TRIGGER trigger_status_updated_at
    BEFORE UPDATE ON status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 2: ENABLE RLS ON NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE call_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuse_patterns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: RLS POLICIES FOR call_memory
-- ============================================================================

-- Users can read their own call memory
CREATE POLICY "Users can read own call_memory"
    ON call_memory
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own call memory
CREATE POLICY "Users can insert own call_memory"
    ON call_memory
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own call memory
CREATE POLICY "Users can update own call_memory"
    ON call_memory
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for agent)
CREATE POLICY "Service role full access to call_memory"
    ON call_memory
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 4: RLS POLICIES FOR call_analytics
-- ============================================================================

-- Users can read their own call analytics
CREATE POLICY "Users can read own call_analytics"
    ON call_analytics
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own call analytics
CREATE POLICY "Users can insert own call_analytics"
    ON call_analytics
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for agent)
CREATE POLICY "Service role full access to call_analytics"
    ON call_analytics
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 5: RLS POLICIES FOR excuse_patterns
-- ============================================================================

-- Users can read their own excuse patterns
CREATE POLICY "Users can read own excuse_patterns"
    ON excuse_patterns
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own excuse patterns
CREATE POLICY "Users can insert own excuse_patterns"
    ON excuse_patterns
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for agent)
CREATE POLICY "Service role full access to excuse_patterns"
    ON excuse_patterns
    FOR ALL
    USING (auth.role() = 'service_role');

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
--
-- 1. Renamed identity_status → status
-- 2. Added RLS policies for:
--    - call_memory (SELECT, INSERT, UPDATE for users, ALL for service_role)
--    - call_analytics (SELECT, INSERT for users, ALL for service_role)
--    - excuse_patterns (SELECT, INSERT for users, ALL for service_role)
--
-- The agent uses service_role key so it has full access.
-- Users can only see/modify their own data.
--
-- ============================================================================
