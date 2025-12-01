-- =============================================================================
-- Migration: SaaS Release Readiness (SIMPLIFIED)
-- Date: 2025-12-01
-- Phase: 2 - Foundational
-- Description: Add authentication, email logging, and subscription history tables
--              NO TRIAL FEATURES - keeping it simple!
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1: Extend users table with essential audit fields ONLY
-- =============================================================================

-- Audit fields (simple tracking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- PART 2: Create failed_login_attempts table (security)
-- =============================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_failed_login_email_attempted 
  ON failed_login_attempts(email, attempted_at DESC);

COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for rate limiting';

-- =============================================================================
-- PART 3: Create password_reset_tokens table
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash 
  ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_email_expires 
  ON password_reset_tokens(email, expires_at DESC);

COMMENT ON TABLE password_reset_tokens IS 'One-time password reset tokens';

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
  resend_email_id VARCHAR(100),
  
  CONSTRAINT email_type_enum CHECK (
    email_type IN (
      'welcome',
      'password_reset',
      'payment_receipt',
      'subscription_change',
      'failed_payment'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_sent 
  ON email_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type_sent 
  ON email_logs(email_type, sent_at DESC);

COMMENT ON TABLE email_logs IS 'Audit trail for transactional emails';

-- =============================================================================
-- PART 5: Create subscription_history table
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT event_type_enum CHECK (
    event_type IN (
      'subscription_created',
      'subscription_renewed',
      'subscription_cancelled',
      'payment_succeeded',
      'payment_failed',
      'refund_issued'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_created 
  ON subscription_history(user_id, created_at DESC);

COMMENT ON TABLE subscription_history IS 'Audit trail of subscription events from RevenueCat';

-- =============================================================================
-- PART 6: Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS
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

-- =============================================================================
-- PART 7: Helper function for rate limiting
-- =============================================================================

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

COMMENT ON FUNCTION check_login_rate_limit IS 'Check if email exceeded failed login attempts';

-- =============================================================================
-- PART 8: Cleanup functions
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_reset_tokens IS 'Delete old password reset tokens';

CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_login_attempts IS 'Delete old failed login attempts';

-- =============================================================================
-- Migration complete - No trial complexity!
-- =============================================================================
