# Event-Driven Backend Architecture Plan

**Feature Branch**: `003-event-driven-architecture`  
**Created**: 2025-12-11  
**Status**: Planned  

---

## Executive Summary

Transform the backend from a synchronous request-response model to an **event-driven architecture** that:
1. Decouples features from each other
2. Enables easy addition of new reactions to domain events
3. Improves testability through isolated handlers
4. Mirrors the existing event pattern in the Python agent

---

## Current State Analysis

### Backend (TypeScript/Hono on Cloudflare Workers)

**What exists:**
- Feature-based vertical slices (billing, core, onboarding, webhook)
- Synchronous request-response pattern
- Direct database coupling - features communicate via shared Supabase tables
- Manual service instantiation (no DI)
- Webhook handlers contain business logic inline

**Pain points:**
- Webhook handler (dodo-webhook.ts) is 200+ lines with mixed concerns
- Adding new reactions (e.g., gamification XP on subscription) requires editing existing handlers
- No visibility into domain-level events
- Testing requires full request flow

### Agent (Python)

**Already event-driven:**
- Pydantic-based events (`ExcuseDetected`, `SentimentAnalysis`, `CallSummary`, etc.)
- `CallSummaryAggregator` collects events throughout a call
- Background agents emit events, main agent consumes them
- Clean separation of concerns

---

## Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Event Bus                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  emit(event) → handlers[event.type].forEach(h => h())   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
        ▲                    │                    │
        │                    ▼                    ▼
┌───────┴───────┐   ┌───────────────┐   ┌───────────────┐
│   Emitters    │   │   Handlers    │   │   Handlers    │
│               │   │   (Billing)   │   │ (Gamification)│
│ - Webhooks    │   │               │   │               │
│ - HTTP Routes │   │ subscription  │   │ award XP      │
│ - Cron Jobs   │   │ .created →    │   │ check achieve │
│               │   │ update user   │   │ update level  │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Event Flow Example

```
DodoPayments Webhook
        │
        ▼
┌───────────────────┐
│ Validate Signature│
│ Parse Payload     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ eventBus.emit({   │
│   type: 'sub...',│
│   userId, plan   │
│ })               │
└───────────────────┘
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
┌───────────────────┐            ┌───────────────────┐
│ Billing Handler   │            │ Gamification      │
│ - Update user     │            │ - Award 100 XP    │
│ - Set status      │            │ - Check achieve   │
└───────────────────┘            └───────────────────┘
        │                                  │
        ▼                                  ▼
┌───────────────────┐            ┌───────────────────┐
│ Supabase: users   │            │ Supabase: xp_txn  │
└───────────────────┘            └───────────────────┘
```

---

## Domain Events

### Event Type Definitions

