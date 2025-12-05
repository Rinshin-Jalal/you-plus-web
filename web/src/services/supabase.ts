/**
 * Supabase Client - uses @supabase/ssr ONLY
 * Updated for migrations 002-005 schema
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type {
  User,
  Identity,
  Status,
  CallMemory,
  CallAnalytics,
  Subscription,
  DashboardStats
} from '@/types'

// Create browser client once
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Safari-compatible cookie settings
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}

// Singleton for browser
let browserClient: ReturnType<typeof createBrowserClient> | null = null

const getClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create new client
    return createClient()
  }
  // Browser: use singleton
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

export const supabase = getClient()

/**
 * Auth helper functions
 */
export const auth = {
  async getSession(): Promise<Session | null> {
    const client = getClient()
    const { data, error } = await client.auth.getSession()
    if (error) return null
    return data.session
  },

  async getUser(): Promise<SupabaseUser | null> {
    const client = getClient()
    const { data, error } = await client.auth.getUser()
    if (error) return null
    return data.user
  },

  async signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        flowType: 'pkce',
      },
    })

    if (error) return { error }

    // Allow Supabase to redirect; as a fallback, follow the URL
    if (data?.url) window.location.href = data.url

    return { error: null }
  },

  async signInWithApple(redirectTo?: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        flowType: 'pkce',
      },
    })

    if (error) return { error }

    if (data?.url) window.location.href = data.url

    return { error: null }
  },

  async signOut(): Promise<{ error: Error | null }> {
    const client = getClient()
    const { error } = await client.auth.signOut({ scope: 'global' })
    return { error: error || null }
  },

  onAuthStateChange(callback: (user: SupabaseUser | null, session: Session | null) => void) {
    const client = getClient()
    return client.auth.onAuthStateChange((_event: string, session: Session | null) => {
      callback(session?.user || null, session)
    })
  },
}

/**
 * Database helper functions - aligned with migrations 002-005
 */
export const db = {
  /**
   * Get user profile from users table
   */
  async getUserProfile(userId: string): Promise<{ data: User | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  /**
   * Get user identity (goals, commitment, voice)
   */
  async getIdentity(userId: string): Promise<{ data: Identity | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('identity')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  /**
   * Get user status (streak, trust score, promise stats)
   * NOTE: Renamed from identity_status in migration 004
   */
  async getStatus(userId: string): Promise<{ data: Status | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('status')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  /**
   * Get call memory (narrative state, quotes, personas)
   */
  async getCallMemory(userId: string): Promise<{ data: CallMemory | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('call_memory')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  /**
   * Get recent call analytics (last 7 days)
   */
  async getRecentCallAnalytics(userId: string, days: number = 7): Promise<{ data: CallAnalytics[] | null; error: Error | null }> {
    const client = getClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await client
      .from('call_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
    return { data, error }
  },

  /**
   * Get current subscription (DodoPayments only)
   */
  async getSubscription(userId: string): Promise<{ data: Subscription | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    return { data, error }
  },

  /**
   * Get full dashboard data in one call
   */
  async getDashboardData(userId: string): Promise<{
    user: User | null;
    identity: Identity | null;
    status: Status | null;
    callMemory: CallMemory | null;
    recentCalls: CallAnalytics[];
    subscription: Subscription | null;
  }> {
    const client = getClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    // Execute all queries in parallel
    const [
      userResult,
      identityResult,
      statusResult,
      callMemoryResult,
      recentCallsResult,
      subscriptionResult,
    ] = await Promise.all([
      client.from('users').select('*').eq('id', userId).single(),
      client.from('identity').select('*').eq('user_id', userId).single(),
      client.from('status').select('*').eq('user_id', userId).single(),
      client.from('call_memory').select('*').eq('user_id', userId).single(),
      client.from('call_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false }),
      client.from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ])

    return {
      user: userResult.data as User | null,
      identity: identityResult.data as Identity | null,
      status: statusResult.data as Status | null,
      callMemory: callMemoryResult.data as CallMemory | null,
      recentCalls: (recentCallsResult.data as CallAnalytics[]) || [],
      subscription: subscriptionResult.data as Subscription | null,
    }
  },

  /**
   * Compute dashboard stats from status data
   */
  computeStats(status: Status | null): DashboardStats {
    if (!status) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        trustScore: 50,
        promisesKeptTotal: 0,
        promisesBrokenTotal: 0,
        promisesKeptLast7Days: 0,
        promisesBrokenLast7Days: 0,
        totalCalls: 0,
        successRate: 0,
      }
    }

    const totalPromises = status.promises_kept_total + status.promises_broken_total
    const successRate = totalPromises > 0
      ? status.promises_kept_total / totalPromises
      : 0

    return {
      currentStreak: status.current_streak_days,
      longestStreak: status.longest_streak_days,
      trustScore: status.trust_score,
      promisesKeptTotal: status.promises_kept_total,
      promisesBrokenTotal: status.promises_broken_total,
      promisesKeptLast7Days: status.promises_kept_last_7_days,
      promisesBrokenLast7Days: status.promises_broken_last_7_days,
      totalCalls: status.total_calls_completed,
      successRate,
    }
  },

  /**
   * Update user timezone
   */
  async updateTimezone(userId: string, timezone: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const { error } = await client
      .from('users')
      .update({ timezone, updated_at: new Date().toISOString() })
      .eq('id', userId)
    return { error }
  },

  /**
   * Pause/unpause calls
   */
  async pauseCalls(userId: string, pauseUntil?: Date): Promise<{ error: Error | null }> {
    const client = getClient()
    const { error } = await client
      .from('status')
      .update({
        calls_paused: true,
        calls_paused_until: pauseUntil?.toISOString() || null,
      })
      .eq('user_id', userId)
    return { error }
  },

  async unpauseCalls(userId: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const { error } = await client
      .from('status')
      .update({
        calls_paused: false,
        calls_paused_until: null,
      })
      .eq('user_id', userId)
    return { error }
  },

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const { error } = await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
    return { error }
  },
}

export default supabase
