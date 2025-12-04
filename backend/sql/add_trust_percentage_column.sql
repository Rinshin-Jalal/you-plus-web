-- =====================================================
-- ADD TRUST_PERCENTAGE COLUMN TO IDENTITY_STATUS TABLE
-- =====================================================
-- Adds the missing trust_percentage column for sync function

-- Add the trust_percentage INTEGER column
ALTER TABLE identity_status 
ADD COLUMN IF NOT EXISTS trust_percentage INTEGER DEFAULT 100;

-- Add comment to document the column purpose
COMMENT ON COLUMN identity_status.trust_percentage IS 'Trust percentage based on recent performance (last 7 days)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'identity_status' 
AND column_name = 'trust_percentage';
