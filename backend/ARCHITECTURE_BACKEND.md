## YOU+ Backend Architecture and File-by-File Guide

This document provides a comprehensive, skimmable, and technically detailed overview of the `backend-engine/` subsystem. It explains the architecture, use cases, routing, data models, storage, and behavior of each major file or module.

### Contents

- Overview and runtime
- Configuration and SQL
- HTTP routing entrypoint and middleware
- Feature route modules
- Services (scheduler, retries, push/VoIP, tone, prompts, embeddings, identity/onboarding extractors, R2 uploads)
- Utilities and types
- Operational guidance and notes

---

## Overview

The backend engine is a Cloudflare Worker (Hono-based) that powers YOU+ core workflows: V3 onboarding, daily ritual calls (morning/evening), promise loop management, identity and psychological profiling, tone selection, prompt generation, and deep integration with 11labs Convo AI for post-call ingestion (transcripts/audio/analytics). It uses Supabase for database and R2 (S3-compatible) for file storage. A cron-triggered scheduler creates call batches by user time windows and manages retries for missed calls.

Key pillars:

- Reliable time-window scheduling with timezone-aware logic and first-day rules
- Subscription-gated endpoints to prevent revenue leakage
- 11labs-first call ecosystem: webhook ingestion, transcript storage, evaluation processing
- Memory embeddings and behavioral analytics to personalize tone and prompts
- Secure middleware with debug protections and CORS based on environment

---

## Configuration and SQL

### `backend-engine/README.md`

- High-level system overview and developer guide for local dev and deployment.
- Lists core features, routes, cron windows, environment secrets, and how data flows from onboarding to daily calls.
- Useful for onboarding new contributors and verifying end-to-end expectations.

### `backend-engine/package.json`

- Scripts for dev (`wrangler dev`), deploy (`wrangler deploy`), build (`tsc`), and tests (`jest`).
- Core dependencies: `hono` (routing), `@supabase/supabase-js` (DB), `openai` (LLM/embeddings), `zod` (validation), and APNs support libraries used for VoIP pushes.
- Ensure dependency versions align with Cloudflare Workers runtime compatibility.

### `backend-engine/eas.json`

- EAS build configuration included for monorepo coordination purposes. Backend deployment remains via Wrangler; this keeps toolchain versions consistent across environments when collaborating with the mobile app.

### `backend-engine/tsconfig.json` and `backend-engine/wrangler.toml`

- TypeScript config enables strict typing and path aliases like `@/` matching `src/` structure.
- Wrangler config binds environment, R2 buckets, and cron schedules for the Worker. Keep this aligned with `Env` in `src/index.ts`.

### `backend-engine/sql/add_retry_tracking.sql`

- Migration that enhances `calls` for robust retry workflows:
  - Adds `is_retry`, `retry_attempt_number`, `original_call_uuid`, `retry_reason`, `urgency`, `acknowledged`, `acknowledged_at`, `timeout_at`.
  - Extends call type constraint to include `first_call`, `apology_call`, `emergency`.
  - Adds indexes for retry lookups and timeout scanning.
- Designed to support escalating urgency, duplicate prevention, and acknowledgment state.

### `backend-engine/sql/get_users_ready_for_calls.sql`

- A Supabase function that identifies users eligible for calls at the current time with timezone-aware checks, first-day rules, recent-call suppression, and weekly call limits.
- Returns complete user fields plus scheduling metadata, calculated local times, and next window timestamps.
- Includes helper functions for counts and per-user eligibility checks and creates supporting indexes.

---

## HTTP Entrypoint and Middleware

### `src/index.ts`

- Hono application bootstrap: registers global security middleware, configures routes, exposes the Worker `fetch` and `scheduled` handlers.
- Public health endpoints: `/` and `/stats`.
- ElevenLabs webhook endpoints: `/webhook/elevenlabs` (transcription), `/webhook/elevenlabs/audio` (chunked audio).
- Dev-protected routes (only outside production): `/debug/*`, `/trigger/*`, VoIP debug utilities.
- Auth/subscription-gated feature routes registered from route modules (Promises, Tools, Mirror, Call Log, Settings, Identity, Onboarding V3, Voice).
- Scheduled cron handler runs:
  - Scheduler engine to process users-in-window
  - Retry processor to handle timeouts/escalations
  - Nightly Pattern Profile updater at ~02:00 UTC (see `embedding-services/behavioral.ts`) that computes and persists `identity_status.pattern_profile` JSON

