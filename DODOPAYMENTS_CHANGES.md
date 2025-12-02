# Dodo Payments Integration – Fixes and Implementation Notes

This document explains the changes made to fix and harden the Dodo Payments integration across backend and frontend, including webhook signature verification, session verification logic, subscription status handling, and environment configuration.

References (official docs via Context7 MCP):
- Node SDK Initialization and Checkout Sessions: https://context7.com/dodopayments/dodopayments-node/llms.txt
- Dodo Payments Node SDK README: https://github.com/dodopayments/dodopayments-node/blob/main/README.md
- Webhooks – Signature Verification: https://docs.dodopayments.com/developer-resources/webhooks
- Webhook and signature troubleshooting: https://docs.dodopayments.com/api-reference/technical-faqs

## Summary of Changes

- Implemented webhook signature verification using the Standard Webhooks HMAC-SHA256 pattern.
- Normalized checkout session verification to use payment_status == "succeeded".
- Hardened Dodo SDK calls for compatibility across SDK versions (iterable vs. paginated responses).
- Upgraded subscription status model and event handling (active, cancelled, on_hold, failed, expired, past_due, pending).
- Added safe metadata coercion to string and passing `null` when absent per SDK typing.
- Switched subscription cancel to cancel at next billing date to avoid immediate mid-cycle effects.
- Added default allowed payment methods for India-first checkout (credit, debit, upi_collect, upi_intent).
- Added Dodo Payments environment variables to `.env.template`.
- Typed Hono route variables for userId / userEmail to fix TS type errors in routes.
- Minor safety tweaks for plans listing and customer portal.

## Backend Changes

1) Webhook Security (Signature Verification)
- File: [old-backend-for-swift/src/features/webhook/dodo-webhook.ts](old-backend-for-swift/src/features/webhook/dodo-webhook.ts)
- What changed:
  - Implemented HMAC-SHA256 verification per Standard Webhooks: uses headers webhook-id, webhook-timestamp, webhook-signature and computes HMAC over `${id}.${timestamp}.${rawBody}` with your Dodo webhook secret.
  - Validates in constant time (timingSafeEqual) and rejects when invalid (401).
  - Parses payload from the exact raw body (no pre-parse that would change the string).
- Why:
  - Per official docs, you must verify the `webhook-signature` header using your webhook secret (docs: https://docs.dodopayments.com/developer-resources/webhooks).
- How to configure:
  - Set `DODO_PAYMENTS_WEBHOOK_SECRET` in your environment. See Environment Vars section.

2) Checkout Session Creation and Verification
- Service: [old-backend-for-swift/src/services/dodopayments-service.ts](old-backend-for-swift/src/services/dodopayments-service.ts)
- Route Verification: [old-backend-for-swift/src/features/billing/router.ts](old-backend-for-swift/src/features/billing/router.ts)
- What changed:
  - Creation now uses:
    - `customer: { customer_id }`
    - `product_cart: [{ product_id, quantity: 1 }]`
    - `allowed_payment_method_types: ['credit', 'debit', 'upi_collect', 'upi_intent']`
    - Proper `return_url` and `metadata` (coerced to string map or null per SDK type).
  - Verification now reads the session and checks `payment_status === "succeeded"` (falls back to legacy `status` if needed).
- Why:
  - Align with Node SDK request/response shape and `intent_status` semantics exposed as `payment_status` in sessions (docs: https://context7.com/dodopayments/dodopayments-node/llms.txt).

3) Subscription Lifecycle and Cancellation
- Files:
  - [old-backend-for-swift/src/features/webhook/dodo-webhook.ts](old-backend-for-swift/src/features/webhook/dodo-webhook.ts)
  - [old-backend-for-swift/src/services/dodopayments-service.ts](old-backend-for-swift/src/services/dodopayments-service.ts)
- What changed:
  - Webhook handlers now accept modern event types like `subscription.active`, `subscription.renewed`, `subscription.on_hold`, `subscription.cancelled`, `subscription.failed`, `subscription.expired`, and `subscription.plan_changed`.
  - Subscription cancellation uses `subscriptions.update(subscriptionId, { cancel_at_next_billing_date: true })` to avoid mid-cycle proration surprises.
  - Status mapping expanded to include `cancelled`, `on_hold`, `failed`, `expired`, `past_due`, `pending`.