```typescript
// backend/src/events/types.ts

export type DomainEvent =
  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION EVENTS
  // ═══════════════════════════════════════════════════════════════
  | {
      type: 'subscription.created';
      userId: string;
      customerId: string;
      plan: string;
      email?: string;
    }
  | {
      type: 'subscription.cancelled';
      userId: string;
      reason?: string;
    }
  | {
      type: 'subscription.renewed';
      userId: string;
    }
  | {
      type: 'subscription.failed';
      userId: string;
    }
  | {
      type: 'subscription.on_hold';
      userId: string;
    }

  // ═══════════════════════════════════════════════════════════════
  // ONBOARDING EVENTS
  // ═══════════════════════════════════════════════════════════════
  | {
      type: 'onboarding.completed';
      userId: string;
      pillars: string[];
      primaryPillar: string;
      voiceCloned: boolean;
    }

  // ═══════════════════════════════════════════════════════════════
  // CALL EVENTS (from Python agent)
  // ═══════════════════════════════════════════════════════════════
  | {
      type: 'call.scheduled';
      userId: string;
    }
  | {
      type: 'call.started';
      userId: string;
      callId: string;
    }
  | {
      type: 'call.completed';
      userId: string;
      callId: string;
      summary: CallSummaryPayload;
    }
  | {
      type: 'call.missed';
      userId: string;
    }

  // ═══════════════════════════════════════════════════════════════
  // ACCOUNTABILITY EVENTS
  // ═══════════════════════════════════════════════════════════════
  | {
      type: 'promise.kept';
      userId: string;
      commitment: string;
    }
  | {
      type: 'promise.broken';
      userId: string;
      excuse?: string;
    }
  | {
      type: 'streak.updated';
      userId: string;
      newStreak: number;
      previousStreak: number;
    }
  | {
      type: 'streak.broken';
      userId: string;
      wasStreak: number;
    }

  // ═══════════════════════════════════════════════════════════════
  // GAMIFICATION EVENTS
  // ═══════════════════════════════════════════════════════════════
  | {
      type: 'xp.awarded';
      userId: string;
      amount: number;
      reason: string;
    }
  | {
      type: 'level.up';
      userId: string;
      newLevel: number;
      previousLevel: number;
    }
  | {
      type: 'achievement.unlocked';
      userId: string;
      achievementId: string;
      xpBonus: number;
    };

// ═══════════════════════════════════════════════════════════════
// PAYLOAD TYPES
// ═══════════════════════════════════════════════════════════════

export interface CallSummaryPayload {
  callDurationSeconds: number;
  promiseKept: boolean | null;
  tomorrowCommitment: string | null;
  commitmentTime: string | null;
  commitmentIsSpecific: boolean;
  sentimentTrajectory: string[];
  excusesDetected: string[];
  quotesCaptured: string[];
  callType: string;
  mood: string;
  callQualityScore: number;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Events + Bus)

**Goal:** Create the event infrastructure without changing existing behavior.

**Files to create:**
```
backend/src/events/
├── index.ts           # Re-exports
├── types.ts           # DomainEvent union type
├── bus.ts             # EventBus class
└── register.ts        # Handler registration
```

**EventBus Implementation:**

```typescript
// backend/src/events/bus.ts

import type { Env } from '@/types/environment';
import type { DomainEvent } from './types';

export interface EventContext {
  env: Env;
  eventId: string;
  timestamp: Date;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T,
  ctx: EventContext
) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register a handler for an event type
   */
  on<T extends DomainEvent['type']>(
    type: T,
    handler: EventHandler<Extract<DomainEvent, { type: T }>>
  ): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(type, existing);
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: DomainEvent, env: Env): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    if (handlers.length === 0) {
      console.log(`[EventBus] No handlers for event: ${event.type}`);
      return;
    }

    const ctx: EventContext = {
      env,
      eventId: crypto.randomUUID(),
      timestamp: new Date(),
    };

    console.log(`[EventBus] Emitting ${event.type} (${ctx.eventId}) to ${handlers.length} handlers`);

    // Run all handlers, collect errors but don't fail
    const results = await Promise.allSettled(
      handlers.map(handler => handler(event, ctx))
    );

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[EventBus] Handler ${index} for ${event.type} failed:`, result.reason);
      }
    });
  }

  /**
   * Clear all handlers (for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Get handler count for an event type (for testing)
   */
  getHandlerCount(type: string): number {
    return this.handlers.get(type)?.length || 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();
```

**Estimated effort:** 2-3 hours

---

### Phase 2: Refactor Webhooks

**Goal:** Make webhooks thin event emitters.

**Before (dodo-webhook.ts):**
```typescript
case 'subscription.active':
  await handleSubscriptionCreated(eventData, env);  // 80 lines of logic
  break;
```

**After (dodo-webhook.ts):**
```typescript
case 'subscription.active':
  await eventBus.emit({
    type: 'subscription.created',
    userId: eventData.metadata?.user_id,
    customerId: eventData.customer?.customer_id,
    plan: eventData.product_id || 'unknown',
    email: eventData.customer?.email,
  }, env);
  break;
```

**New handler file (billing/handlers/events.ts):**
```typescript
export function registerBillingEventHandlers(bus: EventBus) {
  bus.on('subscription.created', async (event, ctx) => {
    const supabase = createSupabaseClient(ctx.env);
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', event.userId)
      .maybeSingle();
    
    if (!existingUser) {
      await supabase.from('users').insert({
        id: event.userId,
        email: event.email || 'unknown@example.com',
        dodo_customer_id: event.customerId,
        payment_provider: 'dodopayments',
        subscription_status: 'active',
      });
    } else {
      await supabase.from('users').update({
        dodo_customer_id: event.customerId,
        payment_provider: 'dodopayments',
        subscription_status: 'active',
      }).eq('id', event.userId);
    }
  });

  bus.on('subscription.cancelled', async (event, ctx) => {
    const supabase = createSupabaseClient(ctx.env);
    await supabase.from('users').update({
      subscription_status: 'cancelled',
    }).eq('id', event.userId);
  });
}
```

