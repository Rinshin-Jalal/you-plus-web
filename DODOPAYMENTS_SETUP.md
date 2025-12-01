# DodoPayments Setup & Testing Guide

## ✅ What's Already Done

### Backend (Cloudflare Workers)
- [X] DodoPayments SDK installed
- [X] Service wrapper (`dodopayments-service.ts`)
- [X] Billing API routes (`/api/billing/*`)
- [X] Webhook handler (`/webhook/dodopayments`)
- [X] Database migration (`002_multi_provider_payments.sql`)
- [X] Router registration
- [X] Environment types

### Frontend (Next.js)
- [X] Payment service updated for DodoPayments
- [X] Checkout page (`/checkout`)
- [X] Success page (`/billing/success`)
- [X] Paywall component updated
- [X] All hooks work with new architecture

---

## 🚀 Setup Steps

### 1. Backend Environment Variables

**✅ ALREADY CONFIGURED in wrangler.toml:**
```toml
[vars]
DODO_PAYMENTS_ENVIRONMENT = "test_mode"
FRONTEND_URL = "http://localhost:3000"
```

**⚠️ REQUIRED: Set secrets manually with wrangler CLI:**

```bash
# Navigate to backend directory
cd old-backend-for-swift

# Add DodoPayments API key (from DodoPayments dashboard)
wrangler secret put DODO_PAYMENTS_API_KEY
# Paste your test API key when prompted

# Add webhook secret (from DodoPayments dashboard → Webhooks)
wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET
# Paste your webhook signing secret when prompted
```

