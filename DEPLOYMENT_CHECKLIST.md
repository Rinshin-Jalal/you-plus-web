# 🚀 DodoPayments Deployment Checklist

Complete these steps in order before testing or deploying the billing system.

---

## ☐ Step 1: Set Up DodoPayments Account

### Actions:
1. [ ] Create account at [DodoPayments](https://dodopayments.com)
2. [ ] Complete business verification (if required)
3. [ ] Enable payment methods: UPI, Cards, Wallets
4. [ ] Set up bank account for payouts

### Get API Credentials:
1. [ ] Go to **Settings → API Keys**
2. [ ] Copy **Test Mode API Key** (starts with `dp_test_`)
3. [ ] Save for later use

---

## ☐ Step 2: Create Products in DodoPayments

### Actions:
1. [ ] Go to **Dashboard → Products**
2. [ ] Create product: **YOU+ Pro Monthly**
   - Price: ₹499 (49900 paise)
   - Currency: INR
   - Billing interval: Monthly
   - Copy the **Product ID** (e.g., `prod_abc123`)
3. [ ] Create product: **YOU+ Pro Yearly**
   - Price: ₹4,990 (499000 paise)
   - Currency: INR
   - Billing interval: Yearly
   - Copy the **Product ID** (e.g., `prod_xyz789`)

### Save Product IDs:
```
Monthly Plan ID: ________________
Yearly Plan ID:  ________________
```

---

## ☐ Step 3: Run Database Migration

### Actions:
1. [ ] Open Supabase Dashboard → SQL Editor
2. [ ] Run migration: `old-backend-for-swift/sql/002_multi_provider_payments.sql`
3. [ ] Verify tables created:
   - [ ] `subscriptions` table exists
   - [ ] `subscription_history` updated with new columns
   - [ ] `users` table has `payment_provider` and `dodo_customer_id` columns
4. [ ] Test function: `SELECT has_active_subscription('test-user-id');`

---

## ☐ Step 4: Configure Backend Environment

### Actions:
1. [ ] Navigate to backend: `cd old-backend-for-swift`
2. [ ] Set DodoPayments API key:
   ```bash
   wrangler secret put DODO_PAYMENTS_API_KEY
   # Paste test API key when prompted
   ```
3. [ ] Set webhook secret (generate in DodoPayments dashboard):
   ```bash
   wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET
   # Paste webhook signing secret when prompted
   ```
4. [ ] Verify `wrangler.toml` has correct values:
   ```toml
   [vars]
   DODO_PAYMENTS_ENVIRONMENT = "test_mode"
   FRONTEND_URL = "http://localhost:3000"
   ```

---

## ☐ Step 5: Update Frontend Product IDs

### Actions:
1. [ ] Open `web/src/app/checkout/page.tsx`
2. [ ] Replace placeholder IDs with real product IDs from Step 2:
   ```typescript
   const DEFAULT_PLANS: Plan[] = [
     {
       id: 'YOUR_MONTHLY_PRODUCT_ID', // ← Paste from Step 2
       name: 'Pro Monthly',
       // ...
     },
     {
       id: 'YOUR_YEARLY_PRODUCT_ID', // ← Paste from Step 2
       name: 'Pro Yearly',
       // ...
     },
   ];
   ```
3. [ ] Save the file

---

## ☐ Step 6: Configure Webhooks (For Local Testing)

### Actions:
1. [ ] Install ngrok (if not already): `brew install ngrok` or download from [ngrok.com](https://ngrok.com)
2. [ ] Start backend server:
   ```bash
   cd old-backend-for-swift
   npm run dev
   # Should run on port 8787
   ```
3. [ ] In new terminal, start ngrok:
   ```bash
   ngrok http 8787
   ```
4. [ ] Copy ngrok URL (e.g., `https://abc123.ngrok-free.app`)
5. [ ] Go to DodoPayments Dashboard → **Settings → Webhooks**
6. [ ] Click **Add Endpoint**
7. [ ] Set webhook URL: `https://abc123.ngrok-free.app/webhook/dodopayments`
8. [ ] Select events to listen to:
   - [ ] `checkout.session.completed`
   - [ ] `subscription.created`
   - [ ] `subscription.updated`
   - [ ] `subscription.cancelled`
   - [ ] `payment.succeeded`
   - [ ] `payment.failed`
9. [ ] Copy the **Webhook Signing Secret**
10. [ ] Update backend secret:
    ```bash
    wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET
    # Paste the signing secret
    ```

---

## ☐ Step 7: Start Local Development

### Actions:
1. [ ] Start backend (if not already running):
   ```bash
   cd old-backend-for-swift
   npm run dev
   # Port 8787
   ```
2. [ ] Start frontend in new terminal:
   ```bash
   cd web
   npm run dev
   # Port 3000
   ```
3. [ ] Verify servers are running:
   - Backend: http://localhost:8787
   - Frontend: http://localhost:3000

---

## ☐ Step 8: Test the Payment Flow

### Test Scenario 1: Successful Payment
1. [ ] Go to http://localhost:3000
2. [ ] Sign in with Google/Apple OAuth
3. [ ] Navigate to `/checkout` page
4. [ ] Should see two plans with correct pricing
5. [ ] Click "Get Started" on Monthly plan
6. [ ] Should redirect to DodoPayments checkout page
7. [ ] Use test payment details:
   - Card: 4242 4242 4242 4242
   - CVV: Any 3 digits
   - Expiry: Any future date
8. [ ] Complete payment
9. [ ] Should redirect back to `/billing/success`
10. [ ] Should see "Payment successful!" message
11. [ ] Verify in Supabase:
    ```sql
    SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
    SELECT * FROM subscription_history WHERE user_id = 'your-user-id';
    ```
12. [ ] Check webhook logs in terminal
13. [ ] Verify dashboard shows subscription status

### Test Scenario 2: Failed Payment
1. [ ] Try checkout with test card: 4000 0000 0000 0002 (declined)
2. [ ] Should show error message
3. [ ] Should NOT create subscription in database
4. [ ] Check webhook received `payment.failed` event

### Test Scenario 3: Cancel Subscription
1. [ ] Go to `/dashboard` with active subscription
2. [ ] Click "Manage Subscription" or "Cancel"
3. [ ] Should redirect to customer portal or process cancellation
4. [ ] Verify subscription status updated in database

---

## ☐ Step 9: Production Deployment Preparation

### Before deploying to production:
1. [ ] Switch to live mode in DodoPayments:
   - Get **Live Mode API Key** from dashboard
   - Update secret: `wrangler secret put DODO_PAYMENTS_API_KEY` (live key)
2. [ ] Update `wrangler.toml`:
   ```toml
   [vars]
   DODO_PAYMENTS_ENVIRONMENT = "live_mode"
   FRONTEND_URL = "https://your-production-domain.com"
   ```
3. [ ] Create products in **Live Mode** (same as test products)
4. [ ] Update frontend product IDs (use live product IDs)
5. [ ] Configure production webhook URL:
   - Go to DodoPayments Dashboard (live mode)
   - Set webhook: `https://your-workers-domain.workers.dev/webhook/dodopayments`
   - Copy new webhook secret
   - Update: `wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET`
6. [ ] Deploy backend:
   ```bash
   cd old-backend-for-swift
   wrangler deploy
   ```
7. [ ] Update frontend `.env.production`:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-workers-domain.workers.dev
   ```
8. [ ] Deploy frontend:
   ```bash
   cd web
   npm run build
   vercel --prod  # or your deployment method
   ```

---

## ☐ Step 10: Post-Deployment Verification

### Actions:
1. [ ] Test live payment flow (use real card or UPI)
2. [ ] Verify webhooks working in production
3. [ ] Check Supabase tables populated correctly
4. [ ] Monitor DodoPayments dashboard for transactions
5. [ ] Test subscription cancellation
6. [ ] Verify customer portal access
7. [ ] Check email notifications (if configured)

---

## 🔍 Troubleshooting Reference

If something fails, check:
- **DODOPAYMENTS_SETUP.md** - Detailed troubleshooting guide
- **Backend logs**: `wrangler tail` or Cloudflare dashboard
- **Frontend console**: Browser DevTools
- **DodoPayments dashboard**: Transaction logs
- **Webhook logs**: DodoPayments → Settings → Webhooks
- **Database**: Query `subscriptions` and `subscription_history` tables

---

## 📋 Quick Command Reference

```bash
# Backend
cd old-backend-for-swift
wrangler secret put DODO_PAYMENTS_API_KEY
wrangler secret put DODO_PAYMENTS_WEBHOOK_SECRET
npm run dev
wrangler tail  # View logs

# Frontend
cd web
npm run dev
npm run build

# Webhook testing
ngrok http 8787

# Database
# Run in Supabase SQL Editor:
SELECT * FROM subscriptions;
SELECT * FROM subscription_history;
SELECT has_active_subscription('user-id');
```

---

## ✅ Completion Status

- [ ] All steps completed
- [ ] Local testing successful
- [ ] Production deployed
- [ ] Post-deployment verified

**Date completed**: ___________

**Deployed by**: ___________

**Production URLs**:
- Frontend: ___________
- Backend: ___________
- Webhook: ___________