#### Complete Route Index (as registered in `src/index.ts`)

- Health
  - GET `/` → health check
  - GET `/stats` → live user-window stats
- Debug/Triggers (dev-only; token-protected for triggers)
  - GET `/debug/schedules`
  - POST `/debug/voip`
  - GET `/debug/voip`
  - GET `/debug/voip/summary`
  - DELETE `/debug/voip`
  - POST `/trigger/morning`
  - POST `/trigger/evening`
  - POST `/trigger/user/:userId/:callType`
  - POST `/trigger/voip`
  - POST `/trigger/onboarding/:userId`
- Webhooks
  - POST `/webhooks/revenuecat`
  - GET `/webhook/elevenlabs`
  - POST `/webhook/elevenlabs`
  - POST `/webhook/elevenlabs/audio`
- Voice & Onboarding Analysis
  - POST `/voice/clone` (subscription required)
  - POST `/onboarding/analyze-voice`
- Promises (subscription required)
  - POST `/promise/create`
  - POST `/promise/complete`
  - GET `/promises/:userId`
  - POST `/promise/reorder`
  - GET `/promise/summary/:userId`
  - POST `/promise/bulk-update`
- Tool functions (subscription required)
  - POST `/tool/function/searchMemories`
  - POST `/tool/function/createPromise`
  - POST `/tool/function/completePromise`
  - POST `/tool/function/deliverConsequence`
  - POST `/tool/function/getExcuseHistory`
  - POST `/tool/function/getUserContext`
  - POST `/tool/function/getOnboardingIntelligence`
- Onboarding
  - POST `/onboarding/complete` (legacy; subscription required)
  - POST `/onboarding/migrate` (public; post-auth server validation)
  - POST `/onboarding/extract-data` (subscription required)
  - Note: `/onboarding/complete` is also mapped to V3 handler; ensure only one mapping is active in production.
- Tool function aliases (no middleware)
  - POST `/tool/function/search-memories`
  - POST `/tool/function/create-promise`
- Mirror (subscription required)
  - GET `/api/mirror/:userId`
  - PUT `/api/mirror/trust`
  - GET `/api/mirror/voice-clips/:userId`
  - GET `/api/mirror/countdown/:userId`
  - PUT `/api/mirror/contract-status`
- Call Log
  - GET `/api/call-log/:userId` (subscription required)
  - GET `/api/call-log/receipts/:userId` (subscription required)
  - POST `/api/call-log/transcript` (public for webhook ingestion)
  - GET `/api/call-log/week/:userId` (subscription required)
  - GET `/api/call-log/enforcement-flags/:userId` (subscription required)
- Settings & Rules
  - GET `/api/settings/rules/:userId` (subscription required)
  - PUT `/api/settings/consequences` (subscription required)
  - GET `/api/settings/schedule` (subscription required)
  - GET `/api/settings/schedule/:userId` (subscription required)
  - PUT `/api/settings/schedule` (subscription required)
  - PUT `/api/settings/schedule/:userId` (subscription required)
  - PUT `/api/settings/schedule-legacy` (subscription required)
  - POST `/api/settings/voice-reclone` (subscription required)
  - GET `/api/settings/limits/:userId` (subscription required)
  - DELETE `/api/settings/abandon-identity` (subscription required)
  - PUT `/api/settings/accountability-contact` (subscription required)
  - PUT `/api/settings/subscription-status` (auth required)
- Calls Eligibility
  - GET `/api/calls/eligibility` (auth required)
- Identity (subscription required)
  - GET `/api/identity/:userId`
  - PUT `/api/identity/:userId`
  - PUT `/api/identity/status/:userId`
  - GET `/api/identity/voice-clips/:userId`
  - PUT `/api/identity/final-oath/:userId`
  - GET `/api/identity/stats/:userId`
- Mounted sub-router
  - `/voip/*` → see `src/routes/voip-test.ts`

### `src/middleware/auth.ts`

- `requireAuth`: Verifies Supabase JWT, injects `userId`/`userEmail` into context for route handlers.
- `requireActiveSubscription`: Authenticates user and checks `users.subscription_status` (`active` or `trialing`) before allowing access to most feature APIs. Returns 402 with `redirectToPaywall` when invalid.
- Used extensively to prevent revenue leakage and ensure user-scoped access control.

