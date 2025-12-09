# Implementation Plan: Mascot Gamification System

**Branch**: `002-mascot-gamification` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-mascot-gamification/spec.md`

---

## Summary

Implement a comprehensive gamification system that transforms the YOU+ mascot into an evolving companion. Users earn XP for accountability actions, level up through 100 levels, unlock achievements and accessories, complete daily challenges, and compete on weekly leaderboards. The mascot evolves through 5 stages and displays real-time mood based on user behavior.

---

## Technical Context

**Language/Version**: TypeScript 5.x (backend), TypeScript 5.x + React 18 (frontend)  
**Primary Dependencies**: Hono 4.x (backend), Next.js 14.x (frontend), Supabase (database)  
**Storage**: PostgreSQL via Supabase, Cloudflare R2 for assets  
**Testing**: Jest (backend), Jest + React Testing Library (frontend)  
**Target Platform**: Web (Next.js), Cloudflare Workers (backend)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: <200ms p95 for all gamification endpoints  
**Constraints**: Must integrate with existing pillar/call systems without breaking changes  
**Scale/Scope**: 10k users, 7 new tables, 10 API endpoints, ~25 React components

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Subscription-First Security** | ✅ PASS | All gamification endpoints use `requireActiveSubscription` middleware |
| **II. Timezone-Aware Scheduling** | ✅ PASS | Daily challenges and energy decay use user's timezone from database |
| **III. Test-First for Critical Paths** | ✅ PASS | XP engine and achievement checker have defined test coverage targets |
| **IV. Graceful Degradation** | ✅ PASS | Gamification is non-critical; failures don't block core accountability flows |
| **V. Observability & Auditability** | ✅ PASS | XP transactions table provides full audit trail of all XP changes |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-mascot-gamification/
├── spec.md              # Feature specification with acceptance criteria
├── plan.md              # This file - implementation plan
├── research.md          # Design decisions and rationale
├── data-model.md        # Database schema documentation
├── quickstart.md        # Local development setup
└── contracts/
    ├── progression.yaml # Progression API contract
    ├── achievements.yaml # Achievements API contract
    ├── mascot.yaml      # Mascot API contract
    └── challenges.yaml  # Challenges API contract
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── features/
│   │   └── gamification/
│   │       ├── router.ts              # Hono route definitions
│   │       ├── handlers/
│   │       │   ├── progression.ts     # XP, level, streak endpoints
│   │       │   ├── achievements.ts    # Achievement list/claim endpoints
│   │       │   ├── mascot.ts          # Mascot state/customize endpoints
│   │       │   ├── challenges.ts      # Daily challenge endpoints
│   │       │   ├── accessories.ts     # Accessory list/equip endpoints
│   │       │   └── leaderboard.ts     # Leaderboard endpoints
│   │       ├── services/
│   │       │   ├── xp-engine.ts       # XP award logic with multipliers
│   │       │   ├── level-calculator.ts # Level progression math
│   │       │   ├── achievement-checker.ts # Check and unlock achievements
│   │       │   ├── mascot-mood-engine.ts  # Calculate mood from behavior
│   │       │   ├── challenge-generator.ts # Generate daily challenges
│   │       │   ├── streak-shield.ts   # Shield consumption logic
│   │       │   └── leaderboard-aggregator.ts # Weekly rank calculation
│   │       └── types.ts               # Gamification TypeScript types
│   └── tests/
│       └── gamification/
│           ├── xp-engine.test.ts
│           ├── level-calculator.test.ts
│           ├── achievement-checker.test.ts
│           └── integration.test.ts

web/
├── src/
│   ├── components/
│   │   └── gamification/
│   │       ├── Mascot/
│   │       │   ├── MascotAvatar.tsx       # Main mascot with accessories
│   │       │   ├── MascotStage1.tsx       # Spark (L1-10)
│   │       │   ├── MascotStage2.tsx       # Ember (L11-25)
│   │       │   ├── MascotStage3.tsx       # Flame (L26-50)
│   │       │   ├── MascotStage4.tsx       # Blaze (L51-75)
│   │       │   ├── MascotStage5.tsx       # Inferno (L76-100)
│   │       │   ├── AccessoryLayer.tsx     # Render equipped accessories
│   │       │   └── MoodAnimations.tsx     # Mood-specific animations
│   │       ├── Progression/
│   │       │   ├── XPBar.tsx              # XP progress bar
│   │       │   ├── LevelBadge.tsx         # Current level display
│   │       │   ├── StreakDisplay.tsx      # Streak with multiplier
│   │       │   └── LevelUpModal.tsx       # Level-up celebration
│   │       ├── Achievements/
│   │       │   ├── AchievementCard.tsx    # Single achievement
│   │       │   ├── AchievementGrid.tsx    # All achievements view
│   │       │   ├── AchievementToast.tsx   # Unlock notification
│   │       │   └── UnlockModal.tsx        # Epic/legendary unlock
│   │       ├── Challenges/
│   │       │   ├── DailyChallengeCard.tsx # Today's challenge
│   │       │   └── ChallengeCompleteModal.tsx
│   │       ├── Accessories/
│   │       │   ├── AccessoryShop.tsx      # Browse accessories
│   │       │   ├── AccessoryCard.tsx      # Single accessory
│   │       │   └── EquipPreview.tsx       # Preview before equip
│   │       └── Leaderboard/
│   │           ├── LeaderboardCard.tsx    # Leaderboard panel
│   │           └── LeaderboardRow.tsx     # Single rank row
│   ├── services/
│   │   └── gamification.ts                # API client
│   ├── stores/
│   │   └── gamificationStore.ts           # Zustand store
│   └── types.ts                           # Extended with gamification types

migrations/
└── 012_gamification_system.sql            # Database migration
```