- Why:
  - Reflects current event model and avoids accidental immediate cancellation. Helps consistency in dashboards and reduces edge cases.

4) Robust SDK Pagination and Shapes
- File: [old-backend-for-swift/src/services/dodopayments-service.ts](old-backend-for-swift/src/services/dodopayments-service.ts)
- What changed:
  - `customers.list`, `subscriptions.list`, `products.list` support both async iterables and paginated responses with `.items` or `.data`.
  - Coerce various id fields (e.g., `sub.subscription_id` vs `sub.id`) and period fields to a normalized shape.
- Why:
  - SDKs evolve; this keeps the service resilient to minor shape changes while preserving type safety.

5) Route Typing and Auth Variables
- File: [old-backend-for-swift/src/features/billing/router.ts](old-backend-for-swift/src/features/billing/router.ts)
- What changed:
  - Added `Variables: { userId: string; userEmail: string }` to the Hono instance to satisfy `c.get('userId')` typing.
  - `requireAuth` already sets these context variables (see [old-backend-for-swift/src/middleware/auth.ts](old-backend-for-swift/src/middleware/auth.ts)).
- Why:
  - Removes TS errors and makes route handlers type-correct.

6) Environment Variables & Configuration
- Files:
  - [old-backend-for-swift/src/types/environment.ts](old-backend-for-swift/src/types/environment.ts)
  - [old-backend-for-swift/.env.template](old-backend-for-swift/.env.template)
- What changed:
  - `EnvSchema` already includes:
    - `DODO_PAYMENTS_API_KEY` (required)
    - `DODO_PAYMENTS_WEBHOOK_SECRET` (required)
    - `DODO_PAYMENTS_ENVIRONMENT` (test_mode | live_mode, default test_mode)
  - `.env.template` now includes Dodo variables and basic URLs:
    - DODO_PAYMENTS_API_KEY
    - DODO_PAYMENTS_WEBHOOK_SECRET
    - DODO_PAYMENTS_ENVIRONMENT
    - FRONTEND_URL
    - BACKEND_URL
- How to use:
  - For Test Mode: `DODO_PAYMENTS_ENVIRONMENT=test_mode`
  - For Live Mode: `DODO_PAYMENTS_ENVIRONMENT=live_mode`
  - SDK will route to correct base URLs automatically. Do NOT use `api.dodopayments.com`. Base URL depends on mode (team rule).

## Frontend Changes

1) Checkout Success Verification
- File: [web/src/app/billing/success/page.tsx](web/src/app/billing/success/page.tsx)
- What changed:
  - Reads `session_id` from query string, then calls backend `/api/billing/checkout/verify`.
  - Displays success/failure UI accordingly.
- Why:
  - Align with Dodo checkout redirect, which provides `session_id` on success.

2) Plans Retrieval
- Files:
  - [web/src/services/payment.ts](web/src/services/payment.ts)
  - [web/src/app/checkout/page.tsx](web/src/app/checkout/page.tsx)
- What changed:
  - Backend returns raw products; frontend maps plans for display (id, name, price in cents, interval).
  - Checkout page retains fallback `DEFAULT_PLANS` if the API is unavailable.
- Why:
  - Keeps UI resilient and renders plans with user-friendly formatting.

3) Redirect to Checkout
- File: [web/src/services/payment.ts](web/src/services/payment.ts)
- What changed:
  - `redirectToCheckout(planId)` now depends on `/api/billing/checkout/create` which returns `checkoutUrl`, then performs a hard redirect.

## Security Notes

- Webhooks:
  - Always verify using `webhook-id`, `webhook-timestamp`, `webhook-signature` and your `DODO_PAYMENTS_WEBHOOK_SECRET`.
  - Never parse JSON before verification. Use raw body string for HMAC input.
  - Use HTTPS for the webhook endpoint.
  - Docs: https://docs.dodopayments.com/developer-resources/webhooks
- Secrets:
  - Never commit secrets. Use CF Workers secrets or environment management.