### `src/middleware/security.ts`

- `rateLimit`: Lightweight in-memory rate limiter keyed by IP+path (replace with Redis/KV for production durability).
- `corsMiddleware`: Origin whitelist varies by environment (production domains, staging, and local Expo dev origins in development).
- `debugProtection`: Blocks debug routes in production; requires `X-Debug-Access` token for sensitive trigger endpoints.
- `securityHeaders`: Adds anti-sniff, frame, XSS, referrer, and permissions policies; disables caching for `/api/*`.

### `src/routes/health.ts`

- `GET /`: Basic health payload with version and timestamp.
- `GET /stats`: Leverages scheduler-engine to compute counts of users needing calls now, reflecting real user windows.
- `GET /debug/schedules`: Dev-only schedule preview for inspecting user windows and next calls.

---

## Feature Route Modules

### `src/routes/elevenlabs-webhooks.ts`

- Public endpoints receiving ElevenLabs post-call data.
- Optional HMAC signature validation (`ELEVENLABS_WEBHOOK_SECRET`).
- Transcription endpoint logs and delegates to the webhook handler to persist transcript, analytics, and metadata.
- Audio endpoint supports chunked requests and saves audio metadata/R2 references via the handler.
- Includes a `GET` test endpoint describing features and storage approach.

### `src/routes/11labs-call-init.ts`

- Generates per-call configuration for 11labs Convo AI: agent ID, mood (tone), prompts (system + first message), and analytics metadata.
- Validates `callType` in `[morning, evening, apology_call]`.
- Fetches canonical `UserContext`, computes tone via `tone-engine`, and builds prompts via `prompt-engine`.
- Returns an easy-to-trace `callUUID` for logging and analytics.

### `src/routes/onboarding.ts`

- V3 onboarding completion route processes audio/images, uploads to R2, extracts identity/profile, and prepares users for daily calls. Also includes legacy completion for compatibility.
- Migration route moves anonymous session-based onboarding to authenticated user with atomic cleanup.
- Data extraction endpoint re-runs identity/profile extraction when needed.
- Heavily leverages `onboardingFileProcessor`, `identity-extractor`, and R2 utilities.

### `src/routes/identity.ts`

- Aggregates and serves identity data: name/summary, created/updated, days active, relevant voice clips, and call stats (answered vs total).
- Updates identity core fields and `identity_status` (trust %, streak, next call timestamp).
- Final oath save endpoint; voice clips list endpoint; identity stats summary endpoint.
- Powers mirror and identity-centric UI flows.

### `src/routes/mirror.ts`

- Mirror screen APIs: trust percentage updates, last voice clips, next-call countdown, and contract/acceptance status updates.
- Uses timezone-aware window computation to return an accurate countdown and context suitable for front-end prompts.

### `src/routes/promises.ts`

- Morning promise creation with intelligent defaults (priority/category/time-specific), evening completion with excuse capture.
- Provides today’s promises, reordering, daily summaries, and batch update for efficient state sync.
- Serves as the backbone for the daily accountability loop and downstream AI analyses.

### `src/routes/call-log.ts`

- Paginated immutable call history with transcript snippets and status icons.
- “Receipts” endpoint groups calls by date and computes enforcement/compliance stats.
- Weekly summary (7 days) with daily breakdown, compliance rate, and simple trend/streak analysis.
- Public transcript storage endpoint for webhook-like integrations.
- All user endpoints enforce same-user access.

### `src/routes/settings.ts`

- Returns rules, determines call eligibility, updates tone/consequences preferences.
- Schedule CRUD supports both legacy and new paths; returns limits (schedule changes and voice reclones per month).
- Voice reclone initiation, accountability contact updates, identity abandonment, and subscription status update are supported with proper auth.

### `src/routes/voice.ts`

- Voice cloning (subscription required) via `VoiceCloneService`: persists clone ID to user for later TTS.
- Pre-auth voice analysis endpoint used during onboarding to derive early insights.

### `src/routes/triggers.ts`

- Dev/admin helpers: batch trigger morning/evening, target a single user, and a VoIP push tester.
- Protected by `debugProtection` to avoid accidental production use.

### `src/routes/voip-debug.ts` and `src/routes/voip-test.ts`

