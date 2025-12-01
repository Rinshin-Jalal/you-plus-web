# Multi-Provider Payment Integration Guide

## Overview

YOU+ uses **different payment providers** based on platform:
- 🌐 **Web**: DodoPayments (India-friendly: UPI, Cards, Wallets)
- 📱 **iOS/Android**: RevenueCat (App Store, Google Play)

This architecture allows us to:
- ✅ Support Indian payment methods on web (Stripe not available in India)
- ✅ Use native in-app purchases on mobile
- ✅ Maintain unified subscription state in backend

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────┬───────────────────────────────────────────┤
│  Web Browser    │  Mobile App (iOS/Android)                 │
│  (Next.js)      │  (React Native/Swift)                     │
│                 │                                            │
│  DodoPayments   │  RevenueCat SDK                           │
│  Checkout       │  (Native IAP)                             │
└────────┬────────┴──────────────┬────────────────────────────┘
         │                       │
         │ Webhooks              │ Webhooks
         ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Cloudflare Workers)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Unified Subscription Logic                          │  │
│  │  - Single source of truth                            │  │
│  │  - Platform-agnostic queries                         │  │
│  │  - Webhook handlers for both providers               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (Supabase PostgreSQL)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  subscriptions table                                 │  │
│  │  - user_id (UUID)                                    │  │
│  │  - payment_provider (dodopayments | revenuecat)     │  │
│  │  - status (active | inactive | cancelled | ...)     │  │
│  │  - current_period_end                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  subscription_history table                          │  │
│  │  - event logs from both providers                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Migration: `002_multi_provider_payments.sql`

**Key Changes:**
1. Added `payment_provider` column to `users` table
2. Added `dodo_customer_id` for DodoPayments
3. Created `subscriptions` table (current state)
4. Updated `subscription_history` to support both providers
5. Added helper function `has_active_subscription(user_id)`

**Run this migration:**
```sql
-- Apply in Supabase SQL Editor
\i old-backend-for-swift/sql/002_multi_provider_payments.sql
```

---

## Frontend Integration

### Payment Service (`web/src/services/payment.ts`)

**Platform Detection:**
```typescript
// Automatically detects web vs mobile
const platform = getPlatform(); // 'web' | 'mobile'
```

**Key Methods:**

#### For Web (DodoPayments):
```typescript
// Create checkout session
const session = await paymentService.createCheckoutSession('plan_id');
// Returns: { sessionId, checkoutUrl, expiresAt }

// Redirect user to DodoPayments
await paymentService.redirectToCheckout('plan_id');

// Verify after payment redirect
const result = await paymentService.verifyCheckoutSession(sessionId);

// Get customer portal (manage subscription)
const portalUrl = await paymentService.getCustomerPortalUrl();
```

#### For Mobile (RevenueCat):
```typescript
// Mobile apps should NOT use web payment service
// Use native RevenueCat SDK instead:
// - Purchases.shared.purchase(package)
// - Backend receives webhooks from RevenueCat
```

#### Platform-Agnostic:
```typescript
// Get subscription status (works for both)
const status = await paymentService.getSubscriptionStatus();

// Get billing history (works for both)
const history = await paymentService.getBillingHistory();

// Cancel subscription (works for both)
await paymentService.cancelSubscription('reason');
```

---

## Backend Integration

### Required Backend Endpoints

#### 1. **GET /api/billing/subscription**
Returns current subscription status for authenticated user.

**Response:**
```json
{
  "subscription": {
    "hasActiveSubscription": true,
    "status": "active",
    "paymentProvider": "dodopayments",
    "planId": "pro_monthly",
    "planName": "Pro Monthly",
    "currentPeriodEnd": "2025-01-15T00:00:00Z",
    "amountCents": 49900,
    "currency": "INR"
  }
}
```

**Backend Logic:**
```typescript
// Query subscriptions table
const subscription = await db
  .from('subscriptions')
  .select('*')
  .eq('user_id', userId)
  .single();

// Return unified format regardless of provider
```

---

#### 2. **POST /api/billing/checkout/create** (Web Only)
Create DodoPayments checkout session.

