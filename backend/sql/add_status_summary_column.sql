-- =====================================================
-- ADD STATUS_SUMMARY COLUMN TO IDENTITY_STATUS TABLE
-- =====================================================
-- Adds JSONB column for AI-generated discipline level and notification messages
-- This enables dynamic messaging based on user performance

-- Add the status_summary JSONB column
ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS status_summary JSONB;

-- Add comment to document the column purpose
COMMENT ON COLUMN identity_status.status_summary IS 'AI-generated discipline level and notification messages based on user performance';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'identity_status' 
AND column_name = 'status_summary';