**Estimated effort:** 3-4 hours

---

### Phase 3: Add Call Events Endpoint

**Goal:** Create webhook for Python agent to report call completions.

**New file (webhook/call-webhook.ts):**
```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '@/index';
import { eventBus } from '@/events';

const CallCompletedSchema = z.object({
  user_id: z.string().uuid(),
  call_id: z.string(),
  call_duration_seconds: z.number(),
  promise_kept: z.boolean().nullable(),
  tomorrow_commitment: z.string().nullable(),
  commitment_time: z.string().nullable(),
  commitment_is_specific: z.boolean().default(false),
  sentiment_trajectory: z.array(z.string()).default([]),
  excuses_detected: z.array(z.string()).default([]),
  quotes_captured: z.array(z.string()).default([]),
  call_type: z.string().default('audit'),
  mood: z.string().default('warm_direct'),
  call_quality_score: z.number().min(0).max(1).default(0.5),
});

export const callWebhook = new Hono<{ Bindings: Env }>();

callWebhook.post('/completed', async (c) => {
  const body = await c.req.json();
  const parsed = CallCompletedSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  await eventBus.emit({
    type: 'call.completed',
    userId: data.user_id,
    callId: data.call_id,
    summary: {
      callDurationSeconds: data.call_duration_seconds,
      promiseKept: data.promise_kept,
      tomorrowCommitment: data.tomorrow_commitment,
      commitmentTime: data.commitment_time,
      commitmentIsSpecific: data.commitment_is_specific,
      sentimentTrajectory: data.sentiment_trajectory,
      excusesDetected: data.excuses_detected,
      quotesCaptured: data.quotes_captured,
      callType: data.call_type,
      mood: data.mood,
      callQualityScore: data.call_quality_score,
    },
  }, c.env);

  return c.json({ received: true });
});
```

**Call event handlers (core/handlers/call-events.ts):**
```typescript
export function registerCallEventHandlers(bus: EventBus) {
  bus.on('call.completed', async (event, ctx) => {
    const supabase = createSupabaseClient(ctx.env);
    
    // 1. Save call analytics
    await supabase.from('call_analytics').insert({
      user_id: event.userId,
      call_duration_seconds: event.summary.callDurationSeconds,
      promise_kept: event.summary.promiseKept,
      tomorrow_commitment: event.summary.tomorrowCommitment,
      commitment_time: event.summary.commitmentTime,
      commitment_is_specific: event.summary.commitmentIsSpecific,
      sentiment_trajectory: event.summary.sentimentTrajectory,
      excuses_detected: event.summary.excusesDetected,
      quotes_captured: event.summary.quotesCaptured,
      call_type: event.summary.callType,
      mood: event.summary.mood,
      call_quality_score: event.summary.callQualityScore,
    });
    
    // 2. Update status (streak, call count, last_call_at)
    const { data: status } = await supabase
      .from('status')
      .select('current_streak_days, total_calls_completed')
      .eq('user_id', event.userId)
      .single();
    
    const newStreak = (status?.current_streak_days || 0) + 1;
    
    await supabase.from('status').upsert({
      user_id: event.userId,
      current_streak_days: newStreak,
      total_calls_completed: (status?.total_calls_completed || 0) + 1,
      last_call_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    
    // 3. Emit secondary events
    if (event.summary.promiseKept === true) {
      await bus.emit({
        type: 'promise.kept',
        userId: event.userId,
        commitment: event.summary.tomorrowCommitment || '',
      }, ctx.env);
    } else if (event.summary.promiseKept === false) {
      await bus.emit({
        type: 'promise.broken',
        userId: event.userId,
        excuse: event.summary.excusesDetected[0],
      }, ctx.env);
    }
    
    // 4. Emit streak update
    await bus.emit({
      type: 'streak.updated',
      userId: event.userId,
      newStreak,
      previousStreak: status?.current_streak_days || 0,
    }, ctx.env);
  });
}
```

