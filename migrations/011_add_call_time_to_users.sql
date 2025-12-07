-- Migration 011: Add call_time column to users table
-- The call_time was previously in status table but needs to be in users table
-- for the onboarding flow to work correctly

-- Add call_time column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS call_time TIME DEFAULT '09:00:00';

-- Add comment for documentation
COMMENT ON COLUMN users.call_time IS 'User preferred daily call time in their timezone';
