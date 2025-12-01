# Quickstart: SaaS Release Implementation

**Status**: Phase 1 Design Complete  
**For**: Developers implementing auth, billing, and account features

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or via Supabase)
- Supabase account (free tier sufficient for development)
- Resend account (for transactional email)
- RevenueCat account (for payment processing)

---

## Local Development Setup

### 1. Clone and Install

```bash
cd /Users/rinshin/Code/apps/youplus-web

# Install dependencies
npm install

# Install new dependencies for this feature
npm install --save-dev playwright@latest jest @types/jest
npm install --save resend@latest
```

### 2. Environment Configuration

Create `.env.local` in the `web/` directory:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Auth
NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL=http://localhost:3000

# Resend (email)
RESEND_API_KEY=your-resend-api-key

# RevenueCat (payments)
NEXT_PUBLIC_REVENUECAT_API_KEY=your-api-key
REVENUECAT_SECRET_KEY=your-secret-key
```

For backend, create `.env` in `old-backend-for-swift/`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
REVENUECAT_API_KEY=your-api-key
```

### 3. Database Setup

Run migrations to add new tables:

```bash
# Using Supabase CLI
supabase migration new add_auth_tables
supabase migration up

# Or manually in Supabase console:
# Copy SQL from data-model.md into Supabase SQL Editor
```

### 4. Start Development

```bash
# Terminal 1: Frontend (Next.js)
cd web
npm run dev
# Open http://localhost:3000

# Terminal 2: Backend (Cloudflare Workers)
cd old-backend-for-swift
npm run dev
# Runs on http://localhost:8787
```

---

## Feature Implementation Workflow

### Phase 1: Authentication (Highest Priority)

**User Stories Implemented**: US1 (Signup), US2 (Login)

**Files to Create**:

1. **Frontend Components** (`web/src/components/auth/`)
   - LoginForm.tsx
   - SignupForm.tsx
   - ResetPasswordForm.tsx

2. **Frontend Pages** (`web/src/app/auth/`)
   - login/page.tsx
   - signup/page.tsx
   - reset-password/page.tsx

3. **Frontend Hooks** (`web/src/hooks/`)
   - useAuth.ts (context for logged-in state)

4. **Backend Routes** (`old-backend-for-swift/src/routes/`)
   - auth.ts (signup, login, logout, refresh)

5. **Email Templates** (Resend)
   - Welcome email template
   - Password reset template

### Phase 2: Subscription & Trial (High Priority)

**User Stories Implemented**: US3 (Account Settings), US4 (Legal Pages)

**Files to Create**:

1. **Frontend Components** (`web/src/components/billing/`)
   - SubscriptionStatus.tsx
   - PaymentForm.tsx
   - BillingHistory.tsx

2. **Frontend Pages** (`web/src/app/`)
   - account/settings/page.tsx
   - account/billing/page.tsx
   - account/subscription/page.tsx
   - legal/terms/page.tsx
   - legal/privacy/page.tsx
   - checkout/page.tsx

3. **Backend Routes** (`old-backend-for-swift/src/routes/`)
   - billing.ts (subscription, payment history, cancellation)
   - account.ts (profile, settings, deletion)

4. **Email Templates** (Resend)
   - Payment receipt template
   - Subscription confirmation template
   - Cancellation confirmation template

### Phase 3: Observability (Medium Priority)

**Setup Error Tracking**:

```bash
npm install --save @sentry/nextjs @sentry/hono
```

Configure in:
- `web/next.config.ts` (Next.js Sentry)
- `old-backend-for-swift/src/index.ts` (Hono Sentry)

---

## Testing Strategy

### Integration Tests (Playwright)

Critical paths require integration tests:

