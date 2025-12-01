/**
 * BEHAVIORAL PATTERN ANALYSIS - SUPER MVP
 *
 * Generates behavioral intelligence from Super MVP simplified schema.
 * Focuses on streak tracking and performance patterns without bloated metrics.
 */
import { MemoryInsights, UserPromise, IdentityStatus, Identity } from "@/types/database";
/**
 * Generates behavioral pattern analysis from memory insights and identity status data (Super MVP)
 *
 * Super MVP Changes:
 * - Removed trust_percentage (psychological pressure mechanism removed)
 * - Removed promises_made_count, promises_broken_count (simplified tracking)
 * - Uses current_streak_days, total_calls_completed, last_call_at only
 */
export declare function generateBehavioralIntelligence(memoryInsights: MemoryInsights, streakPattern: UserPromise[], identityStatus: IdentityStatus | null, identity: Identity | null): string;
/**
 * Generates pattern analysis from recent promise performance
 */
export declare function generatePatternAnalysis(recentPattern: UserPromise[]): string;
/**
 * Generates memory context from memory insights structure
 */
export declare function generateMemoryInsightsContext(memoryInsights: MemoryInsights): string;