**Structure Decision**: Web application structure following existing patterns. Backend uses feature-based module organization under `features/gamification/`. Frontend uses component-based organization under `components/gamification/`.

---

## Implementation Phases

### Phase 1: Foundation (P1) - Estimated 2 days

**Goal**: Core XP and level system working end-to-end

1. Create database migration `012_gamification_system.sql`
2. Create backend types (`features/gamification/types.ts`)
3. Implement `xp-engine.ts` service
4. Implement `level-calculator.ts` service
5. Create `progression` handler and routes
6. Add integration tests for XP engine
7. Create frontend `XPBar`, `LevelBadge`, `StreakDisplay` components
8. Create `gamificationStore.ts` and `gamification.ts` API client

**Exit Criteria**: User can see their XP, level, and streak on dashboard.

### Phase 2: Mascot System (P1) - Estimated 2 days

**Goal**: Mascot displays with evolution stages and mood

1. Create 5 mascot stage SVG components (`MascotStage1-5.tsx`)
2. Implement `mascot-mood-engine.ts` service
3. Create `MascotAvatar.tsx` with stage selection
4. Create `MoodAnimations.tsx` with mood-specific animations
5. Create `mascot` handler and routes
6. Integrate mascot into dashboard
7. Create `LevelUpModal.tsx` with evolution celebration

**Exit Criteria**: Mascot displays on dashboard, evolves at level thresholds, shows mood.

### Phase 3: Achievements (P2) - Estimated 2 days

**Goal**: Achievements can be unlocked and displayed

1. Seed achievement definitions in migration
2. Implement `achievement-checker.ts` service
3. Create `achievements` handler and routes
4. Hook achievement checks into pillar check-in flow
5. Hook achievement checks into call completion webhook
6. Create `AchievementCard.tsx`, `AchievementGrid.tsx`
7. Create `AchievementToast.tsx`, `UnlockModal.tsx`
8. Add achievement notification queue

**Exit Criteria**: User unlocks achievements, sees notifications, views all achievements.

### Phase 4: Accessories (P2) - Estimated 1.5 days

**Goal**: Users can unlock and equip accessories

1. Seed accessory definitions in migration
2. Implement accessory unlock logic (tied to achievements)
3. Create `accessories` handler and routes
4. Create `AccessoryLayer.tsx` for mascot overlay
5. Create `AccessoryShop.tsx`, `AccessoryCard.tsx`, `EquipPreview.tsx`
6. Integrate accessory rendering into `MascotAvatar.tsx`

**Exit Criteria**: User can view, unlock, equip accessories on mascot.

### Phase 5: Challenges & Streaks (P2) - Estimated 1.5 days