**How to get these values:**
1. Log in to [DodoPayments Dashboard](https://app.dodopayments.com)
2. Go to **Settings → API Keys**
3. Copy your **Test Mode API Key** (starts with `dp_test_`)
4. Go to **Settings → Webhooks**
5. Copy the **Webhook Signing Secret**

**⚠️ Important Notes:**
- Never commit secrets to git
- Use `test_mode` API keys during development
- Switch to `live_mode` and production API keys only after testing
- Update `FRONTEND_URL` to your production domain before deploying

### 2. Run Database Migration

In Supabase SQL Editor, run:
```sql
-- Run the multi-provider migration
\i old-backend-for-swift/sql/002_multi_provider_payments.sql
```

Or copy/paste the contents of `002_multi_provider_payments.sql` into the SQL editor.

**What it does:**
- Adds `payment_provider` and `dodo_customer_id` columns to `users` table
- Creates `subscriptions` table (current state)
- Updates `subscription_history` table (multi-provider support)
- Creates `has_active_subscription()` helper function
- Sets up Row Level Security policies

### 3. Frontend Environment Variables

Create/update `web/.env.local`:
```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8787  # or your workers URL

# DodoPayments (not needed on frontend, handled by backend)
# No public keys needed!
```

### 4. Update Plan IDs

Edit `web/src/app/checkout/page.tsx`:
```typescript
const DEFAULT_PLANS: Plan[] = [
  {
    id: 'YOUR_ACTUAL_PRODUCT_ID',  // ← Replace with real product ID from DodoPayments
    name: 'Pro Monthly',
    price: 49900, // ₹499
    // ...
  },
];
```

Get product IDs from your DodoPayments dashboard.

---

## 🧪 Testing Flow

### Local Testing

#### 1. Start Backend (Cloudflare Workers)
```bash
cd old-backend-for-swift
npm run dev
# Runs on http://localhost:8787
```

#### 2. Start Frontend (Next.js)
```bash
cd web
npm run dev
# Runs on http://localhost:3000
```

#### 3. Test Checkout Flow

1. **Sign in with Google/Apple**
   - Go to http://localhost:3000
   - Click "Sign In"
   - Complete OAuth flow

2. **Go to Checkout**
   - Navigate to http://localhost:3000/checkout
   - Should see 2 plans (Monthly/Yearly)

3. **Click "Get Started"**
   - Should redirect to DodoPayments checkout
   - URL will be: `https://checkout.dodopayments.com/session/cs_xxx`

4. **Complete Test Payment**
   - Use DodoPayments test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVV
   - Complete checkout

5. **Verify Success**
   - Should redirect back to `/billing/success?session_id=cs_xxx`
   - Page should verify payment
   - Show success message
   - Redirect to dashboard

#### 4. Verify in Database

Check Supabase tables:
```sql
-- Check subscription created
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';

-- Check history logged
SELECT * FROM subscription_history WHERE user_id = 'your-user-id' ORDER BY created_at DESC;

-- Check user updated
SELECT payment_provider, dodo_customer_id FROM users WHERE id = 'your-user-id';
```

---

## 🔗 Webhook Setup

### For Local Testing (ngrok)

1. **Install ngrok** (if not already):
```bash
brew install ngrok  # macOS
# or download from https://ngrok.com/
```

2. **Start ngrok tunnel**:
```bash
ngrok http 8787
# You'll get a URL like: https://abc123.ngrok.io
```

3. **Configure in DodoPayments Dashboard**:
- Go to https://app.dodopayments.com/developer/webhooks
- Add webhook URL: `https://abc123.ngrok.io/webhook/dodopayments`
- Select events:
  - [X] `checkout.session.completed`
  - [X] `subscription.created`
  - [X] `subscription.updated`
  - [X] `subscription.cancelled`
  - [X] `payment.succeeded`
  - [X] `payment.failed`
- Save and copy the webhook signing secret
- Add to Cloudflare Workers: `wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET`

4. **Test webhook**:
```bash
# Watch your backend logs
npm run dev

# In another terminal, trigger a test purchase
# Webhook should be received and logged
```

### For Production

1. **Deploy Cloudflare Workers**:
```bash
cd old-backend-for-swift
wrangler deploy
# Note your workers URL: https://your-worker.workers.dev
```

2. **Update webhook URL**:
- DodoPayments dashboard → Webhooks
- Update URL to: `https://your-worker.workers.dev/webhook/dodopayments`

---

## 🐛 Troubleshooting

### Issue: "Invalid API key"
**Solution:** Check that `DODO_PAYMENTS_API_KEY` is set correctly:
```bash
wrangler secret list
# Should show DODO_PAYMENTS_API_KEY
```

### Issue: "Subscription not found after checkout"
**Solution:** Check webhook is firing:
1. Go to DodoPayments dashboard → Webhooks → Logs
2. Verify webhook was sent
3. Check your backend logs for webhook received
4. If webhook not received, verify ngrok tunnel is active

### Issue: "Customer already exists" error
**Solution:** The service handles this automatically. If you see this error:
- Check `users.dodo_customer_id` in database
- The service should find existing customer by `user_id` in metadata

### Issue: Plans not loading
**Solution:** 
1. Verify products exist in DodoPayments dashboard
2. Check `GET /api/billing/plans` endpoint returns data
3. Falls back to `DEFAULT_PLANS` in checkout page if API fails

### Issue: "CORS error" when calling API
**Solution:** Ensure backend `corsMiddleware` allows your frontend origin:
- Dev: `http://localhost:3000`
- Prod: Your production domain

---

## 📊 API Endpoints Reference

### Get Subscription Status
```bash
GET /api/billing/subscription
Authorization: Bearer <supabase-jwt-token>

Response:
{
  "subscription": {
    "hasActiveSubscription": true,
    "status": "active",
    "paymentProvider": "dodopayments",
    "planId": "plan_pro_monthly",
    "currentPeriodEnd": "2025-02-01T00:00:00Z"
  }
}
```

### Create Checkout Session
```bash
POST /api/billing/checkout/create
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "planId": "plan_pro_monthly",
  "returnUrl": "http://localhost:3000/billing/success"
}

Response:
{
  "sessionId": "cs_xxx",
  "checkoutUrl": "https://checkout.dodopayments.com/session/cs_xxx",
  "expiresAt": "2025-12-01T16:00:00Z"
}
```

### Cancel Subscription
```bash
POST /api/billing/cancel
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "reason": "Too expensive"
}

Response:
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

---

## 🎯 Next Steps

1. [ ] Run database migration
2. [ ] Add DodoPayments credentials to Workers
3. [ ] Update plan IDs in checkout page
4. [ ] Test checkout flow locally
5. [ ] Setup webhooks (ngrok for local, production URL for prod)
6. [ ] Test subscription lifecycle (create, renew, cancel)
7. [ ] Deploy to production

---

## 📝 Notes

- **Test Mode**: All transactions in `test_mode` are simulated (no real money)
- **Webhook Retries**: DodoPayments automatically retries failed webhooks
- **Customer Portal**: Users can manage subscriptions via DodoPayments portal (link in `/api/billing/portal`)
- **Mobile**: RevenueCat still used for iOS/Android (not affected by this)

---

## 🆘 Need Help?

1. **DodoPayments Docs**: https://docs.dodopayments.com
2. **DodoPayments Discord**: https://discord.gg/bYqAp4ayYh
3. **Check Logs**:
   - Backend: `wrangler tail` or local console
   - Frontend: Browser console
   - Webhooks: DodoPayments dashboard → Webhooks → Logs

## ✅ Verification Checklist

After setup, verify:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can sign in with Google/Apple
- [ ] Checkout page loads with plans
- [ ] Can click "Get Started" and redirect to DodoPayments
- [ ] Can complete test payment
- [ ] Redirects to success page
- [ ] Subscription appears in database
- [ ] Webhook fires and creates subscription_history entry
- [ ] Dashboard shows active subscription

Good luck! 🚀
