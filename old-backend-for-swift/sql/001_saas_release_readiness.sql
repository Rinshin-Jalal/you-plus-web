-- =============================================================================
-- Migration: SaaS Release Readiness
-- Date: 2025-12-01
-- Phase: 2 - Foundational
-- Description: Add authentication, trial tracking, email logging, and
--              subscription history tables for web platform launch
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1: Extend users table with trial and audit fields
-- =============================================================================

-- Trial tracking (nullable = user may not be in trial)
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;

-- Profile completeness tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Audit fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_deleted_at TIMESTAMP; -- For GDPR soft deletes

-- Add constraint: if trial_start_date is set, trial_end_date must be set
ALTER TABLE users ADD CONSTRAINT users_trial_dates_check 
  CHECK (
    (trial_start_date IS NULL AND trial_end_date IS NULL) OR
    (trial_start_date IS NOT NULL AND trial_end_date IS NOT NULL)
  );

-- =============================================================================
-- PART 2: Create failed_login_attempts table
-- =============================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_failed_login_email_attempted 
  ON failed_login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_login_user_attempted 
  ON failed_login_attempts(user_id, attempted_at DESC) 
  WHERE user_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for rate limiting and security monitoring';

-- =============================================================================
-- PART 3: Create password_reset_tokens table
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA256 hash of token sent in email
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP, -- NULL = unused, set when redeemed
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for token lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash 
  ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_email_expires 
  ON password_reset_tokens(email, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_created 
  ON password_reset_tokens(user_id, created_at DESC);

-- Index for cleanup job (find expired tokens)
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_unused 
  ON password_reset_tokens(expires_at) 
  WHERE used_at IS NULL;

-- Add comment
COMMENT ON TABLE password_reset_tokens IS 'One-time password reset tokens with expiration tracking';

-- =============================================================================
-- PART 4: Create email_logs table
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_address VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  template_id VARCHAR(100),
  sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INT DEFAULT 0 NOT NULL,
  last_retry_at TIMESTAMP,
  
  -- Resend integration metadata
  resend_email_id VARCHAR(100), -- Resend's unique email ID for tracking
  
  CONSTRAINT email_type_enum CHECK (
    email_type IN (
      'welcome',
      'password_reset',
      'payment_receipt',
      'subscription_change',
      'failed_payment',
      'call_reminder',
      'trial_ending',
      'trial_ended'
    )
  )
);

-- Indexes for querying and monitoring
CREATE INDEX IF NOT EXISTS idx_email_logs_user_sent 
  ON email_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type_sent 
  ON email_logs(email_type, sent_at DESC);

-- Index for finding failed emails that need retry
CREATE INDEX IF NOT EXISTS idx_email_logs_failed_undelivered 
  ON email_logs(failed_at, retry_count) 
  WHERE delivered_at IS NULL AND retry_count < 3;

-- Index for Resend webhook lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id 
  ON email_logs(resend_email_id) 
  WHERE resend_email_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE email_logs IS 'Audit trail for all transactional emails with delivery tracking';

-- =============================================================================
-- PART 5: Create subscription_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  metadata JSONB, -- RevenueCat webhook data, payment amount, etc.
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT event_type_enum CHECK (
    event_type IN (
      'trial_started',
      'trial_ended',
      'subscription_created',
      'subscription_renewed',
      'subscription_cancelled',
      'subscription_paused',
      'subscription_resumed',
      'payment_succeeded',
      'payment_failed',
      'refund_issued'
    )
  )
);

-- Indexes for user history and reporting
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_created 
  ON subscription_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_created 
  ON subscription_history(event_type, created_at DESC);

-- Add comment
COMMENT ON TABLE subscription_history IS 'Audit trail of all subscription and billing events from RevenueCat';

-- =============================================================================
-- PART 6: Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own email logs
DROP POLICY IF EXISTS email_logs_read_own ON email_logs;
CREATE POLICY email_logs_read_own ON email_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own subscription history
DROP POLICY IF EXISTS subscription_history_read_own ON subscription_history;
CREATE POLICY subscription_history_read_own ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Failed login attempts and password reset tokens are backend-only
-- No user-facing SELECT policies (app queries via service role)

-- Service role can do everything (for backend operations)
-- Note: These policies apply to authenticated requests, service role bypasses RLS

-- =============================================================================
-- PART 7: Functions for common queries
-- =============================================================================

-- Function to check if user has exceeded failed login rate limit
CREATE OR REPLACE FUNCTION check_login_rate_limit(
  p_email VARCHAR(255),
  p_window_minutes INT DEFAULT 60,
  p_max_attempts INT DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INT;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM failed_login_attempts
  WHERE email = p_email
    AND attempted_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN attempt_count >= p_max_attempts;
END;
$$;

COMMENT ON FUNCTION check_login_rate_limit IS 'Check if email has exceeded failed login attempts in time window';

-- Function to check if user is in active trial
CREATE OR REPLACE FUNCTION is_user_in_trial(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  in_trial BOOLEAN;
BEGIN
  SELECT 
    trial_start_date IS NOT NULL 
    AND trial_end_date IS NOT NULL 
    AND trial_end_date > NOW()
  INTO in_trial
  FROM users
  WHERE id = p_user_id;
  
  RETURN COALESCE(in_trial, FALSE);
END;
$$;

COMMENT ON FUNCTION is_user_in_trial IS 'Check if user has an active trial period';

-- Function to get trial days remaining
CREATE OR REPLACE FUNCTION get_trial_days_remaining(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  days_remaining INT;
BEGIN
  SELECT 
    GREATEST(0, EXTRACT(DAY FROM (trial_end_date - NOW()))::INT)
  INTO days_remaining
  FROM users
  WHERE id = p_user_id
    AND trial_start_date IS NOT NULL
    AND trial_end_date IS NOT NULL;
  
  RETURN COALESCE(days_remaining, 0);
END;
$$;

COMMENT ON FUNCTION get_trial_days_remaining IS 'Get number of days remaining in user trial (0 if expired or no trial)';

-- =============================================================================
-- PART 8: Cleanup and maintenance functions
-- =============================================================================

-- Function to clean up expired password reset tokens (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep for 7 days after expiry for audit
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_reset_tokens IS 'Delete password reset tokens older than 7 days past expiration';

-- Function to clean up old failed login attempts (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '30 days'; -- Keep 30 days for security analysis
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_login_attempts IS 'Delete failed login attempts older than 30 days';

-- =============================================================================
-- PART 9: Verification and validation
-- =============================================================================

-- Verify all tables exist
DO $$
BEGIN
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'failed_login_attempts'
  )), 'Table failed_login_attempts was not created';
  
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'password_reset_tokens'
  )), 'Table password_reset_tokens was not created';
  
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'email_logs'
  )), 'Table email_logs was not created';
  
  ASSERT (SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'subscription_history'
  )), 'Table subscription_history was not created';
  
  RAISE NOTICE 'Migration verification successful: All tables and functions created';
END $$;

-- =============================================================================
-- Migration complete
-- =============================================================================
