-- =============================================================================
-- Migration: SaaS Release Readiness - Multi-Provider Payment System
-- Date: 2025-12-01
-- Description: Support BOTH DodoPayments (web) and RevenueCat (mobile)
--              NO EMAIL, NO PASSWORD RESETS, NO TRIALS
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1: Extend users table (minimal tracking + payment provider)
-- =============================================================================

-- Basic timestamps for user tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Payment provider tracking (web uses DodoPayments, mobile uses RevenueCat)
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20) DEFAULT 'dodopayments';
ALTER TABLE users ADD COLUMN IF NOT EXISTS dodo_customer_id VARCHAR(255);

COMMENT ON COLUMN users.payment_provider IS 'Payment provider: dodopayments (web) or revenuecat (mobile)';
COMMENT ON COLUMN users.dodo_customer_id IS 'DodoPayments customer ID for web users';

-- Add constraint for valid payment providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_payment_provider_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_payment_provider_check 
        CHECK (payment_provider IN ('dodopayments', 'revenuecat'));
    END IF;
END $$;

-- =============================================================================
-- PART 2: Create subscription_history table (Multi-provider events)
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_provider VARCHAR(20) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Provider-specific IDs
  provider_transaction_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  
  CONSTRAINT payment_provider_check CHECK (
    payment_provider IN ('dodopayments', 'revenuecat')
  ),
  
  CONSTRAINT event_type_enum CHECK (
    event_type IN (
      'subscription_created',
      'subscription_renewed',
      'subscription_cancelled',
      'payment_succeeded',
      'payment_failed',
      'refund_issued',
      'payment_pending'
    )
  )
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_created 
  ON subscription_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_history_provider 
  ON subscription_history(payment_provider, event_type);

COMMENT ON TABLE subscription_history IS 'Multi-provider subscription events: DodoPayments (web) + RevenueCat (mobile)';
COMMENT ON COLUMN subscription_history.payment_provider IS 'Source of the event: dodopayments or revenuecat';
COMMENT ON COLUMN subscription_history.provider_transaction_id IS 'Transaction ID from payment provider';

-- =============================================================================
-- PART 3: Create subscriptions table (current subscription state)
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Subscription status
  status VARCHAR(20) NOT NULL DEFAULT 'inactive',
  
  -- Provider info
  payment_provider VARCHAR(20) NOT NULL,
  provider_subscription_id VARCHAR(255),
  provider_customer_id VARCHAR(255),
  
  -- Subscription details
  plan_id VARCHAR(100),
  plan_name VARCHAR(100),
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Dates
  started_at TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  CONSTRAINT status_check CHECK (
    status IN ('active', 'inactive', 'cancelled', 'past_due', 'pending')
  ),
  
  CONSTRAINT provider_check CHECK (
    payment_provider IN ('dodopayments', 'revenuecat')
  )
);

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider 
  ON subscriptions(payment_provider, provider_subscription_id);

COMMENT ON TABLE subscriptions IS 'Current subscription state for each user';
COMMENT ON COLUMN subscriptions.status IS 'active, inactive, cancelled, past_due, pending';

-- =============================================================================
-- PART 4: Row Level Security
-- =============================================================================

-- Enable RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription history
DROP POLICY IF EXISTS subscription_history_read_own ON subscription_history;
CREATE POLICY subscription_history_read_own ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own subscription
DROP POLICY IF EXISTS subscriptions_read_own ON subscriptions;
CREATE POLICY subscriptions_read_own ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- PART 5: Helper Functions
-- =============================================================================

-- Function to check if user has active subscription (any provider)
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_active_subscription IS 'Check if user has active subscription from any provider';

-- =============================================================================
-- Done! Supports both DodoPayments (web) and RevenueCat (mobile)
-- =============================================================================