**Goal**: Daily challenges and streak shields working

1. Implement `challenge-generator.ts` service
2. Implement `streak-shield.ts` service
3. Create `challenges` handler and routes
4. Update nightly cron for challenge generation and energy decay
5. Update streak processing to use shields
6. Create `DailyChallengeCard.tsx`, `ChallengeCompleteModal.tsx`

**Exit Criteria**: Daily challenge appears, can be completed, shields protect streaks.

### Phase 6: Leaderboard (P3) - Estimated 1 day

**Goal**: Weekly leaderboard with rankings

1. Implement `leaderboard-aggregator.ts` service
2. Create `leaderboard` handler and routes
3. Add weekly aggregation to nightly cron
4. Create `LeaderboardCard.tsx`, `LeaderboardRow.tsx`

**Exit Criteria**: User can view weekly leaderboard with their rank.

### Phase 7: Integration & Polish (P1) - Estimated 1 day

**Goal**: Full integration with existing systems

1. Hook XP awards into all existing events (calls, pillars, promises)
2. Add gamification to dashboard layout
3. Performance testing and optimization
4. Final integration tests
5. Documentation updates

**Exit Criteria**: Gamification fully integrated, all tests passing, documentation complete.

---

## XP Economy Specification

### Target Progression

- **Active user reaches Level 10 in ~8-15 days**
- **Casual user reaches Level 10 in ~25-30 days**
- **Level 100 requires ~2 years of consistent engagement**

### Daily XP Budget (Fully Engaged)

| Action | Base XP | With 2.0x Multiplier |
|--------|---------|----------------------|
| Morning call answered | 25 | 50 |
| Morning call completed | 30 | 60 |
| Evening call answered | 25 | 50 |
| Evening call completed | 30 | 60 |
| 4 pillar check-ins (kept) | 60 (4×15) | 120 |
| All pillars bonus | 50 | 100 |
| Daily challenge | 50-100 | 100-200 |
| **Daily Total** | **270-320** | **540-640** |

### Streak Multiplier Tiers

| Streak Days | Multiplier | Rationale |
|-------------|------------|-----------|
| 0-2 | 1.0x | New or recovering |
| 3-6 | 1.1x | Building momentum |
| 7-13 | 1.25x | One week committed |
| 14-29 | 1.5x | Two weeks strong |
| 30+ | 2.0x | Monthly habit formed |

### Level XP Requirements

| Level | XP Required | Cumulative XP | Days (Active) |
|-------|-------------|---------------|---------------|
| 1→2 | 100 | 100 | 0.5 |
| 5→6 | 175 | 600 | 2 |
| 10→11 | 405 | 1,750 | 6 |
| 25→26 | 3,292 | 18,000 | 40 |
| 50→51 | 26,786 | 150,000 | 280 |
| 75→76 | 218,193 | 1,200,000 | 2,000 |
| 99→100 | 1,497,446 | 10,000,000 | 15,000 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| XP economy too easy/hard | Design with tuning parameters; A/B test before launch |
| Achievement checker race conditions | Use database transactions; idempotent unlock logic |
| Leaderboard performance at scale | Pre-compute ranks nightly; cache top 100 |
| Mascot SVG performance | Lazy load stage SVGs; optimize for mobile |
| Nightly cron overload | Batch process users by timezone window |

---

## Test Coverage Targets

| Component | Type | Target |
|-----------|------|--------|
| level-calculator | Unit | 100% |
| xp-engine | Unit + Integration | 90% |
| achievement-checker | Integration | 85% |
| mascot-mood-engine | Unit | 80% |
| challenge-generator | Unit | 75% |
| streak-shield | Unit | 90% |

---

## Complexity Tracking

> No Constitution violations. Architecture follows existing patterns.

| Decision | Rationale |
|----------|-----------|
| Event-driven achievement checks | Decouples XP awards from achievement logic; allows async processing |
| Pre-computed leaderboard ranks | Avoids expensive real-time calculations; acceptable 24h staleness |
| SVG accessories as overlays | Lighter than image sprites; easier to animate; better scaling |
| Streak shields auto-consume | Simpler UX; no user decision required; prevents "I forgot to use it" |