**Request:**
```json
{
  "planId": "pro_monthly",
  "returnUrl": "https://youplus.app/billing/success"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxx",
  "checkoutUrl": "https://checkout.dodopayments.com/session/cs_xxx",
  "expiresAt": "2025-12-01T16:00:00Z"
}
```

**Backend Logic:**
```typescript
// Call DodoPayments API
const session = await dodoPayments.createCheckoutSession({
  customer: user.dodo_customer_id,
  plan: planId,
  success_url: returnUrl,
  cancel_url: returnUrl,
  metadata: { user_id: userId }
});
```

---

#### 3. **POST /api/billing/checkout/verify** (Web Only)
Verify checkout session after redirect.

**Request:**
```json
{
  "sessionId": "cs_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": { /* subscription object */ }
}
```

---

#### 4. **POST /api/billing/cancel**
Cancel subscription (both providers).

**Request:**
```json
{
  "reason": "Too expensive"
}
```

**Backend Logic:**
```typescript
// Check payment provider
if (subscription.payment_provider === 'dodopayments') {
  await dodoPayments.cancelSubscription(subscription.provider_subscription_id);
} else {
  await revenueCat.cancelSubscription(user.revenuecat_customer_id);
}

// Update database
await db.from('subscriptions')
  .update({ status: 'cancelled', cancelled_at: new Date() })
  .eq('user_id', userId);
```

---

#### 5. **GET /api/billing/plans**
Get available subscription plans.

**Response:**
```json
{
  "plans": [
    {
      "id": "pro_monthly",
      "name": "Pro Monthly",
      "description": "Full access to all features",
      "amountCents": 49900,
      "currency": "INR",
      "interval": "month"
    }
  ]
}
```

---

### Webhook Handlers

#### DodoPayments Webhook (`/webhook/dodopayments`)

**Events to handle:**
- `checkout.session.completed` - Payment succeeded
- `subscription.created` - New subscription
- `subscription.updated` - Status change
- `subscription.cancelled` - Cancellation
- `invoice.payment_failed` - Payment failure

**Implementation:**
```typescript
export async function handleDodoWebhook(req: Request, env: Env) {
  // Verify webhook signature
  const signature = req.headers.get('dodo-signature');
  const isValid = verifyDodoSignature(req.body, signature, env.DODO_WEBHOOK_SECRET);
  
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = await req.json();
  
  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data, env);
      break;
    case 'subscription.created':
      await handleSubscriptionCreated(event.data, env);
      break;
    // ... other events
  }
  
  return new Response('OK', { status: 200 });
}

async function handleCheckoutCompleted(data: any, env: Env) {
  const userId = data.metadata.user_id;
  
  // Create or update subscription
  await db.from('subscriptions').upsert({
    user_id: userId,
    payment_provider: 'dodopayments',
    status: 'active',
    provider_subscription_id: data.subscription_id,
    provider_customer_id: data.customer_id,
    plan_id: data.plan_id,
    amount_cents: data.amount,
    current_period_start: data.period_start,
    current_period_end: data.period_end,
  });
  
  // Log event
  await db.from('subscription_history').insert({
    user_id: userId,
    payment_provider: 'dodopayments',
    event_type: 'payment_succeeded',
    new_status: 'active',
    metadata: data,
  });
}
```

#### RevenueCat Webhook (existing)
Keep your existing RevenueCat webhook handler - just update it to set `payment_provider: 'revenuecat'` in database.

---

## DodoPayments Setup