```bash
# Create test file
web/tests/integration/auth.test.ts

# Test flow: Signup → email verification → login → dashboard
npx playwright test auth.test.ts
```

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test('signup flow', async ({ page }) => {
  // Navigate to signup
  await page.goto('/auth/signup');
  
  // Fill form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePassword123!');
  
  // Submit
  await page.click('button:has-text("Create Account")');
  
  // Verify redirect and trial message
  await expect(page).toHaveURL('/onboarding');
  await expect(page.locator('text=Your 7-day trial starts now')).toBeVisible();
});
```

### Unit Tests (Jest)

Test services and utilities:

```bash
web/tests/unit/validation.test.ts
```

---

## Key Files Reference

### Frontend Auth Hook

```typescript
// web/src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for token on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // Verify token with backend
      fetchUserProfile(token).then(setUser);
    }
    setLoading(false);
  }, []);

  return { user, loading, login, logout, signup };
}
```

### Backend Auth Endpoint

```typescript
// old-backend-for-swift/src/routes/auth.ts
router.post('/auth/signup', async (c) => {
  const { email, password } = await c.req.json();
  
  // Create user in Supabase Auth
  const { user, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) return c.json({ error: error.message }, 400);
  
  // Create user record in users table with trial
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  
  await supabase.from('users').insert({
    id: user.id,
    email,
    trial_start_date: new Date(),
    trial_end_date: trialEnd,
  });
  
  // Send welcome email
  await resend.emails.send({
    from: 'YOU+ <welcome@youplus.app>',
    to: email,
    subject: 'Welcome to YOU+ - Your 7-Day Trial Starts Now',
    html: welcomeEmailTemplate(email),
  });
  
  return c.json({ success: true });
});
```

---

## Common Tasks

### Adding a New Auth Field

1. Add column to `users` table migration
2. Update Supabase RLS policy
3. Update `UserProfile` schema in data-model.md
4. Update API response model
5. Update frontend component to display/edit field
6. Add test case

### Implementing a New Email Type

1. Create template function in backend email-service.ts
2. Add email_type to enum in failed_login_attempts schema
3. Trigger send from relevant endpoint
4. Test with Resend email preview
5. Add integration test for email being sent

### Debugging Payment Issues

```bash
# Check RevenueCat webhook logs
# Dashboard: https://app.revenuecat.com/dashboard

# Check failed_payments in database
SELECT * FROM subscription_history 
WHERE event_type = 'payment_failed' 
ORDER BY created_at DESC LIMIT 10;

# Resend email delivery
# Dashboard: https://resend.com/emails
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All critical path integration tests pass
- [ ] Environment variables configured (no hardcoded secrets)
- [ ] RevenueCat webhook signature validated
- [ ] Sentry error tracking enabled
- [ ] Database backups configured
- [ ] HTTPS enforced
- [ ] CORS configured to production domain only
- [ ] Rate limiting enabled (5 failed logins/hour)
- [ ] Password requirements enforced (8+ chars)
- [ ] Email templates reviewed for branding
- [ ] Legal pages linked from footer
- [ ] Account deletion flow tested (30-day grace period)

---

## Architecture Decisions at a Glance

| Component | Technology | Why |
|-----------|------------|-----|
| Frontend Auth | Supabase Auth (via Next.js SDK) | Built-in, JWT-based |
| Sessions | JWT + HTTP-only cookie | Stateless backend, XSS protection |
| Email | Resend | Next.js native, TypeScript templates |
| Payments | RevenueCat | Already integrated in backend |
| Database | Supabase (PostgreSQL) | Existing, RLS support |
| Error Tracking | Sentry | Next.js integration, free tier |
| Testing | Jest + Playwright | Critical paths require integration tests |

---

## Next Steps

1. ✅ Phase 1 design and contracts complete
2. ⏭️ Run `/speckit.tasks` to generate implementation task breakdown
3. ⏭️ Begin Phase 2 implementation (create components/pages/routes)
4. ⏭️ Phase 3 deployment and monitoring

## Support

- Supabase Docs: https://supabase.com/docs
- Resend Docs: https://resend.com/docs
- RevenueCat Docs: https://www.revenuecat.com/docs
- YOU+ Architecture: See ARCHITECTURE_BACKEND.md