- Debug: collect and inspect VoIP-related events (device state, errors), provide summaries, and clear logs.
- Test: helpers to construct/send test payloads and simulate acknowledgment flows to verify retry clearing.

### `src/routes/rc-webhooks.ts`

- RevenueCat webhook ingestion.
- Validates and stores subscription events via DB utils; updates user subscription state/entitlements.
- Wired at `POST /webhooks/revenuecat`.

### `src/routes/token-init-push.ts`

- Exposes `postUserPushToken` for device push/VoIP token registration.
- Persists tokens/metadata via `upsertPushToken`.
- Note: Not currently registered in `src/index.ts`. If needed, add a protected route (e.g., `PUT /api/device/push-token`).

### `src/routes/tool.ts`

- Canonical tool router; handlers are mounted in `src/index.ts` under `/tool/function/*`.
- Operations: `searchMemories`, `createPromise`, `completePromise`, `deliverConsequence`, `getExcuseHistory`, `getUserContext`, `getOnboardingIntelligence`.

### `src/routes/tool-handlers/*`

- Server-side tools callable through protected endpoints:
  - Behavioral analysis (recurring excuses, triggers, catalysts, emotions)
  - Excuse pattern evaluation and interventions
  - Promise creation/completion during live calls
  - Consequence generation based on tone and performance
  - Breakthrough detection and memory embedding
  - Onboarding intelligence and psychological profiles
  - User context assembly and semantic memory search

---

## Services

### `src/services/scheduler-engine.ts`

- Core time-window scheduler using Supabase to find eligible users and batch-process calls for morning/evening/first-day with timezone correctness and first-day special rules.
- Provides `getSchedulePreview` for debugging upcoming calls and windows.
- Invoked by the Worker `scheduled` handler in `src/index.ts`.

### `src/services/retry-processor.ts` and `src/services/call-retry-handler.ts`

- Retry processor scans for timeouts and due retries, creates follow-ups with escalated urgency and messages, and clears state upon acknowledgment.
- Retry handler encapsulates retry state per user/call, provides delays/backoff, and ensures duplicate prevention.
- Together they deliver robust “never drop the call” behavior without overwhelming the user.

### `src/services/push-notification-service.ts` and `src/services/voip/*`

- Push service builds and sends VoIP push payloads with rich metadata (`callType`, `type`, `callUUID`, `urgency`, attempts, reason, message). iOS APNs is the primary delivery mechanism.
- `voip/call-tracker.ts`: in-memory pending call registry, timeouts, and acknowledgment hooks.
- `voip/certificate-validator.ts`: validates required env config and readiness to run VoIP pushes.
- `voip/delivery-handler.ts`: validates/saves delivery receipts, marks acknowledgments, and clears retry tracking.
- `voip/test-endpoints.ts`: utilities for sending simple/advanced test payloads and platform detection.

### `src/services/tone-engine.ts`

- Computes the optimal psychological tone (Encouraging, Confrontational, Ruthless, ColdMirror) using recent performance success rate, consecutive failures, trend detection, streak health, and collapse risk.
- Produces an explainable `ToneAnalysis` with reasoning factors and intensity; includes helpers for future-identity phrasing and tone descriptions.
- Central input for call-mode prompt generation.

### `src/services/prompt-engine/*`

- Types and mode registry for call prompt generation.
- Modes: morning, evening, first, apology, and missed-call variants, each producing `firstMessage` and `systemPrompt` conditioned on tone.
- Behavioral and onboarding intelligence modules transform context into prompt text; enhancers inject onboarding-derived details.
- Unified `getPromptForCall` returns the correct mode output for use by `11labs-call-init`.

#### Semantic memory enrichment

- Before generating a call prompt, the engine fetches Top‑K semantically similar memories (via pgvector RPC) and injects a concise block into the `systemPrompt`:
  - `related_memories` (Top‑3 with text/date/emotion)
  - `pattern_summary` (one line)
- Source: `embedding-services/memory.ts#buildRelatedMemoriesPayload`, integrated in `prompt-engine/modes/call-mode-registry.ts`.

#### `src/services/prompt-engine/index.ts`

- Entry point exporting `getPromptForCall` and mode registry.

#### `src/services/prompt-engine/modes/emergency-call.ts`

- Scaffold for emergency interventions; implement `CallModeResult` to activate.

### `src/services/embedding-services/*`

