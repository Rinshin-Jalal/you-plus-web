/**
 * Supabase Client - uses @supabase/ssr for Next.js compatibility
 * Updated for migrations 002-005 schema
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Session, User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js'
import type {
  User,
  Status,
  CallMemory,
  CallAnalytics,
  Subscription,
  DashboardStats,
  FutureSelf,
  FutureSelfPillar,
  IdentityAlignment
} from '@/types'

// Singleton for browser - only initialize on client side
let browserClient: SupabaseClient | null = null

// Get or create the Supabase client - always call this function, never cache the result at module level
export const getClient = (): SupabaseClient => {
  // Return existing client if available (browser only)
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient
  }
  
  // Create new client
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Cache in browser only
  if (typeof window !== 'undefined') {
    browserClient = client
  }
  
  return client
}

// For backward compatibility - this creates a lazy proxy
// The actual client is only created when a property is accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

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
    const currentOrigin = window.location.origin
    const callbackUrl = redirectTo || `${currentOrigin}/auth/callback`
    
    // Log origin for debugging PKCE issues
    console.debug('[AUTH] Starting Google OAuth from origin:', currentOrigin)
    console.debug('[AUTH] Redirect URL:', callbackUrl)
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      console.error('[AUTH] Google OAuth error:', error)
      return { error }
    }

    // Verify PKCE verifier was stored (SSR package uses cookies, not localStorage)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl?.match(/https?:\/\/([^.]*)/)?.[1]
    if (projectRef) {
      const verifierKey = `sb-${projectRef}-auth-code-verifier`
      // Check both cookie and localStorage
      const cookieVerifier = document.cookie.split('; ').find(c => c.startsWith(verifierKey))
      const localStorageVerifier = window.localStorage.getItem(verifierKey)
      console.debug('[AUTH] PKCE verifier stored:', { 
        key: verifierKey, 
        inCookie: !!cookieVerifier,
        cookieValue: cookieVerifier?.substring(0, 50) + '...',
        inLocalStorage: !!localStorageVerifier,
      })
      console.debug('[AUTH] All cookies:', document.cookie.substring(0, 200) + '...')
    }

    // Allow Supabase to redirect; as a fallback, follow the URL
    if (data?.url) window.location.href = data.url

    return { error: null }
  },

  async signInWithApple(redirectTo?: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const currentOrigin = window.location.origin
    const callbackUrl = redirectTo || `${currentOrigin}/auth/callback`
    
    // Log origin for debugging PKCE issues
    console.debug('[AUTH] Starting Apple OAuth from origin:', currentOrigin)
    console.debug('[AUTH] Redirect URL:', callbackUrl)
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      console.error('[AUTH] Apple OAuth error:', error)
      return { error }
    }

    // Verify PKCE verifier was stored (SSR package uses cookies, not localStorage)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const projectRef = supabaseUrl?.match(/https?:\/\/([^.]*)/)?.[1]
    if (projectRef) {
      const verifierKey = `sb-${projectRef}-auth-code-verifier`
      const cookieVerifier = document.cookie.split('; ').find(c => c.startsWith(verifierKey))
      const localStorageVerifier = window.localStorage.getItem(verifierKey)
      console.debug('[AUTH] PKCE verifier stored:', { 
        key: verifierKey, 
        inCookie: !!cookieVerifier,
        inLocalStorage: !!localStorageVerifier,
      })
    }

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
   * Get user status (streak, trust score, promise stats)
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
   * Get full dashboard data
   */
  async getDashboardData(userId: string): Promise<{
    user: User | null;
    status: Status | null;
    callMemory: CallMemory | null;
    recentCalls: CallAnalytics[];
    subscription: Subscription | null;
  }> {
    const client = getClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    const [
      userResult,
      statusResult,
      callMemoryResult,
      recentCallsResult,
      subscriptionResult,
    ] = await Promise.all([
      client.from('users').select('*').eq('id', userId).single(),
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 5 PILLARS SYSTEM (Migration 009)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get user's future self (core identity)
   */
  async getFutureSelf(userId: string): Promise<{ data: FutureSelf | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('future_self')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  /**
   * Get user's pillars with their states
   */
  async getPillars(userId: string): Promise<{ data: FutureSelfPillar[] | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .from('future_self_pillars')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('priority', { ascending: false })
    return { data, error }
  },

  /**
   * Get pillar with summary stats (using RPC)
   */
  async getPillarSummary(userId: string): Promise<{ data: FutureSelfPillar[] | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .rpc('get_pillar_summary', { p_user_id: userId })
    return { data, error }
  },

  /**
   * Get pillar alignment (using RPC)
   */
  async getPillarAlignment(userId: string): Promise<{ data: IdentityAlignment | null; error: Error | null }> {
    const client = getClient()
    const { data, error } = await client
      .rpc('get_pillar_alignment', { p_user_id: userId })
    
    // RPC returns an array with one row
    if (data && Array.isArray(data) && data.length > 0) {
      return { data: data[0] as IdentityAlignment, error: null }
    }
    return { data: null, error }
  },

  /**
   * Get full dashboard data including pillars
   */
  async getDashboardDataWithPillars(userId: string): Promise<{
    user: User | null;
    status: Status | null;
    callMemory: CallMemory | null;
    recentCalls: CallAnalytics[];
    subscription: Subscription | null;
    futureSelf: FutureSelf | null;
    pillars: FutureSelfPillar[];
    pillarAlignment: IdentityAlignment | null;
  }> {
    const client = getClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    const [
      userResult,
      statusResult,
      callMemoryResult,
      recentCallsResult,
      subscriptionResult,
      futureSelfResult,
      pillarsResult,
      alignmentResult,
    ] = await Promise.all([
      client.from('users').select('*').eq('id', userId).single(),
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
      client.from('future_self').select('*').eq('user_id', userId).single(),
      client.from('future_self_pillars')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('priority', { ascending: false }),
      client.rpc('get_pillar_alignment', { p_user_id: userId }),
    ])

    // Extract alignment from RPC result (returns array)
    let pillarAlignment: IdentityAlignment | null = null
    if (alignmentResult.data && Array.isArray(alignmentResult.data) && alignmentResult.data.length > 0) {
      pillarAlignment = alignmentResult.data[0] as IdentityAlignment
    }

    return {
      user: userResult.data as User | null,
      status: statusResult.data as Status | null,
      callMemory: callMemoryResult.data as CallMemory | null,
      recentCalls: (recentCallsResult.data as CallAnalytics[]) || [],
      subscription: subscriptionResult.data as Subscription | null,
      futureSelf: futureSelfResult.data as FutureSelf | null,
      pillars: (pillarsResult.data as FutureSelfPillar[]) || [],
      pillarAlignment,
    }
  },

  /**
   * Compute dashboard stats including pillar alignment
   */
  computeStatsWithPillars(status: Status | null, pillarAlignment: IdentityAlignment | null): DashboardStats {
    const baseStats = this.computeStats(status)
    
    if (pillarAlignment) {
      return {
        ...baseStats,
        identityAlignment: pillarAlignment.overall_alignment,
        transformationStatus: pillarAlignment.transformation_status,
      }
    }
    
    return baseStats
  },
}

export default supabase
