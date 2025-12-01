-- =============================================================================
-- Migration: SaaS Release Readiness (ULTRA SIMPLIFIED)
-- Date: 2025-12-01
-- Description: Just subscription tracking for Google/Apple auth users
--              NO EMAIL, NO PASSWORD RESETS, NO TRIALS
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1: Extend users table (minimal tracking)
-- =============================================================================

-- Just basic timestamps for user tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- =============================================================================
-- PART 2: Create subscription_history table (RevenueCat events)
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

-- Index for user history queries
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_created 
  ON subscription_history(user_id, created_at DESC);

COMMENT ON TABLE subscription_history IS 'RevenueCat subscription events from webhooks';

-- =============================================================================
-- PART 3: Row Level Security
-- =============================================================================

-- Enable RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription history
DROP POLICY IF EXISTS subscription_history_read_own ON subscription_history;
CREATE POLICY subscription_history_read_own ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- Done! Simple and clean for Google/Apple auth only
-- =============================================================================