**Estimated effort:** 4-5 hours

---

### Phase 4: Refactor Onboarding

**Goal:** Emit event at end of onboarding flow.

**Change in conversion-complete.ts:**
```typescript
// At the end of successful onboarding, before return:

await eventBus.emit({
  type: 'onboarding.completed',
  userId,
  pillars: createdPillars,
  primaryPillar: mappedPrimaryPillar,
  voiceCloned: !!cartesiaVoiceId,
}, env);

return c.json({
  success: true,
  message: "Onboarding completed successfully",
  // ...
});
```

**Onboarding event handlers (onboarding/handlers/events.ts):**
```typescript
export function registerOnboardingEventHandlers(bus: EventBus) {
  bus.on('onboarding.completed', async (event, ctx) => {
    console.log(`User ${event.userId} completed onboarding with pillars: ${event.pillars.join(', ')}`);
    
    // Future handlers can be added here:
    // - Send welcome notification
    // - Create initial gamification records
    // - Trigger welcome call scheduling
  });
}
```

**Estimated effort:** 1-2 hours

---

### Phase 5: Gamification Event Handlers

**Goal:** Add XP and achievement reactions to existing events.

**New file (gamification/handlers/events.ts):**
```typescript
import type { EventBus } from '@/events/bus';
import { createSupabaseClient } from '@/features/core/utils/database';

export function registerGamificationEventHandlers(bus: EventBus) {
  // ═══════════════════════════════════════════════════════════════
  // XP AWARDS
  // ═══════════════════════════════════════════════════════════════
  
  bus.on('subscription.created', async (event, ctx) => {
    await awardXP(ctx.env, event.userId, 100, 'first_subscription');
  });

  bus.on('onboarding.completed', async (event, ctx) => {
    await awardXP(ctx.env, event.userId, 50, 'onboarding_complete');
    
    // Bonus for completing with voice clone
    if (event.voiceCloned) {
      await awardXP(ctx.env, event.userId, 25, 'voice_cloned');
    }
  });

  bus.on('call.completed', async (event, ctx) => {
    // Base XP based on call duration
    const baseXP = event.summary.callDurationSeconds >= 60 ? 30 : 25;
    await awardXP(ctx.env, event.userId, baseXP, 'call_completed');
    
    // Bonus for high quality call
    if (event.summary.callQualityScore >= 0.8) {
      await awardXP(ctx.env, event.userId, 15, 'high_quality_call');
    }
  });

  bus.on('promise.kept', async (event, ctx) => {
    await awardXP(ctx.env, event.userId, 20, 'promise_kept');
  });

  bus.on('promise.broken', async (event, ctx) => {
    // Penalty (no multiplier applied)
    await awardXP(ctx.env, event.userId, -10, 'promise_broken', false);
  });

  // ═══════════════════════════════════════════════════════════════
  // ACHIEVEMENT CHECKS
  // ═══════════════════════════════════════════════════════════════

  bus.on('streak.updated', async (event, ctx) => {
    await checkStreakAchievements(ctx.env, event.userId, event.newStreak);
  });

  bus.on('call.completed', async (event, ctx) => {
    await checkCallAchievements(ctx.env, event.userId);
  });
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getStreakMultiplier(streakDays: number): number {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.5;
  if (streakDays >= 7) return 1.25;
  if (streakDays >= 3) return 1.1;
  return 1.0;
}

async function awardXP(
  env: Env,
  userId: string,
  baseAmount: number,
  reason: string,
  applyMultiplier: boolean = true
): Promise<void> {
  const supabase = createSupabaseClient(env);
  
  // Get current streak for multiplier
  let multiplier = 1.0;
  if (applyMultiplier && baseAmount > 0) {
    const { data: status } = await supabase
      .from('status')
      .select('current_streak_days')
      .eq('user_id', userId)
      .single();
    
    multiplier = getStreakMultiplier(status?.current_streak_days || 0);
  }
  
  const finalAmount = Math.floor(baseAmount * multiplier);
  
  // Create XP transaction
  await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount: finalAmount,
    reason,
    multiplier_applied: multiplier,
    base_amount: baseAmount,
  });
  
  // Update user progression
  await supabase.rpc('add_user_xp', {
    p_user_id: userId,
    p_amount: finalAmount,
  });
  
  console.log(`[Gamification] Awarded ${finalAmount} XP to ${userId} for ${reason} (${multiplier}x multiplier)`);
}

async function checkStreakAchievements(
  env: Env,
  userId: string,
  streak: number
): Promise<void> {
  const achievements: Record<number, string> = {
    7: 'week_warrior',
    14: 'fortnight_fighter',
    30: 'monthly_master',
    60: 'two_month_titan',
    90: 'quarter_champion',
    180: 'half_year_hero',
    365: 'year_legend',
  };
  
  const achievementId = achievements[streak];
  if (achievementId) {
    await unlockAchievement(env, userId, achievementId);
  }
}

async function checkCallAchievements(
  env: Env,
  userId: string
): Promise<void> {
  const supabase = createSupabaseClient(env);
  
  const { data: status } = await supabase
    .from('status')
    .select('total_calls_completed')
    .eq('user_id', userId)
    .single();
  
  const totalCalls = status?.total_calls_completed || 0;
  
  const achievements: Record<number, string> = {
    1: 'first_call',
    10: 'ten_calls',
    50: 'fifty_calls',
    100: 'hundred_calls',
    500: 'five_hundred_calls',
  };
  
  const achievementId = achievements[totalCalls];
  if (achievementId) {
    await unlockAchievement(env, userId, achievementId);
  }
}

async function unlockAchievement(
  env: Env,
  userId: string,
  achievementId: string
): Promise<void> {
  const supabase = createSupabaseClient(env);
  
  // Check if already unlocked
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .maybeSingle();
  
  if (existing) {
    return; // Already unlocked
  }
  
  // Get achievement definition for XP bonus
  const { data: achievement } = await supabase
    .from('achievements')
    .select('xp_bonus')
    .eq('id', achievementId)
    .single();
  
  // Unlock achievement
  await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
    unlocked_at: new Date().toISOString(),
  });
  
  // Award XP bonus
  if (achievement?.xp_bonus) {
    await awardXP(env, userId, achievement.xp_bonus, `achievement_${achievementId}`, false);
  }
  
  console.log(`[Gamification] Unlocked achievement ${achievementId} for ${userId}`);
}
```

