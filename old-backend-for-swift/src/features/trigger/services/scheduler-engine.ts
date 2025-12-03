import { CallType, User } from "@/types/database";
import { createSupabaseClient, getActiveUsers } from "@/features/core/utils/database";
import { processCartesiaCall } from "./cartesia-call-trigger";
import type { Env } from "@/index";

/* ═══════════════════════════════════════════════════════════════════════════════
 * ⏰ YOU+ INTELLIGENT SCHEDULER ENGINE
 *
 * The precision timing system that orchestrates AI accountability calls across
 * global timezones. Handles first-day onboarding rules, duplicate prevention,
 * and weekly limits using optimized SQL functions for maximum efficiency.
 *
 * Core Philosophy: "The right intervention at the right moment in the right timezone"
 * ═══════════════════════════════════════════════════════════════════════════════ */


/**
 * YOU+ SCHEDULER ENGINE
 *
 * Orchestrates AI accountability calls across global timezones.
 * - Runs every 17 minutes (Cloudflare Workers: "\*\/17 * * * *")
 * - Prevents duplicate calls (2-hour cooldown)
 * - Enforces weekly call limits (max 7 per user)
 * - Handles first-day onboarding rules
 * - Limits concurrent batches (max 10)
 * - All filtering and eligibility handled in optimized SQL for speed and reliability
 */
export class UserScheduleEngine {
  private env: Env; // 🔧 Environment configuration
  private supabase: any; // 🗄️ Database client instance

  constructor(env: Env) {
    this.env = env;
    this.supabase = createSupabaseClient(env);
  }

