# Data Model: SaaS Release Readiness

**Phase**: 1 Design  
**Date**: 2025-12-01  
**Status**: Complete

---

## Database Schema Changes

### New Columns: users table (Supabase)

```sql
-- Trial tracking (nullable = user may not be in trial)
ALTER TABLE users ADD COLUMN trial_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN trial_end_date TIMESTAMP;

-- Profile completeness tracking
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- Audit fields
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN account_deleted_at TIMESTAMP; -- For GDPR soft deletes
```

### New Table: failed_login_attempts

Tracks password reset attempts and rate limiting

```sql
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  INDEX idx_email_attempted_at (email, attempted_at),
  INDEX idx_user_id_attempted_at (user_id, attempted_at)
);
```

### New Table: password_reset_tokens

Tracks password reset links

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hash of token sent in email
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP, -- NULL = unused, set when redeemed
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_email_expires_at (email, expires_at),
  INDEX idx_token_hash (token_hash)
);
```

### New Table: email_logs

Audit trail for all transactional emails

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_address VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL, -- 'welcome', 'password_reset', 'payment_receipt', etc.
  template_id VARCHAR(100),
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP,
  
  CONSTRAINT email_type_enum CHECK (email_type IN ('welcome', 'password_reset', 'payment_receipt', 'subscription_change', 'failed_payment', 'call_reminder')),
  
  INDEX idx_user_id_sent_at (user_id, sent_at),
  INDEX idx_email_type_sent_at (email_type, sent_at),
  INDEX idx_delivered_at (delivered_at) WHERE delivered_at IS NULL
);
```

### Existing Tables: Extend subscription tracking

```sql
-- Extend existing calls or create new subscription_history table
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'trial_started', 'trial_ended', 'subscription_created', 'subscription_cancelled', 'payment_succeeded', 'payment_failed'
  previous_status VARCHAR(50), -- NULL for first event
  new_status VARCHAR(50),
  metadata JSONB, -- RevenueCat webhook data, payment amount, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT event_type_enum CHECK (event_type IN ('trial_started', 'trial_ended', 'subscription_created', 'subscription_cancelled', 'payment_succeeded', 'payment_failed')),
  
  INDEX idx_user_id_created_at (user_id, created_at),
  INDEX idx_event_type_created_at (event_type, created_at)
);
```

---

## Entity Relationships

```
User (core identity)
├── failed_login_attempts (1:N) - for rate limiting
├── password_reset_tokens (1:N) - for password recovery
├── email_logs (1:N) - audit trail of sent emails
└── subscription_history (1:N) - audit trail of billing events

RevenueCat (external system)
└── → subscription_history (via webhook) - maintains sync
```

---

## Validation Rules

### Users Table

| Field | Rule | Rationale |
|-------|------|-----------|
| email | UNIQUE, lowercase | Prevent duplicate accounts, case-insensitive matching |
| trial_start_date | IF SET then trial_end_date MUST BE SET | Maintain data integrity |
| trial_end_date | IF SET then trial_start_date MUST BE SET, in future | Can't have trial end without start |
| email_verified | FALSE until email confirmation link clicked | Prevent spam signups |
| timezone | Valid IANA timezone or 'UTC' | Prevent invalid schedules |

### Failed Login Attempts Table

| Field | Rule | Rationale |
|-------|------|-----------|
| email | MUST exist in users table | Integrity check |
| attempted_at | Auto-set to NOW() | Audit trail |
| Rate limit | > 5 attempts in 1 hour = temporary lockout (24h) | Brute force protection |

### Password Reset Tokens Table

| Field | Rule | Rationale |
|-------|------|-----------|
| token_hash | One-way hash (SHA256) | Prevent token exposure if DB leaked |
| expires_at | 24 hours from created_at | Limit reset window |
| used_at | Set when redeemed, prevents reuse | One-use tokens |

### Email Logs Table

| Field | Rule | Rationale |
|-------|------|-----------|
| email_type | Enumerated list | Constrain to known types |
| retry_count | Max 3 retries over 24h | Eventually deliver or fail gracefully |
| delivered_at | NULL until Resend webhook confirms | Track delivery status |

---

## State Transitions

### User Trial State Machine

```
                    ┌─ Not in trial ─┐
                    │                 │
         [Signup]   ▼                 │
         ─────────► In Trial ─────────┤
                    │                 │
                    │ [Trial expires] │
                    ├─ Prompt payment │
                    │                 │
                    └─ Paywall state  │
                         │            │
         [Pay] ◄──────────┴─ Trial ─◄─┤
         │                  expired    │
         ▼                             │
      Paid/Active ◄────────────────────┘

      [Cancel]
         ▼
    Cancelled (soft delete, keep data)
```

### Email State Machine

```
[Queued] → [Sending] → [Delivered]
   │                        ▲
   └─ [Failed] ────────────┤
                (retry loop)
         Max 3 retries, 24h
```

---

## API Response Models

### Auth Response

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_verified": true,
    "created_at": "2025-12-01T10:00:00Z",
    "trial_status": {
      "in_trial": true,
      "trial_end_date": "2025-12-08T00:00:00Z",
      "days_remaining": 5
    },
    "subscription": {
      "status": "active" | "trialing" | "cancelled" | "expired",
      "current_period_end": "2025-01-01T00:00:00Z",
      "cancel_at_period_end": false
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

### User Context Response (after login)

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "timezone": "America/New_York",
    "email_verified": true
  },
  "trial": {
    "in_trial": true,
    "days_remaining": 5,
    "trial_end_date": "2025-12-08"
  },
  "subscription": {
    "status": "trialing" | "active" | "cancelled",
    "next_billing_date": "2025-01-01",
    "can_access_features": true,
    "requires_payment": false
  }
}
```

---

## Migration Path

### Step 1: Add trial columns
- Zero downtime (nullable columns)
- Default: NULL (existing users not in trial)

### Step 2: Add new tables
- Zero downtime
- Used only for new functionality

### Step 3: Backfill data (optional for MVP)
- For existing users who paid: set trial_start_date = created_at
- Allows reporting on conversion from trial to paid

### Step 4: Enable in app
- Check trial_end_date at login
- Show paywall if trial expired and not subscribed

---

## Access Control (RLS Policies)

All user data is scoped by auth.uid():

```sql
-- Users can only see their own profile
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Email logs visible to user for their own emails
CREATE POLICY email_logs_read_own ON email_logs
  FOR SELECT USING (user_id = auth.uid());

-- Failed login attempts only logged, not queried by users
CREATE POLICY failed_logins_app_only ON failed_login_attempts
  FOR SELECT USING (false); -- App only, via backend function
```

---

## Next Steps

1. ✅ Data model complete
2. ⏭️ Create /contracts/ directory with API specifications
3. ⏭️ Create quickstart.md for local development