- `core.ts`: embedding generation and similarity utilities.
- `memory.ts`: CRUD and semantic search across `memory_embeddings` by content type with thresholds and limits.
- `calls.ts`: extracts psychological content from calls and generates embeddings per call; aggregates counts.
- `behavioral.ts`: aggregates recurring excuse patterns, triggers, catalysts, language/emotion evolution, promise correlations, and identity contradictions/growth.
- `identity.ts`: create/update identity embeddings; supports refresh paths.
- `patterns.ts`: specialized helpers for excuse/breakthrough detection with semantic search.

#### Nightly Pattern Profile (persisted)

- Job: `updateNightlyPatternProfiles(env)` (called by the Worker scheduler ~02:00 UTC)
- Reads recent `memory_embeddings` per user (last ~28 days) and produces a compact JSON profile:
  - `countsByType`
  - `dominantEmotion`
  - `summary`: `topExcuses`, `topBreakthroughs`, `topPatterns`
  - `emergingPatterns`: detected via growth of recent 7d vs baseline 21d using `metadata.text_hash`
- Persists to `identity_status.pattern_profile` (JSONB)

#### `src/services/embedding-service.ts`

- Simple façade placeholder. Most usages reference granular modules in `embedding-services/`.

### `src/services/identity-extractor.ts` and `src/services/onboarding-data-extractor.ts`

- Identity extractor: transcribes audio or URLs, extracts structured identity fields (core identity, patterns, stakes, assessments), and writes a summary.
- Onboarding extractor: maps the V3 responses/voice/images to a normalized structure with completeness and depth indicators; produces a psychological profile snapshot.
- These outputs power personalization across tone/prompt engines and mirror UIs.

### `src/services/r2-upload.ts`

- Upload helpers for audio/image files to R2 with consistent folder and filename strategies.
- Functions to derive extensions from URIs and pick content types; returns public URLs for DB persistence.

---

## Utilities and Types

### `src/utils/database.ts`

- Supabase client factory and data-access helpers:
- `getUserContext` builds canonical context: today/yesterday promises, recent pattern sample, identity/status, and aggregate stats.
- Memory insights: Instead of returning raw memory rows, `getUserContext` now exposes a compact `memoryInsights` object (when available from nightly profile):
  - `countsByType`
  - `topExcuseCount7d`
  - `emergingPatterns` (array with `sampleText`, `recentCount`, `baselineCount`, `growthFactor`)
  - Promise CRUD: create/update status/order, bulk updates, daily summaries, and collections.
  - Call persistence: save recordings, existence checks by date/type.
  - Embedding persistence for memories; push token upserts; voice recording saves; subscription event persistence.
- Centralizes DB interactions for consistency and type safety.

### `src/utils/onboardingFileProcessor.ts`

- Validates and parses base64 data URIs for audio/image onboarding responses, converts to buffers, uploads to R2, and patches responses with cloud URLs.
- Returns a processed response object and list of uploaded files for auditing.

### `src/utils/uuid.ts`

- Generators for UUIDs, including call UUIDs (`<callType>-<userSuffix>-<timestamp>`) for traceability and analytics.

### `src/types/database.ts`

- Canonical TypeScript interfaces for DB tables and domain types: tones, user, identity, identity status, promise, call (with retry tracking), memory embeddings, `UserContext`, and composite `Database` type.
- Ensures compile-time safety across route/service layers.

### `src/types/elevenlabs.ts`

- Strict typings for ElevenLabs webhook events (transcription and audio), metadata, analysis, and the stored call record shape.
- Supports accurate parsing and persistence in the webhook handler.

---

## Operational Notes

- Security: Use `requireActiveSubscription` for most user-facing routes. Debug/trigger routes are intentionally disabled in production and require a header token in development.
- Storage: Sensitive payloads (audio) should go into R2; database rows store URLs and minimal summaries.
- Scheduling: The Worker `scheduled` handler executes both call scheduling and retry processing for resilience.
- Personalization: Tone and prompt engines rely on fresh `UserContext` and embeddings—keep webhook and extraction pipelines healthy to maintain quality.
- Extensibility: New call modes can be added in the prompt-engine with consistent types; new data collections from ElevenLabs can flow through the webhook handler and embeddings.
- Completeness: All routes wired in `src/index.ts` are enumerated above. Modules present but not yet registered (e.g., `token-init-push.ts`) are noted for follow-up wiring.
