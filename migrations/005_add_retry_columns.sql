-- ============================================================================
-- YOU+ ADD RETRY COLUMNS TO CALL_ANALYTICS
-- ============================================================================
-- 
-- This migration adds retry tracking and call metadata columns to call_analytics
-- that were previously in the now-deleted `calls` table.
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ADD RETRY TRACKING COLUMNS
-- ============================================================================

-- Retry tracking (from old calls table)
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS is_retry BOOLEAN DEFAULT FALSE;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS retry_attempt_number INTEGER DEFAULT 0;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS original_call_uuid UUID;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS retry_reason TEXT; -- 'missed', 'declined', 'failed'

-- Call acknowledgment tracking
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMPTZ;

-- ============================================================================
-- PART 2: ADD CALL METADATA COLUMNS
-- ============================================================================

-- External service tracking
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS source TEXT; -- 'cartesia', 'elevenlabs'

-- Recording and transcript
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS transcript_json JSONB;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS transcript_summary TEXT;

-- Call outcome
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS call_successful TEXT DEFAULT 'unknown'; -- 'success', 'failure', 'unknown'

-- Timing
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Cost tracking
ALTER TABLE call_analytics ADD COLUMN IF NOT EXISTS cost_cents INTEGER;

-- ============================================================================
-- PART 3: ADD INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_call_analytics_conversation_id ON call_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_is_retry ON call_analytics(is_retry) WHERE is_retry = TRUE;
CREATE INDEX IF NOT EXISTS idx_call_analytics_source ON call_analytics(source);
CREATE INDEX IF NOT EXISTS idx_call_analytics_acknowledged ON call_analytics(acknowledged) WHERE acknowledged = FALSE;

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
--
-- Added columns to call_analytics:
--
-- Retry tracking:
--   - is_retry (BOOLEAN)
--   - retry_attempt_number (INTEGER)
--   - original_call_uuid (UUID)
--   - retry_reason (TEXT)
--
-- Acknowledgment:
--   - acknowledged (BOOLEAN)
--   - acknowledged_at (TIMESTAMPTZ)
--   - timeout_at (TIMESTAMPTZ)
--
-- Call metadata:
--   - conversation_id (TEXT)
--   - source (TEXT)
--   - audio_url (TEXT)
--   - transcript_json (JSONB)
--   - transcript_summary (TEXT)
--   - call_successful (TEXT)
--   - start_time (TIMESTAMPTZ)
--   - end_time (TIMESTAMPTZ)
--   - cost_cents (INTEGER)
--
-- ============================================================================
