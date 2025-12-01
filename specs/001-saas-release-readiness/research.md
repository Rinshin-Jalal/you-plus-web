# Research: SaaS Release Readiness

**Phase**: 0 Research & Design Decisions  
**Date**: 2025-12-01  
**Status**: Complete

---

## Decision 1: Email Service Provider

**Question**: Which transactional email provider for welcome emails, password reset, payment receipts?

**Decision**: **Resend**

**Rationale**:
- Optimized for Next.js/TypeScript (same ecosystem as frontend)
- Email template support with TypeScript/JSX (vs string templates in competitors)
- Competitive pricing ($0.20/email after free tier)
- Built-in DKIM/SPF/DMARC configuration
- Simple API (matches existing YOU+ simplicity preference)

**Alternatives Considered**:
- SendGrid: Industry standard but more complex UI, older API
- Mailgun: Good but less Next.js-native
- AWS SES: Cheapest but requires Lambda integration complexity

**Implementation Impact**: 
- Add Resend SDK to backend package.json
- Create email-service.ts in backend for templating
- No frontend changes needed (async backend operation)

---

## Decision 2: Payment UI Integration

**Question**: How to integrate RevenueCat payment collection into web platform?

**Decision**: **Redirect to RevenueCat-hosted paywall**

**Rationale**:
- RevenueCat provides managed hosted paywall (no PCI compliance burden)
- Reduces frontend complexity (no payment form handling)
- Mobile app already uses RevenueCat; consistent UX
- Webhook updates subscription status automatically

**Alternatives Considered**:
- Stripe Elements embedded: More control but PCI scope expansion
- RevenueCat native SDK: Not optimized for web, mobile-first

**Implementation Impact**:
- Generate unique link per user pointing to RevenueCat paywall
- Deep link passes user ID and return URL (comes back to dashboard)
- Webhook from RevenueCat updates subscription status
- Checkout page is minimal (just redirect button + pricing summary)

---

## Decision 3: Session Management Strategy

**Question**: JWT vs session cookies vs both for web auth?

**Decision**: **JWT tokens + HTTP-only cookies**

**Rationale**:
- Supabase Auth provides JWTs natively (leverage existing)
- HTTP-only cookies prevent XSS token theft
- Allows stateless backend (Cloudflare Workers constraint)
- Refresh token rotation prevents long-lived exposure

**Alternatives Considered**:
- JWT only: Vulnerable to XSS if stored in localStorage
- Sessions only: Requires backend state (Workers limitation)

**Implementation Impact**:
- Supabase library automatically manages tokens
- Frontend middleware checks cookie + verifies JWT
- Refresh token stored in HTTP-only cookie, rotated on each use
- Logout clears cookie server-side

---

## Decision 4: Trial Tracking Architecture

**Question**: How to track trial status without separate table?

**Decision**: **Add trial_start_date and trial_end_date columns to users table**

**Rationale**:
- Minimizes schema changes (no new tables)
- Trial status computed at auth time: `now() < trial_end_date AND trial_start_date IS NOT NULL`
- Backward compatible with existing user table
- Subscription API (RevenueCat) provides authoritative source for paid status

**Alternatives Considered**:
- Separate trials table: Over-engineered for MVP
- subscription_status column: Harder to compute trial expiry programmatically

**Implementation Impact**:
- Database migration: Add two nullable timestamp columns
- Auth middleware: Check trial_end_date before subscription check
- API endpoint: Returns trial_remaining_days in auth response

---

## Decision 5: Password Reset Flow

**Question**: Email link vs OTP vs Social login for password recovery?

**Decision**: **Email link (time-limited, one-use token)**

**Rationale**:
- Supabase Auth provides native password reset (no implementation needed)
- Industry standard (familiar to users)
- More secure than OTP (can't be intercepted in messaging)

**Alternatives Considered**:
- OTP: More user-friendly but harder to implement correctly
- Social login only: Excludes users without Google/Apple

**Implementation Impact**:
- Use Supabase Auth's `resetPasswordForEmail()` method
- Custom email template (via Resend) for branding
- Link redirects to `/auth/reset-password?token=XXX`
- Frontend form submits new password + token to Supabase

---

## Decision 6: Test Strategy for Critical Paths

**Question**: Unit vs Integration vs E2E for auth/payment flows?

**Decision**: **Integration tests (Playwright) for critical paths, Jest for services**

**Rationale**:
- Auth/payment involve multiple systems (frontend + backend + external services)
- Playwright can test actual signup flow: form → submission → redirect → verify
- Jest services: Test email formatting, RevenueCat wrapper logic
- Constitution Principle III: Test-first mandatory for critical paths

**Coverage**:
- Integration: signup → dashboard, login → dashboard, payment → subscription update
- Jest: email templates render correctly, RevenueCat API calls formatted right
- E2E: Not needed for MVP (manual testing by QA sufficient)

**Implementation Impact**:
- Add Playwright to frontend test suite
- Create fixtures for test users + mock RevenueCat responses
- Integration tests in CI/CD before merge to main

---

## Decision 7: Legal Document Management

**Question**: How to version and display Privacy Policy and Terms?

**Decision**: **Store as markdown in repo, render as pages**

**Rationale**:
- Version control (see diffs, audit changes)
- Keep copies for signature/timestamp (legal requirement)
- Easy to update without code changes
- Mobile app can link to same URLs

**Alternatives Considered**:
- Database: Overkill for infrequently-changing content
- External service (Termly): Cost + vendor lock-in

**Implementation Impact**:
- Create `/docs/legal/privacy-policy.md` and `/docs/legal/terms-of-service.md`
- Frontend pages fetch and render as HTML
- Signature line: "Last updated [DATE] at [TIME]"
- Add version tracking in metadata (v1.0, v1.1, etc.)

---

## Decision 8: Error Monitoring & Logging

**Question**: Which error tracking service for production issues?

**Decision**: **Sentry (free tier for MVP, scale as needed)**

**Rationale**:
- Next.js integration native (2-line setup)
- Captures frontend + backend errors with context
- Free tier: 5k events/month (sufficient for MVP <50k users)
- Constitution Principle V: Observability required

**Alternatives Considered**:
- Rollbar: Similar but less Next.js optimized
- Custom logging: Not worth maintaining vs Sentry cost

**Implementation Impact**:
- Add Sentry SDK to Next.js and backend
- Configure environment variable for DSN (different per staging/prod)
- Alert on critical error spikes (threshold: 100 errors/hour)

---

## Technology Stack Summary

| Layer | Technology | Decision | Notes |
|-------|-----------|----------|-------|
| Frontend | Next.js 16 + React 19 | Existing | No change |
| Auth | Supabase Auth | Existing | Add JWT refresh logic |
| Email | Resend | NEW | Async queue + retry |
| Payment | RevenueCat | Existing | Add hosted paywall integration |
| Sessions | HTTP-only cookies + JWT | NEW | Implement refresh rotation |
| Database | Supabase (PostgreSQL) | Existing | Add trial columns |
| Errors | Sentry | NEW | Frontend + backend tracking |
| Testing | Jest + Playwright | NEW | Integration tests required |
| Hosting | Vercel + Cloudflare Workers | Existing | No change |

---

## Next Steps

1. ✅ Phase 0 research complete
2. ⏭️ Phase 1: Create data-model.md (database schema design)
3. ⏭️ Phase 1: Create contracts/ (API specifications)
4. ⏭️ Phase 1: Create quickstart.md (developer onboarding)
5. ⏭️ Phase 2: Generate tasks.md (implementation work breakdown)
