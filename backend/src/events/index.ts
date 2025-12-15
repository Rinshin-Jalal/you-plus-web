/**
 * Events Module - Public API
 *
 * This module provides the event-driven architecture for the backend.
 * Re-exports everything that other modules need.
 *
 * Usage:
 * ```typescript
 * import { eventBus, DomainEvent, registerAllEventHandlers } from '@/events';
 *
 * // In index.ts (startup)
 * registerAllEventHandlers();
 *
 * // In handlers (emit events)
 * await eventBus.emit({
 *   type: 'subscription.created',
 *   userId: '...',
 *   customerId: '...',
 *   plan: '...'
 * }, env);
 *
 * // In feature handlers (listen to events)
 * eventBus.on('subscription.created', async (event, ctx) => {
 *   // Handle event...
 * });
 * ```
 */

// Event Bus
export { eventBus, EventBus, type EventContext, type EventHandler } from './bus';

// Event Types
export {
  type DomainEvent,
  type DomainEventType,
  type EventByType,
  type CallSummaryPayload,
} from './types';

// Registration
export { registerAllEventHandlers } from './register';







