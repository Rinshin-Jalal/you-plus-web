# Tasks: SaaS Release Readiness (Phase 1) - UPDATED

**Input**: Design documents from `/specs/001-saas-release-readiness/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**ARCHITECTURE CHANGES** (vs original spec):
- **Auth**: Google/Apple OAuth via Supabase (NOT email/password)
- **Payments**: DodoPayments for web (NOT RevenueCat)
- **Trial**: No 7-day trial - direct payment flow
- **Flow**: Guest checkout → Payment → Sign-in → Dashboard

---

## Phase 1: Setup & Infrastructure ✅ COMPLETED

- [x] T001-T007: Directory structure, dependencies, configs, Jest, Playwright

---

## Phase 2: Foundational (Blocking Prerequisites) 🟡 ~90% DONE

### Database & Backend ✅ DONE
- [x] T008-T010: Database migrations applied (subscription_history, user columns)
- [x] T011: Supabase Auth middleware (`requireAuth`, `requireActiveSubscription`)
- [x] T012: Error handling middleware

### Frontend Services ✅ DONE
- [x] T016: Supabase client configuration
- [x] T017: API client with token refresh
- [x] T018: Auth service (Google/Apple OAuth)
- [x] T019: Payment service (DodoPayments integration)

### State Management ✅ DONE
- [x] T021: Auth context/hook (`useAuth.tsx`)
- [x] T022: Subscription hook (`useSubscription.ts`)
- [x] T023: Form error hook (`useFormError.ts`)

### UI Components ✅ DONE
- [x] T025-T028: FormError, Paywall, AuthGuard, SubscriptionGuard

### Remaining
- [ ] T019: Validation utility (`old-backend-for-swift/src/utils/validation.ts`)
- [ ] T020: Error handling utility (`web/src/utils/errors.ts`)
- [ ] T029: Sentry SDK for frontend
- [ ] T030: Sentry for backend
- [ ] T031: Structured logging utility

---

## Phase 3: User Story 1 - New User Signup & Payment 🟡 IMPLEMENTED (DIFFERENT FLOW)

**Original**: Email signup → 7-day trial → Payment on expiry  
**Actual**: Landing → Onboarding → Guest Checkout → DodoPayments → Sign-in → Dashboard

### What's Built ✅
- [x] Guest checkout flow (`POST /api/billing/checkout/create-guest`)
- [x] Checkout page (`/checkout`)
- [x] Billing success page (`/billing/success`) with sign-in buttons
- [x] Auth callback with smart routing
- [x] DodoPayments integration (customer creation, checkout sessions)
- [x] Plans endpoint (`GET /api/billing/plans`)

### Not Implemented (deferred)
- [ ] Welcome email on signup
- [ ] Integration tests for new flow

---

## Phase 4: User Story 2 - Returning User Login 🟡 IMPLEMENTED (OAUTH)

**Original**: Email/password login, password reset, lockout  
**Actual**: Google/Apple OAuth, returning user detection

### What's Built ✅
- [x] Login page (`/auth/login`) with Google/Apple OAuth
- [x] Signup page (`/auth/signup`)
- [x] Auth callback (`/auth/callback`) with smart routing:
  - Active subscription + onboarding → Dashboard
  - Active subscription + no onboarding → Onboarding
  - Returning user (had subscription before) → `/onboarding/returning`
  - New user → Onboarding
- [x] Returning user onboarding page with Gemini AI personalization
- [x] Session persistence via Supabase

### Not Needed (OAuth handles)
- ~~Password reset flow~~
- ~~Lockout after failed attempts~~
- ~~Email/password forms~~

---

## Phase 5: User Story 3 - Subscription Management ✅ COMPLETED

**Goal**: Users manage subscriptions, view billing, cancel without support

### Backend ✅ DONE
- [x] `GET /api/billing/subscription` - subscription status
- [x] `GET /api/billing/history` - billing history
- [x] `POST /api/billing/cancel` - cancel subscription
- [x] `GET /api/billing/portal` - DodoPayments customer portal

### Frontend ✅ DONE
- [x] T086: SubscriptionStatus component (`web/src/components/account/SubscriptionStatus.tsx`)
- [x] T087: BillingHistory component (`web/src/components/account/BillingHistory.tsx`)
- [x] T089: CancelSubscriptionForm component (`web/src/components/account/CancelSubscriptionForm.tsx`)
- [x] T090: FailedPaymentBanner component (`web/src/components/account/FailedPaymentBanner.tsx`)
- [x] T091: Account settings page (`/account/settings`)
- [x] T092: Billing page (`/account/billing`)
- [x] T093: Subscription management page (`/account/subscription`)
- [x] T097: Account service (`web/src/services/account.ts`)

### Backend Account Routes ❌ TODO (deferred - using Supabase Auth for profile)
- [ ] T107-T110: Account profile endpoints (GET/PUT/DELETE) - optional, can use Supabase directly

---

## Phase 6: User Story 4 - Legal Pages ✅ COMPLETED

**Goal**: Privacy Policy, Terms of Service

- [x] Privacy Policy page (`/legal/privacy`) - comprehensive, covers:
  - Data collected (account, onboarding, voice, payments)
  - Third-party services (Supabase, DodoPayments, Gemini, Cartesia, LiveKit, Cloudflare)
  - Voice recording usage (transcription + cloning only, NOT training)
  - User rights (access, correction, deletion, portability)
  - GDPR/CCPA compliance sections
  - 18+ age requirement
  - 14-day data retention after deletion
- [x] Terms of Service page (`/legal/terms`) - covers:
  - 18+ eligibility requirement
  - Service description
  - Voice recording consent
  - Subscription terms (auto-renewal, no refunds, appeal process)
  - NOT medical/therapeutic advice disclaimer
  - Acceptable use policy
  - Limitation of liability
  - Dispute resolution (India jurisdiction)
- [x] LegalFooter component (`web/src/components/shared/LegalFooter.tsx`)
- [x] Added legal links to login page and checkout page

---

## Phase 7: Transactional Emails ⏸️ DEFERRED (6+ months)

Skipped for MVP - add welcome emails, payment receipts later.

---

## Phase 8: Production Monitoring ⏸️ DEFERRED (post-launch)

Sentry error tracking, structured logging - add after launch when needed.

---

## Phase 9: Polish & QA ✅ COMPLETED

- [x] Test end-to-end flow (build passes, all pages verified)
- [x] Fixed landing page footer - linked to /legal/terms and /legal/privacy
- [x] Fixed Dashboard Settings button - now links to /account/settings
- [ ] Code cleanup, security audit (optional, post-launch)

---

## Quick Reference: What's Different

| Original Spec | What We Built |
|--------------|---------------|
| Email/password signup | Google/Apple OAuth |
| 7-day free trial | Direct payment (no trial) |
| RevenueCat for payments | DodoPayments for web |
| Transactional emails | Deferred |
| Sentry monitoring | Deferred |

---

## Priority Order for MVP

1. ~~**Fix build error**~~ ✅ Fixed (Suspense boundary)
2. ~~**Phase 5 frontend**~~ ✅ Completed (Account/billing pages)
3. ~~**Phase 6**~~ ✅ Completed (Legal pages - Privacy Policy, Terms of Service)
4. ~~**Test end-to-end flow**~~ ✅ Completed (Build passes, all pages verified)
5. **Deploy** ← READY

---

## GitHub Issues Status

**Closed**: ~93 issues  
**Open**: Phase 6, 9 remaining
