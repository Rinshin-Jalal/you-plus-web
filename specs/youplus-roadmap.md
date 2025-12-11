## You+ Roadmap — Billing, Onboarding, Voice Accountability

### 1) Context
- Goal: dependable nightly voice accountability with smooth onboarding and transparent billing across web and mobile (Expo).
- Current pain: synchronous third-party calls (Dodo, Cartesia) in request path; no webhooks/queues; base64 audio handling; debug logging with PII; mobile billing not implemented.

### 2) Current vs Proposed (high level)
- Billing: live Dodo fetch per request → shift to webhook + DB source of truth, idempotent checkout, queued cancel/change-plan, cached plans.
- Onboarding: inline transcription/voice clone with base64 → signed uploads to R2/S3, async jobs for transcription/clone, progress polling, retries.
- Guest link: partial onboarding upsert → persist artifact keys; migrate on auth link without re-capture.

### 3) Phased Plan
#### Quick Wins (1–2 wks)
- Remove localhost/PII debug logs in setup flow; gate telemetry by env. DONE
- Add timeouts/retries/backoff to Dodo and Cartesia calls; map errors to safe responses. --  DONE
- Enforce audio size/type limits; require storage bucket; clear onboarding localStorage after push. -- DONE
- Clarify subscription statuses (pending/past_due); cache plans; improve cancel/change-plan error handling. --DONE
- Instrument core funnels (auth → checkout → onboarding submit → first call) with Mixpanel/Amplitude behind env flag; redact PII; document event names.

#### Medium Effort (3–5 wks)
- Billing webhooks + reconcile jobs (idempotent) to make DB authoritative; DLQ and replay.
- Async onboarding pipeline: signed URL uploads, queue transcription/voice clone, status API for polling/retry.
- Resilient setup UX: retry push, better pending-state handling, portal link surface. -- done

#### Strategic (6–10 wks)
- Event-driven architecture for billing/onboarding events; materialized views for dashboard/stats.
- Unified customer graph (web + mobile), privacy/retention policy for audio/transcripts.
- Offline-first mobile with sync; load/perf testing; contract tests across providers.

### 4) Dependencies
- Infra: queues (Cloudflare Queues/SQS), webhook endpoints, signed URL storage (R2/S3).
- Providers: Dodo webhooks/docs; Cartesia API quotas; RevenueCat setup for mobile.

### 5) Risks & Mitigations
- Third-party latency: retries + timeouts + circuit breakers; serve cached status.
- Webhook failure: idempotent handlers, DLQ, reconciliation job.
- PII leakage: redact logs, TTL on local storage, enforce bucket-only audio.
- Large payloads: hard limits, streaming uploads, server-side merge fallback.

### 6) Milestone Checkpoints
- M1 (Quick) — target Jan 31: Logs gated, timeouts/retries shipped, audio limits enforced, plan cache, safer cancel/change-plan.
- M2 (Medium) — target Feb 28: Webhooks + reconcile live; async onboarding pipeline live; RevenueCat entitlements mapped.
- M3 (Strategic) — target Apr 15: Event bus in place; privacy/retention implemented; perf/load baselines documented.

### 7) Owners & Metrics
- Billing (Backend lead): reduce checkout/verify errors to <1%, status P95 <300ms, webhook success >99%.
- Onboarding (App lead): completion rate uplift; job success >98%, median submit-to-ready <5 min.
- Mobile (Mobile lead): entitlement parity; churn/reactivation tracked across providers.

### 8) Open Questions
- Call transport provider and fallback (PSTN vs VoIP)?
- Trials/plan taxonomy alignment between Dodo and RevenueCat?
- Retention window for audio/transcripts; need legal review?

### 9) Flowchart (text)
- Billing (web): Client → `/api/billing/checkout/create` (idempotent) → Dodo session → redirect back → Dodo webhooks → reconcile job → `subscriptions` table → `/subscription` serves DB → portal/cancel/change-plan enqueues job → Dodo → webhook confirms → DB update.
- Billing (mobile): Client (RevenueCat) purchase → RevenueCat webhook → entitlement mapper → shared `subscriptions` table → `/subscription`.
- Onboarding: Client uploads audio via signed URLs → submit metadata → enqueue transcription + voice clone jobs → jobs write URLs/transcripts/voiceId → onboarding status → setup page polls → phone capture → dashboard.
- Guest link: Guest checkout creates guestId + artifacts → user signs up → `/link-guest-checkout` attaches customer + migrates artifacts → subscription reconcile → onboarding status reflects artifacts.

### 10) Analytics Plan
- Tooling: Mixpanel (or Amplitude) with minimal event schema; enable via env flag per environment.
- Core events: `auth_start/success`, `checkout_start/success/fail`, `onboarding_submit/start/success/fail`, `voice_job_start/success/fail`, `first_call_scheduled`, `call_completed/missed`, `subscription_status_change`, `plan_change`, `cancel_start/success`, `portal_open`.
- Properties: anon/user ids, platform (web/mobile), plan id, job ids, duration buckets; no raw PII or audio.
- Privacy: consent banner if needed; sampling for verbose diagnostics; server-side proxy to prevent key leakage.
