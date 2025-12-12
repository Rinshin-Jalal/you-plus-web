/**
 * Event Bus Implementation
 *
 * A simple in-memory event bus for Cloudflare Workers.
 * Cloudflare Workers are stateless, so we don't need an external broker.
 *
 * Key features:
 * - Type-safe event handling
 * - Error isolation (one handler failure doesn't break others)
 * - Structured logging for observability
 */

import type { Env } from '@/types/environment';
import type { DomainEvent, DomainEventType, EventByType } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT & HANDLER TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface EventContext {
  env: Env;
  eventId: string;
  timestamp: Date;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T,
  ctx: EventContext
) => Promise<void>;

// ═══════════════════════════════════════════════════════════════════════════
// EVENT BUS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register a handler for a specific event type.
   * Handlers are type-safe - the event parameter is narrowed to the specific event type.
   *
   * @example
   * eventBus.on('subscription.created', async (event, ctx) => {
   *   // event is typed as { type: 'subscription.created', userId: string, ... }
   *   console.log(event.userId);
   * });
   */
  on<T extends DomainEventType>(
    type: T,
    handler: EventHandler<EventByType<T>>
  ): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(type, existing);
    console.log(`[EventBus] Registered handler for ${type} (total: ${existing.length})`);
  }

  /**
   * Emit an event to all registered handlers.
   * Handlers run in parallel using Promise.allSettled.
   * One handler failure won't break the entire flow.
   *
   * @example
   * await eventBus.emit({
   *   type: 'subscription.created',
   *   userId: '123',
   *   customerId: 'cust_456',
   *   plan: 'pro'
   * }, env);
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

    console.log(
      `[EventBus] Emitting ${event.type} (${ctx.eventId}) to ${handlers.length} handler(s)`
    );

    // Run all handlers in parallel, collect results
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event, ctx))
    );

    // Log any failures (but don't throw - we want all handlers to run)
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `[EventBus] Handler ${index + 1} for ${event.type} failed:`,
          result.reason
        );
      }
    });

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `[EventBus] ${event.type} completed: ${succeeded} succeeded, ${failed} failed`
    );
  }

  /**
   * Clear all handlers. Useful for testing.
   */
  clearHandlers(): void {
    this.handlers.clear();
    console.log('[EventBus] All handlers cleared');
  }

  /**
   * Get the number of handlers registered for an event type.
   * Useful for testing and debugging.
   */
  getHandlerCount(type: string): number {
    return this.handlers.get(type)?.length || 0;
  }

  /**
   * Get all registered event types.
   * Useful for debugging.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Singleton event bus instance.
 * Use this throughout the application to emit and handle events.
 */
export const eventBus = new EventBus();

// Also export the class for testing purposes
export { EventBus };





