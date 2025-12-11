## You+ Product Spec — Voice Accountability Companion

### 1) Summary
You+ delivers nightly accountability via voice calls from a user’s “Future Self.” The product guides users through onboarding with voice recordings, clones their voice for the agent, schedules calls at preferred times, and manages paid access through subscriptions (web: Dodo Payments; mobile: RevenueCat planned).

### 2) Goals
- Deliver dependable daily accountability calls with minimal friction.
- Capture rich onboarding context (pillars, core identity, voice) with resilience and privacy.
- Provide transparent billing lifecycle (checkout → activation → self-serve portal).
- Support web and mobile (Expo) with a shared subscription and onboarding model.

### 3) Non-Goals
- Full coaching content library (out of scope for this release).
- Community/social features.
- Advanced habit analytics beyond basic streaks and call stats.

### 4) Users & Personas
- Striver: wants disciplined routines and nightly check-ins.
- Rebounder: re-engaging after churn; needs smooth reactivation and data reuse.
- Mobile-first user: expects in-app purchase parity and offline resilience.

### 5) Success Metrics
- Onboarding completion rate (account → voice capture → phone collected).
- Time-to-first-call; percentage of calls started on time.
- Subscription conversion (guest → paid) and churn/cancel rates.
- Error rates on onboarding push, checkout, and call scheduling (<1%).
- Latency: subscription/status API <300ms P95; onboarding submit <2s (excluding async jobs).

### 6) Functional Requirements
- Auth: Supabase auth (Google/Apple); enforce protected routes for setup, checkout, dashboard.
- Billing (Web): Create checkout, verify, list plans, cancel/change plan, portal; enforce idempotency and webhook-backed state; handle pending/past_due gracefully.
- Billing (Mobile/Expo): RevenueCat integration for purchases, receipt validation, entitlement mapping to shared subscription schema.
- Onboarding:
  - Collect pillars, core identity, call time, timezone.
  - Capture three voice recordings; merge client-side (or server-side fallback) for cloning.
  - Async transcription + voice cloning; show progress/polling; allow retry on failure.
  - Store artifacts in R2/S3; keep only URLs in DB; apply size/type limits.
- Calls:
  - Schedule nightly calls at user’s local time; allow pause/unpause; track outcomes (completed/missed).
  - Update streaks and stats after calls.
- Dashboard:
  - Show subscription state, onboarding completeness, call schedule, streaks/trust score, and action to update payment/plan.
- Guest → Account Link:
  - Support guest checkout with email; link to authenticated user on signup; migrate onboarding data if present.

### 7) Non-Functional Requirements
- Reliability: webhook + job queues for billing and onboarding; retries with backoff; idempotent writes.
- Performance: cache plans; debounce status refresh; background reconcile for subscription state.
- Security/Privacy: PII and audio handled via signed URLs; no raw audio in localStorage beyond short TTL; redact logs; enforce HTTPS and auth on all mutating endpoints.
- Observability: structured logs, metrics for latency/error rates, alerting on checkout/create, onboarding submit, and call scheduler.

### 8) System Integrations
- Supabase: auth, user profiles, status/streaks, subscriptions, future_self tables.
- Dodo Payments: web checkout, customer portal, subscription lifecycle; webhook ingestion required.
- RevenueCat (planned): mobile purchases; entitlement sync to shared subscription model.
- Cartesia: transcription + voice cloning.
- Cloudflare R2 (or S3): audio storage via signed URLs.
- Next.js (web) and Expo (mobile) clients share schemas via zod.

### 9) Current vs Proposed Flows (high-level)
- Billing (Current): Web calls Dodo directly per request → returns live status.  
  Proposed: Checkout uses idempotency key; webhook finalizes subscription → DB is source of truth; status endpoint serves cached DB with background reconcile; portal/cancel/change-plan via queued jobs.
- Onboarding (Current): Client pushes base64 + merged audio; server transcribes/clones inline.  
  Proposed: Client uploads audio to R2 via signed URLs; submit metadata → enqueue transcription/voice clone jobs; UI polls; retries safe; no base64 in storage.
- Guest Link (Current): Link guest to auth user; partial onboarding upsert.  
  Proposed: Persist guest onboarding artifact keys; upon linking, migrate artifacts and avoid re-capture.

### 10) Risks & Mitigations
- Long-running transcription/cloning blocks request → move to async jobs with status tracking.
- Payment drift if webhooks fail → idempotent reconcile job, DLQ, and manual replay.
- PII leakage via logs/localStorage → env-gated telemetry, redact, TTL on local storage, enforce bucket-only audio.
- Large audio payloads → enforce size/type limits; stream uploads; fall back to server-side merge if needed.

### 11) Phased Delivery
- Quick Wins (1–2 wks): Remove debug PII logs; add timeouts/retries to Dodo/Cartesia; enforce audio size guard and require bucket; cache plans; clarify subscription statuses (pending/past_due); clear onboarding storage after push.
- Medium (3–5 wks): Add billing webhooks + reconcile jobs; move onboarding to async jobs with signed uploads; RevenueCat/mobile entitlement mapping; resilient phone collection and retry UX.
- Strategic (6–10 wks): Event-driven model for billing/onboarding; unified customer/payment provider graph; privacy/retention policy; offline-first mobile with sync; load/perf testing and contract tests across providers.

### 12) Open Questions
- Target daily call transport/provider and fallbacks (PSTN vs VoIP)?
- SLA for transcription/cloning turnaround?
- Pricing/plan taxonomy and trials for RevenueCat parity?
- Data retention window for raw audio and transcripts?