- Error Handling:
  - Backend service wraps SDK calls with try/catch and logs warnings/errors.

## Testing in Sandbox (Test Mode)

1) Configure Environment
- Set:
  - `DODO_PAYMENTS_ENVIRONMENT=test_mode`
  - `DODO_PAYMENTS_API_KEY=<test_key>`
  - `DODO_PAYMENTS_WEBHOOK_SECRET=<test_webhook_secret>`
  - `FRONTEND_URL=http://localhost:3000`
  - `BACKEND_URL=http://localhost:8787`

2) Start flows
- Create session: UI or call `/api/billing/checkout/create` with a valid `planId` (Dodo product id).
- Complete payment on Dodo Checkout and ensure redirect returns `session_id`.
- Verify: `/api/billing/checkout/verify` should report success after webhooks update DB.
- Check DB rows in `subscriptions` and `subscription_history`.

3) Webhooks
- Configure endpoint pointing to: `POST /webhook/dodopayments` (mounted at `/webhook/dodopayments`, see [old-backend-for-swift/src/features/routers.ts](old-backend-for-swift/src/features/routers.ts)).
- Use the exact `webhook-id`, `webhook-timestamp`, `webhook-signature` headers (Dodo will send them).
- Confirm signature validation via logs.

## Production Rollout

- Switch `DODO_PAYMENTS_ENVIRONMENT` to `live_mode`.
- Update `DODO_PAYMENTS_API_KEY` and `DODO_PAYMENTS_WEBHOOK_SECRET` to live credentials from the Dodo Dashboard.
- Validate new webhook endpoint secret matches production webhook.
- Monitor logs and verify payments, renewals, cancellations, and failed payments are reflected correctly.

## Files Touched

- Backend
  - Services:
    - [old-backend-for-swift/src/services/dodopayments-service.ts](old-backend-for-swift/src/services/dodopayments-service.ts)
  - Billing Routes:
    - [old-backend-for-swift/src/features/billing/router.ts](old-backend-for-swift/src/features/billing/router.ts)
  - Webhooks:
    - [old-backend-for-swift/src/features/webhook/dodo-webhook.ts](old-backend-for-swift/src/features/webhook/dodo-webhook.ts)
    - Mount: [old-backend-for-swift/src/features/routers.ts](old-backend-for-swift/src/features/routers.ts)
  - Env:
    - [old-backend-for-swift/.env.template](old-backend-for-swift/.env.template)
    - Validation: [old-backend-for-swift/src/types/environment.ts](old-backend-for-swift/src/types/environment.ts)
- Frontend
  - Payment Service:
    - [web/src/services/payment.ts](web/src/services/payment.ts)
  - Checkout Page:
    - [web/src/app/checkout/page.tsx](web/src/app/checkout/page.tsx)
  - Success Page:
    - [web/src/app/billing/success/page.tsx](web/src/app/billing/success/page.tsx)

## Developer Notes and Gotchas

- Currency Units:
  - All Dodo amounts are in the smallest denomination (e.g., cents for USD, paise for INR). UI formatting divides by 100 for display only, never for API calls.
- Allowed Payment Methods:
  - We set ['credit', 'debit', 'upi_collect', 'upi_intent'] as a strong default for India-first flows. The SDK will automatically filter unavailable methods. You can expand or change per product/cart region needs.
- Customer Lookup:
  - `ensureCustomer` prefers email-based lookup first, then creates new if none found. Metadata includes `user_id` for cross-system traceability.
- Cancellation Semantics:
  - Using `cancel_at_next_billing_date` avoids mid-cycle refunds/proration complexities. If you need immediate cancel, switch to a direct cancel endpoint per Dodo SDK semantics.

## Appendix – Verified Against Documentation

- SDK Initialization and Environments:
  - https://context7.com/dodopayments/dodopayments-node/llms.txt
  - https://github.com/dodopayments/dodopayments-node/blob/main/README.md
- Checkout Sessions and Payments:
  - https://context7.com/dodopayments/dodopayments-node/llms.txt
- Webhooks and Signatures:
  - https://docs.dodopayments.com/developer-resources/webhooks
  - https://docs.dodopayments.com/api-reference/technical-faqs
