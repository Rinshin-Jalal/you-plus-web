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
- [x] Link guest checkout to user (`POST /api/billing/link-guest-checkout`)
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

## Phase 5: User Story 3 - Subscription Management ❌ FRONTEND NEEDED

**Goal**: Users manage subscriptions, view billing, cancel without support

### Backend ✅ DONE
- [x] `GET /api/billing/subscription` - subscription status
- [x] `GET /api/billing/history` - billing history
- [x] `POST /api/billing/cancel` - cancel subscription
- [x] `GET /api/billing/portal` - DodoPayments customer portal

### Frontend ❌ TODO
- [ ] T086: SubscriptionStatus component
- [ ] T087: BillingHistory component
- [ ] T089: CancelSubscriptionForm component
- [ ] T090: FailedPaymentBanner component
- [ ] T091: Account settings page (`/account/settings`)
- [ ] T092: Billing page (`/account/billing`)
- [ ] T093: Subscription management page (`/account/subscription`)
- [ ] T094-T096: Payment service extensions (frontend)
- [ ] T097: Account service (`web/src/services/account.ts`)

### Backend Account Routes ❌ TODO
- [ ] T107-T110: Account profile endpoints (GET/PUT/DELETE)

---

## Phase 6: User Story 4 - Legal Pages ❌ NOT STARTED

**Goal**: Privacy Policy, Terms of Service

- [ ] T114-T115: TermsOfService, PrivacyPolicy components
- [ ] T117: LegalFooter component
- [ ] T118-T119: Legal pages (`/legal/terms`, `/legal/privacy`)
- [ ] T120: Add LegalFooter to layout
- [ ] T121-T122: Write actual legal documents
- [ ] T123: Store as markdown for version control
- [ ] T124-T127: Terms acceptance tracking (optional)

---

## Phase 7: User Story 5 - Transactional Emails ❌ NOT STARTED

**Goal**: Reliable email delivery with Resend

- [ ] T130-T132: Email service with retry, queue processor, webhook handler
- [ ] T133-T137: Email templates (welcome, payment receipt, failed payment, subscription change)
- [ ] T139-T143: Email retry policy, delivery dashboard, tests

---

## Phase 8: User Story 6 - Production Monitoring ❌ NOT STARTED

**Goal**: Error tracking, logging, health checks

- [ ] T144-T146: Sentry setup (frontend + backend)
- [ ] T147-T150: Structured logging
- [ ] T151-T153: Metrics collection
- [ ] T155-T157: CI/CD workflows
- [ ] T159-T163: Health checks, alerts, runbooks, disaster recovery

---

## Phase 9: Polish & QA ❌ NOT STARTED

- [ ] T164-T165: Run all tests
- [ ] T166-T168: Code cleanup, security audit, performance
- [ ] T169-T173: Documentation, deployment checklist

---

## Quick Reference: What's Different

| Original Spec | What We Built |
|--------------|---------------|
| Email/password signup | Google/Apple OAuth |
| 7-day free trial | Direct payment (no trial) |
| RevenueCat for payments | DodoPayments for web |
| Email verification | OAuth handles this |
| Password reset flow | Not needed (OAuth) |
| Lockout after 5 failures | Not needed (OAuth) |
| Resend for emails | Not implemented yet |
| RevenueCat webhooks | DodoPayments webhooks |

---

## Priority Order for MVP

1. **Fix type error** in OnboardingFlow.tsx
2. **Test end-to-end flow** (Guest checkout → Sign-in → Dashboard)
3. **Add Phase 5 frontend** (Account/billing pages)
4. **Add Phase 6** (Legal pages - required for launch)
5. **Add Phase 8** (Sentry monitoring)
6. **Deploy**

---

## GitHub Issues Status

**Closed**: ~93 issues (email/password auth, password reset, RevenueCat, trial logic, completed tasks)  
**Open**: ~74 issues (Phase 5-9 remaining work)
