# Tasks: SaaS Release Readiness (Phase 1)

**Input**: Design documents from `/specs/001-saas-release-readiness/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

**Tests**: Integration tests (Playwright) required for critical auth/payment paths per Constitution Principle III.

---

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Tasks that can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, etc.) - REQUIRED for story phases only
- Exact file paths included for all tasks

---

## Phase 1: Setup & Infrastructure ✅ COMPLETED

**Purpose**: Project initialization and foundational structure

- [X] T001 Create directory structure for auth, billing, and account features in `web/src/app/`, `web/src/components/`, `web/src/hooks/`, `old-backend-for-swift/src/routes/`
- [X] T002 [P] Install project dependencies: `npm install --save-dev playwright@latest jest @types/jest` in `web/`
- [X] T003 [P] Install backend dependencies: `npm install --save resend@latest` in `old-backend-for-swift/` (later removed - not needed for Google/Apple OAuth only)
- [X] T004 Create `.env.local` template for web in `web/` with placeholders for SUPABASE_URL, RESEND_API_KEY, REVENUECAT_API_KEY
- [X] T005 Create `.env` template for backend in `old-backend-for-swift/` with placeholders for Supabase and external service keys
- [X] T006 Initialize Jest configuration in `web/jest.config.js` with Playwright support
- [X] T007 Initialize Playwright configuration in `web/playwright.config.ts` for E2E critical path testing

---

## Phase 2: Foundational (Blocking Prerequisites) 🟡 IN PROGRESS

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Services

- [X] T008 Create Supabase migration script for new tables in `old-backend-for-swift/sql/`: `subscription_history` ONLY (simplified - no email tables, no trial tables)
- [X] T009 Apply migration to add columns to users table: `created_at`, `last_login_at` ONLY (simplified - no trial, no email verification)
- [X] T010 Run migration: Apply `001_saas_release_readiness.sql` to Supabase database ✅ DONE IN CLOUD

### Backend Services Layer

- [X] T011 [P] Supabase Auth middleware exists in `old-backend-for-swift/src/middleware/auth.ts` (already functional - `requireAuth`, `requireActiveSubscription`, `requireGuestOrUser`)
- [X] T012 [P] Create error handling middleware in `old-backend-for-swift/src/middleware/error-handler.ts` with logging and graceful degradation for external service failures ✅
- [~] T013 [P] ~~Create Resend email service~~ (SKIPPED - no email auth, Google/Apple OAuth only)
- [ ] T014 [P] Create RevenueCat webhook handler in `old-backend-for-swift/src/features/webhook/` for logging subscription events to `subscription_history`
- [ ] T015 Create request validation utility in `old-backend-for-swift/src/utils/validation.ts` for subscription fields (minimal - no email/password validation needed)

### Frontend Services Layer

- [X] T016 [P] Create Supabase client configuration in `web/src/services/supabase.ts` with proper typing and error handling (Google/Apple OAuth integration) ✅
- [X] T017 [P] Create API client service in `web/src/services/api.ts` with fetch wrapper, token management, and error handling ✅
- [X] T018 [P] Create auth service in `web/src/services/auth.ts` with Google/Apple OAuth sign-in, logout functions (NO email/password, NO password reset) ✅
- [X] T019 [P] Create payment service in `web/src/services/payment.ts` for RevenueCat integration ✅
- [ ] T020 Create error handling utility in `web/src/utils/errors.ts` for consistent error messages and user feedback

### Frontend State Management & Context

- [X] T021 Create auth context provider in `web/src/hooks/useAuth.ts` for global auth state and token persistence ✅
- [X] T022 Create subscription status hook in `web/src/hooks/useSubscription.ts` to fetch and cache subscription/payment status (NO trial logic) ✅
- [X] T023 Create custom hook for form error handling in `web/src/hooks/useFormError.ts` ✅

### Shared UI Components

- [~] T024 [P] ~~Create FormInput for email/password~~ (SKIPPED - Google/Apple OAuth only, no email/password forms)
- [X] T025 [P] Create reusable FormError component in `web/src/components/shared/FormError.tsx` for field-level error display ✅
- [X] T026 [P] Create Paywall component in `web/src/components/shared/Paywall.tsx` to display when subscription required ✅
- [X] T027 Create AuthGuard component in `web/src/components/shared/AuthGuard.tsx` to protect routes requiring authentication ✅
- [X] T028 Create SubscriptionGuard component in `web/src/components/shared/SubscriptionGuard.tsx` to protect paid features and show paywall ✅

### Logging & Monitoring Setup

- [ ] T029 Configure Sentry SDK in `web/next.config.ts` and `web/src/app/layout.tsx` for error tracking
- [ ] T030 Configure Sentry in backend via `old-backend-for-swift/src/index.ts` for server-side error tracking
- [ ] T031 Create structured logging utility in `old-backend-for-swift/src/utils/logger.ts` following Constitution Principle V (no sensitive data)

**Checkpoint**: Foundation ready - all user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - New User Signup & Payment (Priority: P1) 🎯 MVP

**Goal**: Enable new visitors to create accounts, enjoy 7-day trial, and add payment to continue service.

**Independent Test**: Complete signup-to-payment flow end-to-end, verify user in database with active subscription, receive welcome email.

### Tests for User Story 1 (Integration - MANDATORY per Constitution III)

> **NOTE**: Write these tests FIRST, ensure they FAIL before implementation

- [ ] T032 [P] [US1] Create Playwright test for signup flow in `web/tests/integration/auth.signup.test.ts` covering: email/password entry, form validation, redirect to onboarding
- [ ] T033 [P] [US1] Create Playwright test for payment flow in `web/tests/integration/auth.payment.test.ts` covering: trial expiry, paywall display, RevenueCat redirect, payment confirmation
- [ ] T034 [US1] Create backend integration test for signup endpoint in `old-backend-for-swift/tests/auth.signup.test.ts` covering: user creation, trial dates, welcome email trigger

### Implementation for User Story 1

#### Frontend Components

- [ ] T035 [P] [US1] Create SignupForm component in `web/src/components/auth/SignupForm.tsx` with email/password fields, validation, loading state, error display
- [ ] T036 [P] [US1] Create SocialLoginButtons component in `web/src/components/auth/SocialLoginButtons.tsx` for Google/Apple login (Supabase Auth)
- [ ] T037 [P] [US1] Create TrialBanner component in `web/src/components/shared/TrialBanner.tsx` to display trial countdown and payment prompt
- [ ] T038 [P] [US1] Create PaymentForm component in `web/src/components/billing/PaymentForm.tsx` to show RevenueCat paywall redirect

#### Frontend Pages

- [ ] T039 [US1] Create signup page at `web/src/app/auth/signup/page.tsx` with SignupForm, legal agreement checkbox, redirect to onboarding on success
- [ ] T040 [US1] Create checkout/payment page at `web/src/app/checkout/page.tsx` with RevenueCat paywall integration and success redirect

#### Frontend Validation & Services

- [ ] T041 [P] [US1] Create email validation utility in `web/src/utils/validation.ts` (lowercase, format checks)
- [ ] T042 [P] [US1] Create password validation utility in `web/src/utils/validation.ts` (8+ chars, requirements)
- [ ] T043 [US1] Extend auth service in `web/src/services/auth.ts` with signup function calling backend `/auth/signup` endpoint

#### Backend Routes & Handlers

- [ ] T044 [US1] Create auth routes file at `old-backend-for-swift/src/routes/auth.ts` with signup, login, logout, refresh endpoints
- [ ] T045 [P] [US1] Implement POST `/auth/signup` handler in `old-backend-for-swift/src/routes/auth.ts`: validate email/password, create user in Supabase Auth, create user record with trial dates, trigger welcome email
- [ ] T046 [P] [US1] Implement POST `/auth/login` handler: validate credentials, return JWT + refresh token, update last_login_at
- [ ] T047 [P] [US1] Implement POST `/auth/logout` handler: invalidate refresh token (optional, can be client-side only)
- [ ] T048 [P] [US1] Implement POST `/auth/refresh` handler: validate refresh token, return new access token

#### Backend Email Triggers

- [ ] T049 [US1] Create welcome email template in Resend (store template ID for reference)
- [ ] T050 [US1] Trigger welcome email in signup handler: call email service with user email + template ID, store in email_logs table
- [ ] T051 [US1] Add retry logic to email_logs: if failed_at is set, retry up to 3 times over 24 hours

#### Frontend Integration

- [ ] T052 [US1] Integrate useAuth hook into `web/src/app/layout.tsx` to load auth state on app startup
- [ ] T053 [US1] Update `web/src/app/page.tsx` (landing page) to show "Start Free Trial" button linking to `/auth/signup`
- [ ] T054 [US1] Add TrialBanner to `web/src/app/dashboard/page.tsx` to display trial countdown if trial_end_date < 7 days away

#### Subscription Initialization

- [ ] T055 [US1] Update subscription flow: when trial ends and no payment method, show Paywall component with RevenueCat paywall redirect
- [ ] T056 [US1] Handle RevenueCat webhook in backend: when successful payment, update subscription status in users table

**Checkpoint**: User Story 1 (signup to trial to payment) should be fully testable independently. Verify: 1) New user can sign up, 2) Trial dates set correctly, 3) Welcome email sent, 4) Payment flow accessible on trial expiry.

---

## Phase 4: User Story 2 - Returning User Login (Priority: P1)

**Goal**: Enable existing users to securely log in and access their dashboard with correct account data.

**Independent Test**: Create test account, log out, log back in, verify dashboard access with correct user data.

### Tests for User Story 2 (Integration - MANDATORY per Constitution III)

- [ ] T057 [P] [US2] Create Playwright test for login flow in `web/tests/integration/auth.login.test.ts` covering: email/password entry, successful redirect to dashboard, persistent session
- [ ] T058 [P] [US2] Create Playwright test for password reset flow in `web/tests/integration/auth.reset.test.ts` covering: forgot password link, email sent, reset link validity, new password acceptance
- [ ] T059 [P] [US2] Create Playwright test for login lockout in `web/tests/integration/auth.lockout.test.ts` covering: 5 failed attempts, lockout triggered, error message, release after 24h
- [ ] T060 [US2] Create backend integration test for login endpoint in `old-backend-for-swift/tests/auth.login.test.ts` covering: valid credentials, invalid credentials, lockout logic

### Implementation for User Story 2

#### Frontend Components

- [ ] T061 [P] [US2] Create LoginForm component in `web/src/components/auth/LoginForm.tsx` with email/password fields, validation, loading state, forgot password link
- [ ] T062 [P] [US2] Create ResetPasswordForm component in `web/src/components/auth/ResetPasswordForm.tsx` with email field and form submission
- [ ] T063 [P] [US2] Create ConfirmResetForm component in `web/src/components/auth/ConfirmResetForm.tsx` with new password fields and token validation

#### Frontend Pages

- [ ] T064 [US2] Create login page at `web/src/app/auth/login/page.tsx` with LoginForm, signup link, forgot password link
- [ ] T065 [US2] Create reset password request page at `web/src/app/auth/reset-password/page.tsx` with ResetPasswordForm
- [ ] T066 [US2] Create reset password confirm page at `web/src/app/auth/reset-password/confirm/page.tsx` with token parsing and ConfirmResetForm

#### Frontend Services & Validation

- [ ] T067 [US2] Extend auth service in `web/src/services/auth.ts` with login function calling backend `/auth/login` endpoint
- [ ] T068 [US2] Extend auth service with requestPasswordReset function calling backend `/auth/request-reset` endpoint
- [ ] T069 [US2] Extend auth service with confirmPasswordReset function calling backend `/auth/confirm-reset` endpoint
- [ ] T070 [P] [US2] Create rate limiting utility in `web/src/utils/rateLimit.ts` for client-side attempt tracking (visual feedback before server-side lockout)

#### Backend Routes & Handlers

- [ ] T071 [US2] Implement POST `/auth/login` handler in `old-backend-for-swift/src/routes/auth.ts`: validate email/password, check failed_login_attempts for lockout, return JWT on success, record failed attempt on error
- [ ] T072 [US2] Implement password reset request handler POST `/auth/request-reset` in `old-backend-for-swift/src/routes/auth.ts`: generate token_hash, store in password_reset_tokens table with 24h expiry, send reset email
- [ ] T073 [US2] Implement password reset confirm handler POST `/auth/confirm-reset` in `old-backend-for-swift/src/routes/auth.ts`: validate token hash and expiry, update password in Supabase Auth, mark token as used, clear failed_login_attempts
- [ ] T074 [US2] Implement lockout logic: query failed_login_attempts for email, if >5 in last hour, return 429 Too Many Requests with cooldown message

#### Backend Email Templates & Triggers

- [ ] T075 [US2] Create password reset email template in Resend (store template ID)
- [ ] T076 [US2] Trigger password reset email in request-reset handler: call email service with reset link (containing token_hash), store in email_logs table
- [ ] T077 [US2] Add email delivery validation: password reset emails must deliver within 2 minutes (success criterion from spec)

#### Session & Token Management

- [ ] T078 [US2] Configure Supabase Auth session in `web/src/services/supabase.ts` to use localStorage for token persistence
- [ ] T079 [US2] Implement token refresh logic in `web/src/services/api.ts`: intercept 401 responses, call `/auth/refresh`, retry original request
- [ ] T080 [US2] Implement logout flow: clear localStorage tokens, call backend `/auth/logout` to invalidate refresh token, redirect to login page

#### Authentication Guards

- [ ] T081 [US2] Update AuthGuard component in `web/src/components/shared/AuthGuard.tsx` to check auth state and redirect to login if missing
- [ ] T082 [US2] Update `web/src/app/layout.tsx` to protect all routes except `/auth/*`, `/legal/*`, `/`

**Checkpoint**: User Story 2 (login, password reset, lockout) should be fully testable independently. Verify: 1) Existing user can log in, 2) Password reset email sent within 2 min, 3) Lockout after 5 failed attempts, 4) Session persists across page reloads.

---

## Phase 5: User Story 3 - Account & Subscription Management (Priority: P2)

**Goal**: Allow paying users to manage subscriptions, view billing history, update payment, and cancel without support.

**Independent Test**: Subscribed user can access settings, view billing history, update card, and cancel subscription with confirmation.

### Tests for User Story 3 (Integration)

- [ ] T083 [P] [US3] Create Playwright test for subscription management in `web/tests/integration/account.subscription.test.ts` covering: access settings page, view subscription status, view billing history, cancel subscription
- [ ] T084 [P] [US3] Create Playwright test for payment update in `web/tests/integration/account.payment-update.test.ts` covering: update payment method via RevenueCat, confirmation email received
- [ ] T085 [US3] Create backend integration test for billing endpoints in `old-backend-for-swift/tests/billing.test.ts` covering: get subscription status, get billing history, cancel subscription, failed payment handling

### Implementation for User Story 3

#### Frontend Components

- [ ] T086 [P] [US3] Create SubscriptionStatus component in `web/src/components/billing/SubscriptionStatus.tsx` displaying current plan, renewal date, status, days remaining
- [ ] T087 [P] [US3] Create BillingHistory component in `web/src/components/billing/BillingHistory.tsx` displaying list of past charges with dates, amounts, status
- [ ] T088 [P] [US3] Create UpdatePaymentForm component in `web/src/components/billing/UpdatePaymentForm.tsx` redirecting to RevenueCat for payment method changes
- [ ] T089 [P] [US3] Create CancelSubscriptionForm component in `web/src/components/billing/CancelSubscriptionForm.tsx` with confirmation, cancellation reason optional field
- [ ] T090 [US3] Create FailedPaymentBanner component in `web/src/components/shared/FailedPaymentBanner.tsx` to display when subscription payment fails

#### Frontend Pages

- [ ] T091 [US3] Create account settings page at `web/src/app/account/settings/page.tsx` with user profile fields (name, email, timezone), update form
- [ ] T092 [US3] Create billing page at `web/src/app/account/billing/page.tsx` with SubscriptionStatus, BillingHistory, UpdatePaymentForm components
- [ ] T093 [US3] Create subscription management page at `web/src/app/account/subscription/page.tsx` with SubscriptionStatus, CancelSubscriptionForm, renewal schedule info

#### Frontend Services

- [ ] T094 [US3] Extend payment service in `web/src/services/payment.ts` with getSubscriptionStatus function
- [ ] T095 [US3] Extend payment service with getBillingHistory function
- [ ] T096 [US3] Extend payment service with cancelSubscription function
- [ ] T097 [US3] Create account service in `web/src/services/account.ts` with updateProfile, deleteAccount functions

#### Backend Routes & Handlers

- [ ] T098 [US3] Create billing routes file at `old-backend-for-swift/src/routes/billing.ts` with subscription, payment, cancellation endpoints
- [ ] T099 [P] [US3] Implement GET `/billing/subscription` handler: return current subscription status from users table + RevenueCat
- [ ] T100 [P] [US3] Implement GET `/billing/history` handler: return subscription_history records for user, paginated, with amounts and dates
- [ ] T101 [P] [US3] Implement POST `/billing/cancel` handler: call RevenueCat API to cancel subscription, log to subscription_history, trigger cancellation email
- [ ] T102 [P] [US3] Implement PUT `/billing/payment-method` handler: return RevenueCat paywall redirect for payment method update
- [ ] T103 [US3] Implement webhook handler for RevenueCat payment failure events: update subscription_history, trigger failed payment email, set flag in users table for banner display

#### Backend Email Templates

- [ ] T104 [US3] Create subscription cancellation email template in Resend
- [ ] T105 [US3] Create failed payment email template in Resend with payment update link
- [ ] T106 [US3] Create subscription renewal confirmation email template in Resend

#### Frontend Account Management

- [ ] T107 [US3] Create account service routes at `old-backend-for-swift/src/routes/account.ts` with profile, deletion endpoints
- [ ] T108 [P] [US3] Implement GET `/account/profile` handler: return user data (email, timezone, created_at, trial status)
- [ ] T109 [P] [US3] Implement PUT `/account/profile` handler: update timezone, preferences in users table, return updated data
- [ ] T110 [US3] Implement DELETE `/account` handler: soft delete user (set account_deleted_at), comply with GDPR, trigger account deletion email

#### Integration & Webhooks

- [ ] T111 [US3] Integrate RevenueCat webhook handler in backend to listen for subscription events (payment success, failure, cancellation, renewal)
- [ ] T112 [US3] Store webhook events in subscription_history table with metadata (reason, amount, dates) for audit trail
- [ ] T113 [US3] Update dashboard to show FailedPaymentBanner if payment update required (check users table flag)

**Checkpoint**: User Story 3 (subscription management) should be fully testable independently. Verify: 1) User can view subscription status, 2) Billing history accurate, 3) Payment method update redirects to RevenueCat, 4) Cancellation processes correctly, 5) Emails sent for all events.

---

## Phase 6: User Story 4 - Legal Compliance Pages (Priority: P2)

**Goal**: Provide legally compliant Privacy Policy and Terms of Service, accessible and required at signup.

**Independent Test**: All legal pages accessible from footer, signup flow includes terms checkbox, pages contain required legal language.

### Implementation for User Story 4

#### Frontend Components

- [ ] T114 [P] [US4] Create TermsOfService component in `web/src/components/legal/TermsOfService.tsx` with full legal text (GDPR, refund policy, liability limits)
- [ ] T115 [P] [US4] Create PrivacyPolicy component in `web/src/components/legal/PrivacyPolicy.tsx` with data collection, usage, retention, user rights
- [ ] T116 [P] [US4] Create TermsCheckbox component in `web/src/components/auth/TermsCheckbox.tsx` for signup form
- [ ] T117 [P] [US4] Create LegalFooter component in `web/src/components/shared/LegalFooter.tsx` with links to Privacy, Terms, Contact

#### Frontend Pages

- [ ] T118 [US4] Create terms of service page at `web/src/app/legal/terms/page.tsx` displaying TermsOfService component
- [ ] T119 [US4] Create privacy policy page at `web/src/app/legal/privacy/page.tsx` displaying PrivacyPolicy component
- [ ] T120 [US4] Add LegalFooter to `web/src/app/layout.tsx` to display on all pages

#### Legal Content & Compliance

- [ ] T121 [US4] Write Terms of Service document covering: service scope, user responsibilities, payment terms, cancellation, limitation of liability, dispute resolution
- [ ] T122 [US4] Write Privacy Policy document covering: data collected, how it's used, retention periods, user rights (access, deletion, portability), GDPR/CCPA compliance
- [ ] T123 [US4] Store legal documents as markdown in `web/src/content/legal/terms.md` and `web/src/content/legal/privacy.md` for version control
- [ ] T124 [US4] Integrate terms acceptance into signup: require TermsCheckbox in SignupForm, store acceptance timestamp in database (required for legal defense)

#### Backend Compliance Routes (Optional)

- [ ] T125 [US4] Implement GET `/legal/terms` endpoint to serve terms dynamically (useful for versioning and A/B testing)
- [ ] T126 [US4] Implement GET `/legal/privacy` endpoint to serve privacy policy dynamically
- [ ] T127 [US4] Track terms acceptance: store acceptance_timestamp and accepted_version in users table for audit trail

**Checkpoint**: User Story 4 (legal pages) should be complete and accessible. Verify: 1) Terms and Privacy accessible from all pages, 2) Signup requires terms checkbox, 3) Legal documents contain required language, 4) Footer links functional.

---

## Phase 7: User Story 5 - Transactional Email Communication (Priority: P2)

**Goal**: Deliver timely, reliable transactional emails for all critical user events with proper retry and delivery tracking.

**Independent Test**: Trigger each email type, verify delivery within expected timeframe with correct content, confirm retry on failure.

### Tests for User Story 5 (Integration)

- [ ] T128 [P] [US5] Create Playwright test for email triggers in `web/tests/integration/email.triggers.test.ts` covering: signup welcome email, password reset email, payment receipt email, cancellation email
- [ ] T129 [US5] Create backend test for email service retry logic in `old-backend-for-swift/tests/email-service.test.ts` covering: failed send, retry after delay, max retries exceeded

### Implementation for User Story 5

#### Email Infrastructure

- [ ] T130 [US5] Extend email service in `old-backend-for-swift/src/services/email-service.ts` to support queuing and retry: store failed attempts in email_logs table, mark status as pending/sending/delivered/failed
- [ ] T131 [US5] Create email queue processor in `old-backend-for-swift/src/features/email/queue-processor.ts` to check email_logs table every 5 min for failed emails, retry with exponential backoff (1m → 5m → 1h)
- [ ] T132 [US5] Implement Resend webhook handler in `old-backend-for-swift/src/features/email/resend-webhook.ts` to receive delivery confirmations, update email_logs.delivered_at timestamp

#### Email Templates (Already Partially Done in US1-US3)

- [ ] T133 [P] [US5] Create/consolidate welcome email template (US1 handled this, confirm ID stored)
- [ ] T134 [P] [US5] Create/consolidate password reset email template (US2 handled this, confirm ID stored)
- [ ] T135 [P] [US5] Create/consolidate payment receipt email template (from research.md)
- [ ] T136 [P] [US5] Create/consolidate subscription change email template (from research.md)
- [ ] T137 [P] [US5] Create/consolidate failed payment email template (from research.md)
- [ ] T138 [P] [US5] Create/consolidate call reminder email template (for future use, scope to Phase 2)

#### Email Delivery Guarantees

- [ ] T139 [US5] Configure email retry policy: max 3 retries over 24 hours with exponential backoff
- [ ] T140 [US5] Add email delivery dashboard (backend only for MVP): endpoint GET `/admin/email-logs` returning email delivery stats
- [ ] T141 [US5] Add unsubscribe support (optional): create unsubscribe link format that stores preference in users table

#### Email Testing

- [ ] T142 [US5] Setup Resend test mode: use provided test API key for development, capture emails in dashboard
- [ ] T143 [US5] Create email template tests in `old-backend-for-swift/tests/email-templates.test.ts` verifying all template variables render correctly

**Checkpoint**: User Story 5 (transactional emails) should be fully operational. Verify: 1) All email types send on correct triggers, 2) Delivery within 2 min for time-critical emails (password reset), 3) Retry logic works, 4) Delivery status tracked in email_logs.

---

## Phase 8: User Story 6 - Production Environment Reliability (Priority: P3)

**Goal**: Operate reliably in production with comprehensive error tracking, logging, and monitoring to catch issues before users report them.

**Independent Test**: Inject test error, verify it appears in monitoring dashboard within 5 minutes with full context.

### Implementation for User Story 6

#### Error Tracking & Monitoring

- [ ] T144 [P] [US6] Configure Sentry dashboard for frontend errors in `web/next.config.ts` with proper source maps and sensitive data filtering
- [ ] T145 [P] [US6] Configure Sentry dashboard for backend errors in `old-backend-for-swift/src/index.ts` with worker-specific context
- [ ] T146 [P] [US6] Create Sentry integration tests in `web/tests/unit/sentry.test.ts` and backend to verify errors are captured with full context

#### Structured Logging

- [ ] T147 [US6] Implement structured logging throughout auth flows: log signup, login, password reset with user ID (not email), success/failure, timestamp, IP
- [ ] T148 [US6] Implement structured logging for payment events: payment attempt, result, card fingerprint (not full number), amount, subscription ID
- [ ] T149 [US6] Implement structured logging for email delivery: email type, recipient, sent_at, delivery status, retry count
- [ ] T150 [US6] Create log aggregation: all logs include request ID, user ID (anonymized), service name, environment, timestamp for easy correlation

#### Metrics & Observability

- [ ] T151 [P] [US6] Create metrics collection: track signup rate, login rate, payment success rate, email delivery rate, API error rate
- [ ] T152 [P] [US6] Create metrics endpoints in backend: GET `/metrics/daily` returning JSON with signup count, payment count, error count for today
- [ ] T153 [US6] Setup Grafana dashboard (optional): connect to Sentry + custom metrics endpoint for visual monitoring

#### Deployment & Environment Management

- [ ] T154 [US6] Create environment separation: staging and production with different Supabase projects, Resend accounts, RevenueCat keys
- [ ] T155 [US6] Configure GitHub Actions workflow for automated testing on PR (run Jest + Playwright tests, prevent merge if failures)
- [ ] T156 [US6] Configure GitHub Actions workflow for staging deployment: auto-deploy main branch to staging environment
- [ ] T157 [US6] Create manual deployment process for production: tagged release → manual approval → production deploy

#### Alerting & Health Checks

- [ ] T158 [P] [US6] Create health check endpoint GET `/health` returning status of all external dependencies (Supabase, Resend, RevenueCat)
- [ ] T159 [P] [US6] Setup Sentry alerts: trigger when error rate >1%, when auth failures >5 in 1h, when payment failures >3 in 1h
- [ ] T160 [US6] Create manual runbook for common failures: auth service down, payment processor down, email delivery stuck

#### Disaster Recovery

- [ ] T161 [US6] Document backup strategy: Supabase automated backups, retention policy, restore procedure
- [ ] T162 [US6] Document data recovery: account deletion compliance, GDPR right to erasure, data portability export
- [ ] T163 [US6] Create incident response guide: escalation path, communication plan, rollback procedures

**Checkpoint**: User Story 6 (monitoring) should provide visibility into production health. Verify: 1) All errors captured in Sentry, 2) Metrics trackable, 3) Health check endpoint functional, 4) Alerts configured for critical issues.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, final quality pass before launch.

- [ ] T164 [P] Run integration test suite: `npm run test:integration` in web/ and backend, ensure all tests pass
- [ ] T165 [P] Run Playwright E2E tests: `npx playwright test` covering all critical paths (signup → payment → login → subscription management)
- [ ] T166 [P] Code review and cleanup: remove console.logs, fix linting errors, ensure TypeScript strict mode compliance
- [ ] T167 [P] Security audit: verify no secrets in code, HTTPS enforced in production, CORS configured to production domain only
- [ ] T168 [P] Performance optimization: run Lighthouse audit on landing page + signup pages, target <3s LCP (Largest Contentful Paint)
- [ ] T169 Validate quickstart.md: follow all setup steps independently, verify everything works as documented
- [ ] T170 Update README.md with feature completion status, known issues, next steps for Phase 2 (call delivery)
- [ ] T171 Create DEPLOYMENT.md with production checklist from quickstart.md deployment section
- [ ] T172 Database backup test: manually trigger and restore a Supabase backup to verify procedure
- [ ] T173 Final security checklist: password requirements, rate limiting, email validation, GDPR delete test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Setup completion - BLOCKS all user stories ⚠️
- **Phase 3 (US1 - Signup)**: Depends on Foundational - NO dependencies on other stories ✅ Can start immediately after Phase 2
- **Phase 4 (US2 - Login)**: Depends on Foundational + US1 infrastructure - Can start in parallel with US1 or after US1
- **Phase 5 (US3 - Subscription)**: Depends on Foundational + US1, US2 - Can start after US1/US2
- **Phase 6 (US4 - Legal)**: Depends on Foundational - NO dependencies on other user stories ✅ Can start in parallel with US1
- **Phase 7 (US5 - Email)**: Depends on Foundational + all stories that trigger emails (US1, US2, US3) - Can start in parallel after Phase 2 for infrastructure, integration testing after stories complete
- **Phase 8 (US6 - Monitoring)**: Depends on Foundational - Can start in parallel with user stories
- **Phase 9 (Polish)**: Depends on Phases 3-8 - Start when all user stories close to complete

### Execution Strategy for Single Developer

**Recommended**: Sequential with parallel setup tasks

1. **Week 1**: Complete Phase 1 (Setup) + Phase 2 (Foundational) - 2-3 days
2. **Week 1-2**: Complete Phase 3 (US1 - Signup & Payment) - 3-4 days
3. **Week 2**: Complete Phase 4 (US2 - Login) - 2-3 days
4. **Week 2-3**: Complete Phase 5 (US3 - Subscription) - 2-3 days
5. **Week 3**: Parallel quick tasks - Phase 6 (Legal), Phase 8 (Monitoring setup) - 1-2 days
6. **Week 3-4**: Complete Phase 7 (Email delivery) - 1 day (infrastructure already done in stories)
7. **Week 4**: Complete Phase 9 (Polish & QA) - 1-2 days

**Total**: ~4 weeks solo, 2-3 weeks with 2 developers working in parallel

### Execution Strategy for Two Developers

**Recommended**: Parallel after Foundational

- **Developer A**: Phase 1 + Phase 2 together (2-3 days)
- **Developer B**: Review Phase 2 output while A finishes
- **Then parallel**:
  - Developer A: Phase 3 (US1 Signup) + Phase 5 (US3 Subscription)
  - Developer B: Phase 4 (US2 Login) + Phase 6 (US4 Legal)
- **Both**: Phase 7 (Email), Phase 8 (Monitoring), Phase 9 (Polish)

### Parallel Opportunities

#### Within Phase 2 (Foundational)

Tasks marked [P] can run in parallel:
- T002, T003 (dependencies)
- T011, T012, T013, T014 (backend services - different files)
- T016, T017, T018, T019 (frontend services - different files)
- T024, T025, T026 (UI components - different files)

#### Within Phase 3 (US1)

- T032, T033 (tests can be written in parallel)
- T035, T036, T037, T038 (components can be built in parallel)
- T045, T046, T047, T048 (backend handlers can be implemented in parallel)
- T069, T070 (utilities can be created in parallel)

#### Within Phase 4 (US2)

- T057, T058, T059, T060 (tests can be written in parallel)
- T061, T062, T063 (components can be built in parallel)
- T099, T100, T101, T102 (backend handlers can be implemented in parallel)

#### Across User Stories

After Phase 2 complete:
- Developer A can start Phase 3 (US1)
- Developer B can start Phase 4 (US2) or Phase 6 (US4 Legal)
- Both complete independently, then integrate

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Minimum Viable Product)

This is the recommended launch approach:

1. Complete Phase 1: Setup (1 day)
2. Complete Phase 2: Foundational (1-2 days)
3. Complete Phase 3: User Story 1 - Signup & Payment (3-4 days)
4. Complete Phase 4: User Story 2 - Login (2-3 days)
5. **STOP and VALIDATE**: Test signup → login → dashboard access independently
6. Quick Phase 9 pass: tests, security, performance
7. Deploy to production - **LAUNCH MVP**
8. Phase 2 TODO: Add direct phone call delivery

**Rationale**: User Stories 1 & 2 are P1 (highest priority). Together they enable the core revenue-generating flow: new signup → trial → login → dashboard. US3-US6 add polish but are not required for MVP.

**Time to MVP**: ~1-2 weeks solo, 5-7 days with 2 developers

### Incremental Delivery (All User Stories)

After MVP launches:

1. ✅ Launch MVP (Phase 3 + Phase 4)
2. Add Phase 5 (US3 - Subscription Management) → Users can self-serve cancellations
3. Add Phase 6 (US4 - Legal Pages) → Required for compliance, quick to implement
4. Add Phase 7 (US5 - Transactional Emails) → Email reliability
5. Add Phase 8 (US6 - Monitoring) → Production visibility and alerts
6. Each addition takes 1-2 days and doesn't break previous functionality

### Parallel Team Strategy (3 Developers)

- **Developer 1**: Phase 1 + Phase 2 (Foundational infrastructure)
- **Developer 2**: Phase 3 (US1 Signup)
- **Developer 3**: Phase 4 (US2 Login)
- Once Phase 2 done: Developer 1 moves to Phase 5 (US3)
- Results: MVP launches in ~1 week
- Then: Developer 1 → US5 (Email), Developer 2 → US6 (Monitoring), Developer 3 → US4 (Legal)

---

## Notes

- **[P] marker**: Tasks can run in parallel only if they touch different files AND don't depend on incomplete tasks in the same phase
- **[Story] label**: Maps each task to a specific user story for traceability and independent story completion
- **Checkpoint after each phase**: Stop and test that story independently before starting next story
- **Tests MANDATORY for US1-US2**: Per Constitution Principle III (Test-First for Critical Paths)
- **Tests OPTIONAL for US3-US6**: Included but can be deferred if timeline is tight
- **Commits**: Make commits after each task or logical group (e.g., after all components for a story)
- **No cross-story dependencies**: Each user story is independently testable and deployable
- **Phase 2 is CRITICAL**: Do not start any user story work until Phase 2 is 100% complete

---

## Task ID Cheat Sheet

| Range | Purpose |
|-------|---------|
| T001-T007 | Phase 1: Setup & Infrastructure |
| T008-T031 | Phase 2: Foundational (Blocking Prerequisites) |
| T032-T056 | Phase 3: User Story 1 - Signup & Payment (P1) |
| T057-T082 | Phase 4: User Story 2 - Login (P1) |
| T083-T113 | Phase 5: User Story 3 - Subscription Management (P2) |
| T114-T127 | Phase 6: User Story 4 - Legal Pages (P2) |
| T128-T143 | Phase 7: User Story 5 - Transactional Email (P2) |
| T144-T163 | Phase 8: User Story 6 - Monitoring (P3) |
| T164-T173 | Phase 9: Polish & Cross-Cutting Concerns |

---

## Success Criteria (How to Know When Done)

### Phase 1-2 Complete ✅
- [ ] All dependencies installed
- [ ] Database schema deployed
- [ ] All backend services created and tested
- [ ] All frontend services created and tested
- [ ] Auth middleware functional
- [ ] Error handling working for all external services

### Phase 3 Complete (MVP Ready) ✅
- [ ] New user can sign up with email/password
- [ ] Welcome email sent within 1 minute
- [ ] Trial dates set correctly (7 days)
- [ ] Paywall shows on trial expiry
- [ ] Payment flow accessible
- [ ] All Playwright tests pass

### Phase 4 Complete ✅
- [ ] Existing user can log in
- [ ] Session persists across page reloads
- [ ] Password reset flow works, email within 2 min
- [ ] Lockout after 5 failed attempts
- [ ] All Playwright tests pass

### Phase 5 Complete ✅
- [ ] User can view subscription status
- [ ] Billing history displayed with correct amounts
- [ ] Payment method update works
- [ ] Subscription cancellation processes
- [ ] All emails sent on correct triggers

### Phase 6 Complete ✅
- [ ] Legal pages accessible from all pages
- [ ] Signup requires terms acceptance
- [ ] Legal content legally compliant

### Phase 7 Complete ✅
- [ ] All email types send on correct triggers
- [ ] Delivery within 2 min for password reset
- [ ] Retry logic functional for failed emails
- [ ] Delivery status tracked in email_logs

### Phase 8 Complete ✅
- [ ] Errors appear in Sentry within 5 min
- [ ] All critical paths logged with context
- [ ] Health check endpoint returns dependency status
- [ ] Alerts configured for critical issues

### Phase 9 Complete (Ready for Launch) ✅
- [ ] All integration tests pass
- [ ] All Playwright E2E tests pass
- [ ] No console.logs in production code
- [ ] TypeScript strict mode passing
- [ ] No secrets in code
- [ ] Lighthouse score >90 on landing page
- [ ] Quickstart.md validation passed
- [ ] Deployment checklist completed