**Estimated effort:** 4-5 hours

---

### Phase 6: Service Registry (Optional Enhancement)

**Goal:** Clean dependency management for testing.

**New file (services/registry.ts):**
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Env } from '@/types/environment';
import { createSupabaseClient } from '@/features/core/utils/database';
import { DodoPaymentsService } from '@/features/billing/dodopayments-service';
import { eventBus, type EventBus } from '@/events';

export interface ServiceRegistry {
  supabase: SupabaseClient<Database>;
  dodoPayments: DodoPaymentsService;
  eventBus: EventBus;
  env: Env;
}

export function createServices(env: Env): ServiceRegistry {
  return {
    supabase: createSupabaseClient(env),
    dodoPayments: new DodoPaymentsService(env),
    eventBus,
    env,
  };
}

// For testing - allows mocking services
export function createMockServices(overrides: Partial<ServiceRegistry>): ServiceRegistry {
  return {
    supabase: overrides.supabase || ({} as SupabaseClient<Database>),
    dodoPayments: overrides.dodoPayments || ({} as DodoPaymentsService),
    eventBus: overrides.eventBus || eventBus,
    env: overrides.env || ({} as Env),
  };
}
```

**Estimated effort:** 2 hours

---

## Final File Structure

```
backend/src/
├── events/
│   ├── index.ts              # Re-exports
│   ├── types.ts              # DomainEvent union type
│   ├── bus.ts                # EventBus class
│   └── register.ts           # Handler registration
├── services/
│   ├── interfaces.ts         # Service interfaces (optional)
│   └── registry.ts           # ServiceRegistry
├── features/
│   ├── billing/
│   │   ├── handlers/
│   │   │   ├── checkout.ts   # HTTP handlers (existing)
│   │   │   └── events.ts     # Event handlers (NEW)
│   │   ├── dodopayments-service.ts
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── core/
│   │   ├── handlers/
│   │   │   ├── call-events.ts  # (NEW)
│   │   │   ├── health.ts
│   │   │   ├── scheduled.ts
│   │   │   └── settings.ts
│   │   └── utils/
│   ├── gamification/         # (NEW feature folder)
│   │   ├── handlers/
│   │   │   └── events.ts
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── onboarding/
│   │   ├── handlers/
│   │   │   ├── conversion-complete.ts  # (refactored)
│   │   │   ├── events.ts     # (NEW)
│   │   │   └── returning-user.ts
│   │   └── ...
│   └── webhook/
│       ├── call-webhook.ts   # (NEW)
│       ├── dodo-webhook.ts   # (refactored - thin)
│       └── router.ts
├── index.ts                  # Register handlers on startup
└── ...
```

---

## Migration Strategy

### Step-by-Step Migration

| Step | Description | Risk | Rollback |
|------|-------------|------|----------|
| 1 | Create `events/` folder with types and bus | None | Delete folder |
| 2 | Add `registerAllEventHandlers()` to index.ts | None | Remove call |
| 3 | Add event emission to dodo-webhook (keep old logic) | Low | Remove emit |
| 4 | Create billing event handlers | Low | Remove file |
| 5 | Remove inline logic from dodo-webhook | Medium | Revert file |
| 6 | Add call-webhook endpoint | Low | Remove route |
| 7 | Create call event handlers | Low | Remove file |
| 8 | Update conversion-complete to emit event | Low | Remove emit |
| 9 | Create gamification event handlers | Low | Remove file |
| 10 | Add service registry | Low | Keep manual instantiation |

### Testing Strategy

1. **Unit tests for EventBus:**
   - Test handler registration
   - Test event emission
   - Test error handling (handler failures don't break other handlers)

2. **Integration tests for handlers:**
   - Mock Supabase client
   - Emit event, verify database calls

3. **E2E tests:**
   - Call webhook endpoint
   - Verify all side effects occurred

---

## Benefits Summary

| Before | After |
|--------|-------|
| Webhook contains 200+ lines of business logic | Webhook is ~50 lines (validate, emit) |
| Adding gamification = edit webhook handler | Adding gamification = new handler file |
| Testing requires full HTTP request | Test handlers in isolation |
| No visibility into domain events | Structured event log |
| Features import each other | Features only import events/ |
| Agent writes directly to DB | Agent calls webhook → events cascade |

---

## Future Enhancements

### Async Event Processing (Cloudflare Queues)

When needed for slow operations:

```typescript
// Instead of sync handlers for slow operations
bus.on('subscription.created', async (event, ctx) => {
  // Queue for async processing
  await ctx.env.EVENT_QUEUE.send({
    type: event.type,
    payload: event,
  });
});