  /* ═══════════════════════════════════════════════════════════════════════════════
   * 🎯 GET USERS READY FOR CALLS RIGHT NOW
   *
   * The master function that identifies all users who need accountability calls
   * at this exact moment. Uses intelligent SQL function that handles:
   *
   * ✅ Timezone calculations (user's local time)
   * ✅ First-day onboarding rules (daily reckoning only)
   * ✅ Duplicate prevention (2-hour cooldown)
   * ✅ Weekly call limits (max 7 per user)
   * ✅ Call window validation (daily reckoning timing)
   *
   * Returns: Categorized users ready for immediate intervention
   * ═══════════════════════════════════════════════════════════════════════════════ */
  async getUsersNeedingCallsNow(): Promise<{
    dailyReckoning: User[]; // 🌇 Users ready for their daily reckoning call
    firstDay: User[]; // 🚀 New users needing first-day calls
  }> {
    try {
      // 🗄️ Call the optimized SQL function that does all the heavy lifting
      const { data: readyUsers, error } = await this.supabase.rpc(
        "get_users_ready_for_calls"
      );

      if (error) {
        console.error("❌ Error calling get_users_ready_for_calls:", error);
        return { dailyReckoning: [], firstDay: [] }; // 🛟 Safe fallback
      }

      // 📊 Initialize result arrays
      const dailyReckoningUsers: User[] = [];
      const firstDayUsers: User[] = [];

      // 🎯 Sort users into appropriate call categories (SQL does filtering, we just sort)
      for (const user of readyUsers || []) {
        if (user.is_first_day_call) {
          firstDayUsers.push(user); // 🚀 Priority: First-day users (highest impact)
        } else if (user.call_type === "daily_reckoning") {
          dailyReckoningUsers.push(user); // 📞 Daily reckoning calls
        }
      }

      console.log(
        `📞 Ready for calls: ${dailyReckoningUsers.length} daily reckoning, ${firstDayUsers.length} first-day`
      );

      return {
        dailyReckoning: dailyReckoningUsers,
        firstDay: firstDayUsers,
      };
    } catch (error) {
      console.error("💥 Critical error in getUsersNeedingCallsNow:", error);
      return { dailyReckoning: [], firstDay: [] }; // 🛟 Always return safe structure
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════════
   * 🚀 PROCESS ALL SCHEDULED CALLS - THE MAIN ORCHESTRATOR
   *
   * The central command center that processes all ready users through the
   * accountability pipeline. Handles three priority levels:
   *
   * 🥇 FIRST-DAY CALLS: Highest priority - onboarding impact
   * 🥈 DAILY RECKONING: Single daily accountability call system
   *
   * Each category is processed in parallel batches of 10 to respect
   * Cloudflare Workers concurrent limits and VoIP service constraints.
   * ═══════════════════════════════════════════════════════════════════════════════ */
  async processScheduledCalls(): Promise<{
    dailyReckoning: { processed: number; errors: number; results: any[] };
    firstDay: { processed: number; errors: number; results: any[] };
  }> {
    // 🎯 STEP 1: Get all users ready for calls right now
    const usersNeedingCalls = await this.getUsersNeedingCallsNow();

    console.log(
      `🎬 Processing calls: ${usersNeedingCalls.dailyReckoning.length} daily reckoning, ${usersNeedingCalls.firstDay.length} first-day`
    );

    // 🥇 STEP 2: Process first-day calls FIRST (highest psychological impact)
    const firstDayResults = await this.batchProcessCalls(
      usersNeedingCalls.firstDay,
      "daily_reckoning" // 🚀 Simplified: first-day calls use same daily_reckoning mode
    );

    // 🥈 STEP 3: Process daily reckoning calls (single daily call system)
    const dailyReckoningResults = await this.batchProcessCalls(
      usersNeedingCalls.dailyReckoning,
      "daily_reckoning" // 🌇 New single call system with identity psychology
    );

    return {
      dailyReckoning: dailyReckoningResults,
      firstDay: firstDayResults,
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════════
   * 🔄 BATCH CALL PROCESSOR - PARALLEL EXECUTION ENGINE
   *
   * Processes users in parallel batches to maximize throughput while respecting:
   *
   * 🚧 CONSTRAINTS:
   *    • Max 10 concurrent calls (VoIP service limits)
   *    • Cloudflare Workers execution time limits
   *    • Memory and CPU resource management
   *
   * 🎯 OPTIMIZATION:
   *    • Parallel processing within each batch
   *    • Error isolation (one failure doesn't stop others)
   *    • Comprehensive result tracking and metrics
   * ═══════════════════════════════════════════════════════════════════════════════ */
  private async batchProcessCalls(
    users: User[],
    callType: CallType
  ): Promise<{ processed: number; errors: number; results: any[] }> {
    const results = [];
    let processed = 0;
    let errors = 0;

    // ⚡ Process in chunks of 10 to respect VoIP concurrent call limits
    const BATCH_SIZE = 10;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      console.log(
        `🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          users.length / BATCH_SIZE
        )} - ${batch.length} ${callType} calls`
      );

      // 🚀 Execute this batch in parallel (max 10 concurrent calls)
      const batchPromises = batch.map(async (user) => {
        try {
          console.log(
            `📞 Processing ${callType} call: ${user.id} (${user.timezone})`
          );

          // 🎯 Trigger the Cartesia Line call (real telephony)
          const result = await processCartesiaCall(user, callType, this.env);

          if (result.success) {
            console.log(`✅ ${callType} call success: ${user.id}`);
          } else {
            console.log(
              `❌ ${callType} call failed: ${user.id} - ${result.error}`
            );
          }

          return {
            userId: user.id,
            callType,
            success: result.success,
            error: result.error,
          };
        } catch (error) {
          console.error(
            `💥 Critical error processing ${callType} call for ${user.id}:`,
            error
          );

          return {
            userId: user.id,
            callType,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      // ⏳ Wait for all calls in this batch to complete (parallel execution)
      const batchResults = await Promise.all(batchPromises);

      // 📊 Count successes and errors for metrics tracking
      for (const result of batchResults) {
        if (result.success) {
          processed++; // ✅ Successful call initiated
        } else {
          errors++; // ❌ Call failed to initiate
        }
        results.push(result);
      }

      // 🚀 No artificial delays - Cloudflare Workers have strict execution limits
      // Cron frequency (17 minutes) prevents call overlap naturally
    }

    return { processed, errors, results };
  }

  /**
   * Get schedule preview for debugging
   * Shows when each user's next calls are scheduled
   */
  async getSchedulePreview(): Promise<{
    users: Array<{
      id: string;
      name: string;
      timezone: string;
      nextCall: string | null;
      callWindow: string;
    }>;
  }> {
    const users = await getActiveUsers(this.env);
    const now = new Date();

    const preview = users.map((user) => {
      return {
        id: user.id,
        name: user.name,
        timezone: user.timezone,
        nextCall: this.calculateNextCallTime(user, now),
        callWindow: user.call_window_start ? `${user.call_window_start} (${user.call_window_timezone || 'UTC'})` : 'Not set',
      };
    });

    return { users: preview };
  }

  /**
   * Calculate when the next call should happen for a user
   */
  private calculateNextCallTime(
    user: User,
    currentTime: Date
  ): string | null {
    try {
      const userLocalTime = new Date(
        currentTime.toLocaleString("en-US", { timeZone: user.timezone })
      );

      const windowStart = user.call_window_start;

      if (!windowStart) {
        console.error(`Missing call window start for user ${user.id}`);
        return null;
      }

      const startParts = windowStart.split(":");
      if (startParts.length !== 2) {
        console.error(`Invalid time format for user ${user.id}`);
        return null;
      }

      const startHour = parseInt(startParts[0] || "0", 10);
      const startMinute = parseInt(startParts[1] || "0", 10);

      if (isNaN(startHour) || isNaN(startMinute)) {
        console.error(`Invalid time values for user ${user.id}`);
        return null;
      }

      // Check if we're already past today's window
      const todayWindowStart = new Date(userLocalTime);
      todayWindowStart.setHours(startHour, startMinute, 0, 0);

      let nextCallTime: Date;

      if (userLocalTime < todayWindowStart) {
        // Today's window hasn't started yet
        nextCallTime = todayWindowStart;
      } else {
        // Today's window has passed, schedule for tomorrow
        nextCallTime = new Date(todayWindowStart);
        nextCallTime.setDate(nextCallTime.getDate() + 1);
      }

      return nextCallTime.toLocaleString("en-US", {
        timeZone: user.timezone,
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch (error) {
      console.error(
        `Error calculating next call time for user ${user.id}:`,
        error
      );
      return null;
    }
  }
}

/**
 * Factory function to create scheduler instance
 */
export function createScheduler(env: Env): UserScheduleEngine {
  return new UserScheduleEngine(env);
}

/**
 * Utility function to check if any users need calls right now
 * Uses efficient SQL function with first-day rules
 */
export async function shouldTriggerCalls(env: Env): Promise<boolean> {
  const scheduler = createScheduler(env);
  const usersNeedingCalls = await scheduler.getUsersNeedingCallsNow();

  return (
    usersNeedingCalls.dailyReckoning.length > 0 ||
    usersNeedingCalls.firstDay.length > 0
  );
}