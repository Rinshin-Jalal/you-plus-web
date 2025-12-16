# PLACES WHERE EFFECT‑TS WOULD BE GREAT IN YOU+

> High‑impact spots in your codebase where Effect‑TS would improve reliability, testability, and readability.

---

## 1️⃣ **Backend API Handlers** – Multiple external service calls
- **File**: `backend/src/trigger/cartesia.ts`
- **Why**: HTTP fetch to Cartesia with manual error handling, no retry logic
- **Impact**: Transcription and voice cloning are critical user flows

## 2️⃣ **Retry Utility** – Already exists but could be replaced
- **File**: `backend/src/features/core/utils/retry.ts` 
- **Why**: Custom retry implementation; Effect.retry + Schedule is battle‑tested
- **Impact**: Centralized retry behavior across all services

## 3️⃣ **Web API Client** – Frontend HTTP wrapper
- **File**: `web/src/services/api.ts`
- **Why**: Generic fetch wrapper with manual timeout and error handling
- **Impact**: All frontend API calls become retryable with typed errors

## 4️⃣ **Scheduled Call Handler** – Complex orchestration
- **File**: `backend/src/features/core/handlers/scheduled.ts`
- **Why**: Multiple DB queries + API calls + timezone logic + error aggregation
- **Impact**: Daily call reliability improves dramatically

## 5️⃣ **Voice Preview API** – External service integration
- **File**: `web/src/app/api/voice-preview/route.ts`
- **Why**: Cartesia API call without retry/timeout
- **Impact**: Voice generation UX reliability

## 6️⃣ **Payment Service** – Third‑party billing APIs
- **File**: `web/src/services/payment.ts`
- **Why**: Stripe/billing calls need retry and typed error handling
- **Impact**: Revenue‑critical flow becomes resilient

## 7️⃣ **Storage Service** – File upload with retries
- **File**: `web/src/services/storage.ts`
- **Why**: R2/S3 uploads without retry/backoff
- **Impact**: User file upload reliability

## 8️⃣ **Lambda Call Trigger** – AWS integration
- **File**: `lambda/daily-call-trigger/index.ts`
- **Why**: Cartesia + webhook calls with basic error handling
- **Impact**: Production call reliability

## 9️⃣ **Database Operations** – Supabase queries
- **Files**: Multiple DB query locations across backend
- **Why**: No typed query errors, no retry on connection issues
- **Impact**: Data layer becomes predictable and testable

## 🔟 **Concurrent Operations** – Parallel API calls
- **Where**: Anywhere fetching multiple resources at once
- **Why**: Manual Promise.all vs Effect.all with fiber‑safe cancellation
- **Impact**: Performance and cancellation safety

---

## QUICK WIN START ORDER

1. **retry.ts** → Replace with Effect.retry (low risk, high reuse)
2. **api.ts** → Add Effect.retry + typed errors (immediate frontend impact)
3. **cartesia.ts** → Critical backend service with retries
4. **scheduled.ts** → Complex orchestration benefits most from Effect
5. **payment.ts** → Revenue‑critical reliability

Each migration can be done incrementally without breaking existing code!