// Worker consumes queue
export default {
  async queue(batch: MessageBatch<QueuedEvent>, env: Env) {
    for (const message of batch.messages) {
      await processQueuedEvent(message.body, env);
    }
  }
};
```

### Event Sourcing (Future)

Store all events for replay/debugging:

```typescript
bus.on('*', async (event, ctx) => {
  await supabase.from('event_log').insert({
    event_id: ctx.eventId,
    event_type: event.type,
    payload: event,
    timestamp: ctx.timestamp,
  });
});
```

### WebSocket Notifications (Future)

Push events to connected clients:

```typescript
bus.on('achievement.unlocked', async (event, ctx) => {
  await ctx.env.WEBSOCKET_DO.notify(event.userId, {
    type: 'achievement',
    data: event,
  });
});
```

---

## Estimated Total Effort

| Phase | Hours |
|-------|-------|
| Phase 1: Foundation | 2-3 |
| Phase 2: Webhook Refactor | 3-4 |
| Phase 3: Call Events | 4-5 |
| Phase 4: Onboarding Refactor | 1-2 |
| Phase 5: Gamification Handlers | 4-5 |
| Phase 6: Service Registry | 2 |
| **Total** | **16-21 hours** |

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Sync events first, async later | Simpler to implement, can add queues for specific slow handlers |
| In-memory event bus | Cloudflare Workers are stateless, no need for external broker |
| Handlers don't fail the request | One handler failure shouldn't break the entire flow |
| Events mirror Python agent | Consistent mental model across stack |
| No DI framework | Keep it simple, manual registry is sufficient |
