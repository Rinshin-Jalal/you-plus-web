/**
 * Domain Event Type Definitions
 *
 * This file defines all domain events that flow through the event bus.
 * Events are the core of our event-driven architecture, enabling:
 * - Decoupled features
 * - Easy addition of new reactions to domain events
 * - Better testability through isolated handlers
 */

// ═══════════════════════════════════════════════════════════════════════════
// PAYLOAD TYPES
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN EVENTS
// ═══════════════════════════════════════════════════════════════════════════

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
      customerName?: string;
    }
  | {
      type: 'subscription.cancelled';
      userId: string;
      subscriptionId?: string;
      reason?: string;
    }
  | {
      type: 'subscription.renewed';
      userId: string;
      subscriptionId?: string;
    }
  | {
      type: 'subscription.failed';
      userId: string;
      subscriptionId?: string;
    }
  | {
      type: 'subscription.on_hold';
      userId: string;
      subscriptionId?: string;
    }
  | {
      type: 'subscription.expired';
      userId: string;
      subscriptionId?: string;
    }

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT EVENTS
  // ═══════════════════════════════════════════════════════════════
  | {
      type: 'payment.succeeded';
      userId?: string;
      subscriptionId?: string;
      amountCents?: number;
    }
  | {
      type: 'payment.failed';
      userId?: string;
      subscriptionId?: string;
      reason?: string;
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
      scheduledFor?: string;
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
      scheduledFor?: string;
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

// ═══════════════════════════════════════════════════════════════════════════
// TYPE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract event type literals from DomainEvent union
 */
export type DomainEventType = DomainEvent['type'];

/**
 * Extract specific event by type
 */
export type EventByType<T extends DomainEventType> = Extract<
  DomainEvent,
  { type: T }
>;






