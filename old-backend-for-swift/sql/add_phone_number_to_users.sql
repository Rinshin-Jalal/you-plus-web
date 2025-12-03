-- ============================================================================
-- Migration: Add phone_number column to users table
-- Purpose: Enable Cartesia Line SDK outbound telephony calls
-- Format: E.164 (e.g., +14155551234)
-- ============================================================================

-- Add phone_number column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.phone_number IS 'User phone number in E.164 format (e.g., +14155551234) for Cartesia Line outbound calls';

-- Create index for efficient lookups (only on non-null values)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;

-- Add check constraint for E.164 format validation
-- E.164: starts with +, followed by 1-15 digits
ALTER TABLE users ADD CONSTRAINT check_phone_number_format 
  CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9]\d{1,14}$');