### 1. **Get API Keys**
1. Sign up at [dodopayments.com](https://dodopayments.com)
2. Complete KYC verification
3. Get API keys from dashboard:
   - `DODO_API_KEY` (secret)
   - `DODO_PUBLISHABLE_KEY` (public)
   - `DODO_WEBHOOK_SECRET`

### 2. **Create Products/Plans**
In DodoPayments dashboard:
1. Create product: "YOU+ Pro"
2. Create price: ₹499/month
3. Note the plan ID (e.g., `plan_pro_monthly`)

### 3. **Configure Webhooks**
Set webhook URL in DodoPayments dashboard:
```
https://your-api.workers.dev/webhook/dodopayments
```

Enable these events:
- ✅ checkout.session.completed
- ✅ subscription.created
- ✅ subscription.updated
- ✅ subscription.cancelled
- ✅ invoice.payment_failed

---

## Environment Variables

### Frontend (`.env.local`):
```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Backend API
NEXT_PUBLIC_API_URL=https://your-api.workers.dev

# DodoPayments (public key only)
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY=pk_test_xxx
```

### Backend (`wrangler.toml` secrets):
```bash
# Add these via: wrangler secret put <NAME>

# DodoPayments
DODO_API_KEY=sk_test_xxx
DODO_WEBHOOK_SECRET=whsec_xxx

# RevenueCat (existing)
REVENUECAT_API_KEY=xxx
REVENUECAT_WEBHOOK_SECRET=xxx
```

---

## Implementation Checklist

### Backend Tasks:
- [ ] Run migration: `002_multi_provider_payments.sql`
- [ ] Create `/api/billing/subscription` endpoint
- [ ] Create `/api/billing/checkout/create` endpoint (DodoPayments)
- [ ] Create `/api/billing/checkout/verify` endpoint
- [ ] Create `/api/billing/cancel` endpoint (both providers)
- [ ] Create `/api/billing/plans` endpoint
- [ ] Create `/webhook/dodopayments` handler
- [ ] Update existing RevenueCat webhook to set `payment_provider`
- [ ] Add DodoPayments API client wrapper
- [ ] Test webhooks with DodoPayments test events

### Frontend Tasks:
- [X] Update `payment.ts` service (already done!)
- [X] Update `Paywall.tsx` component (already done!)
- [ ] Create `/checkout` page with plan selection
- [ ] Create `/billing/success` page (after payment)
- [ ] Create `/billing/manage` page (customer portal)
- [ ] Test checkout flow end-to-end
- [ ] Add loading states and error handling

### Testing:
- [ ] Test web checkout with DodoPayments test mode
- [ ] Test mobile with RevenueCat sandbox
- [ ] Test subscription status queries
- [ ] Test cancellation flow
- [ ] Test webhook delivery for both providers
- [ ] Test subscription history display

---

## DodoPayments API Reference

### Create Checkout Session
```bash
POST https://api.dodopayments.com/v1/checkout/sessions
Authorization: Bearer sk_test_xxx
Content-Type: application/json

{
  "customer": "cus_xxx",
  "line_items": [{
    "price": "plan_pro_monthly",
    "quantity": 1
  }],
  "success_url": "https://youplus.app/billing/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://youplus.app/checkout",
  "metadata": {
    "user_id": "uuid-here"
  }
}
```

**Response:**
```json
{
  "id": "cs_xxx",
  "url": "https://checkout.dodopayments.com/session/cs_xxx",
  "expires_at": 1704124800
}
```

### Get Subscription
```bash
GET https://api.dodopayments.com/v1/subscriptions/{subscription_id}
Authorization: Bearer sk_test_xxx
```

### Cancel Subscription
```bash
DELETE https://api.dodopayments.com/v1/subscriptions/{subscription_id}
Authorization: Bearer sk_test_xxx
```

---

## Next Steps

1. **Set up DodoPayments account** (today)
2. **Run database migration** (5 min)
3. **Create backend billing endpoints** (2-3 hours)
4. **Create checkout page UI** (1-2 hours)
5. **Test with DodoPayments test mode** (30 min)
6. **Deploy and verify webhooks** (30 min)

**Total estimated time: 4-6 hours for full DodoPayments integration**

---

## Questions?

Common scenarios:

**Q: What if user switches from mobile to web?**
A: Backend returns existing subscription regardless of provider. User can manage either via DodoPayments portal (web) or App Store/Play Store (mobile).

**Q: Can user have both DodoPayments AND RevenueCat?**
A: No. First subscription wins. `subscriptions` table has `UNIQUE` constraint on `user_id`.

**Q: How to test locally?**
A: Use DodoPayments test mode + ngrok for webhooks:
```bash
ngrok http 8787
# Set webhook URL: https://xxx.ngrok.io/webhook/dodopayments
```

**Q: What about refunds?**
A: Handle `refund_issued` event in webhook. Update subscription status to `inactive` and log in history.
