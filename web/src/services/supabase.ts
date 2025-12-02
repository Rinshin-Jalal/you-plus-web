/**
 * Supabase Client - uses @supabase/ssr ONLY
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Session, User } from '@supabase/supabase-js'

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

  async getUser(): Promise<User | null> {
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
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: true, // Handle redirect manually for Safari compatibility
      },
    })
    
    if (error) return { error }
    
    // Manual redirect - more reliable in Safari
    if (data?.url) {
      window.location.href = data.url
    }
    
    return { error: null }
  },

  async signInWithApple(redirectTo?: string): Promise<{ error: Error | null }> {
    const client = getClient()
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true, // Handle redirect manually for Safari compatibility
      },
    })
    
    if (error) return { error }
    
    // Manual redirect - more reliable in Safari
    if (data?.url) {
      window.location.href = data.url
    }
    
    return { error: null }
  },

  async signOut(): Promise<{ error: Error | null }> {
    const client = getClient()
    const { error } = await client.auth.signOut({ scope: 'global' })
    return { error: error || null }
  },

  onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
    const client = getClient()
    return client.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null, session)
    })
  },
}

/**
 * Database helper functions
 */
export const db = {
  async getUserProfile(userId: string) {
    const client = getClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateLastLogin(userId: string) {
    const client = getClient()
    const { error } = await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)
    return { error }
  },

  async getSubscriptionHistory(userId: string) {
    const client = getClient()
    const { data, error } = await client
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },
}

export default supabase
