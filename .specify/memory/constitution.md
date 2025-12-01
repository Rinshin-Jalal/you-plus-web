<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: N/A → 1.0.0 (initial ratification)

Modified principles: N/A (initial)

Added sections:
  - Core Principles (5 principles)
  - Technical Constraints
  - Development Workflow
  - Governance

Removed sections: N/A (initial)

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
  - .specify/templates/spec-template.md: ✅ Compatible (requirements structure aligns)
  - .specify/templates/tasks-template.md: ✅ Compatible (test-first language matches P3)
  - .specify/templates/agent-file-template.md: ✅ Compatible (generic structure)
  - .specify/templates/checklist-template.md: ✅ Compatible (generic structure)

Follow-up TODOs: None
================================================================================
-->

# YOU+ Constitution

## Core Principles

### I. Subscription-First Security

All user-facing feature endpoints MUST be gated behind active subscription
verification (`requireActiveSubscription` middleware). Revenue leakage is
treated as a critical security violation.

- Public endpoints are limited to: health checks, webhooks with signature
  validation, and authentication flows
- Subscription status MUST be checked at the API layer, not in business logic
- Failed subscription checks MUST return 402 with `redirectToPaywall` directive

**Rationale**: The business model depends on subscription enforcement; bypassing
this undermines product viability.

### II. Timezone-Aware Scheduling

All time-based operations (call windows, first-day rules, countdown timers)
MUST use timezone-aware logic derived from user preferences stored in the
database.

- UTC is the canonical storage format; local times are computed at query time
- Window calculations MUST account for daylight saving transitions
- First-day and weekly-limit rules MUST be evaluated per-user timezone

**Rationale**: Users span global timezones; incorrect scheduling breaks the core
accountability loop and degrades trust.

### III. Test-First for Critical Paths

Critical paths (onboarding completion, call generation, promise loops,
subscription webhooks) MUST have integration tests that validate end-to-end
behavior before deployment.

- Contract tests MUST exist for all external integrations (ElevenLabs, RevenueCat,
  Supabase)
- Red-Green-Refactor cycle is mandatory for bug fixes in critical paths
- Unit tests are encouraged but not mandatory for non-critical utilities

**Rationale**: Silent failures in accountability flows directly harm users; test
coverage provides confidence for rapid iteration.

### IV. Graceful Degradation

External service failures (TTS providers, AI models, push notification services)
MUST NOT cause user-facing errors. Fallback chains MUST be implemented.

- TTS: 11labs → OpenAI → Cartesia
- Push: APNs with retry escalation and timeout handling
- AI: Requests MUST have timeouts; partial responses are acceptable
- File processing: Original URIs preserved if R2 upload fails

**Rationale**: Third-party dependencies are inherently unreliable; user
experience must remain consistent regardless of external failures.

### V. Observability & Auditability

All state-changing operations MUST be logged with sufficient context for
debugging and compliance audits.

- Structured logging with timestamps, user IDs, and operation types
- Sensitive data (audio content, psychological profiles) MUST NOT appear in logs
- Webhook payloads MUST be persisted for replay and debugging
- Call metadata (tone used, prompt version, duration) MUST be stored per-call

**Rationale**: Post-incident debugging and user support require comprehensive
audit trails; privacy compliance requires explicit data handling boundaries.

## Technical Constraints

### Technology Stack

| Layer | Technology | Version Constraint |
|-------|------------|-------------------|
| Web Frontend | Next.js | 16.x |
| Backend Runtime | Cloudflare Workers | Hono 4.x |
| Database | Supabase (PostgreSQL) | Latest stable |
| Object Storage | Cloudflare R2 | N/A |
| AI/LLM | OpenAI API | GPT-4 class models |
| Voice/TTS | ElevenLabs (primary) | Convo AI integration |
| Auth | Supabase Auth + JWT | RLS enforced |

### Performance Requirements

- API response time: p95 < 500ms for synchronous endpoints
- Call generation latency: < 30s end-to-end (prompt → TTS → storage)
- Webhook processing: < 5s acknowledgment to avoid provider retries
- Cron batch processing: Complete within 10-minute window

### Security Requirements

- All secrets via Cloudflare Worker environment bindings (never in code)
- CORS whitelist by environment (production domains only in prod)
- Debug/trigger routes disabled in production
- HMAC signature validation for ElevenLabs webhooks

## Development Workflow

### Branch Strategy

- Feature branches: `[issue-number]-feature-name`
- All changes require PR review before merge to main
- Direct commits to main are prohibited

### Code Review Requirements

- Constitution compliance check in PR description
- Integration test evidence for critical path changes
- Security review for auth/subscription changes

### Deployment

- Staging deployment automatic on PR merge to main
- Production deployment requires manual approval
- Rollback procedure documented and tested quarterly

## Governance

This constitution supersedes all other development practices. Amendments require:

1. Written proposal with rationale
2. Impact analysis on existing features
3. Migration plan for breaking changes
4. Version increment following semantic versioning:
   - MAJOR: Principle removal or backward-incompatible redefinition
   - MINOR: New principle or materially expanded guidance
   - PATCH: Clarifications, typo fixes, non-semantic refinements

All PRs and code reviews MUST verify compliance with active principles.
Complexity beyond these constraints requires explicit justification in the PR
description with reference to which principle is being intentionally violated
and why.

**Version**: 1.0.0 | **Ratified**: 2025-12-01 | **Last Amended**: 2025-12-01
