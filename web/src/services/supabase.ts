/**
 * Supabase Client Configuration
 * Provides configured Supabase client with proper typing and error handling
 * Supports Google/Apple OAuth authentication
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check .env.local');
}

/**
 * Create Supabase client with proper configuration
 * Uses localStorage for session persistence
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist session in localStorage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Important for OAuth redirects
  },
});

/**
 * Type-safe database types (extend as needed)
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          last_login_at: string | null;
          revenuecat_customer_id: string | null;
          subscription_status: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          last_login_at?: string | null;
          revenuecat_customer_id?: string | null;
          subscription_status?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          last_login_at?: string | null;
          revenuecat_customer_id?: string | null;
          subscription_status?: string | null;
        };
      };
      subscription_history: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          previous_status: string | null;
          new_status: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          previous_status?: string | null;
          new_status?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          previous_status?: string | null;
          new_status?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
    };
  };
}

/**
 * Auth helper functions
 */
export const auth = {
  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error.message);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Unexpected error getting session:', error);
      return null;
    }
  },

  /**
   * Get current user
   */
  async getUser(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error.message);
        return null;
      }
      return data.user;
    } catch (error) {
      console.error('Unexpected error getting user:', error);
      return null;
    }
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { error: error as Error };
    }
  },

  /**
   * Sign in with Apple OAuth
   */
  async signInWithApple(redirectTo?: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      return { error: error as Error };
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        return { error };
      }
      return { error: null };
    } catch (error) {
      console.error('Unexpected error signing out:', error);
      return { error: error as Error };
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null, session);
    });
  },
};

/**
 * Database helper functions
 */
export const db = {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * Update user last login timestamp
   */
  async updateLastLogin(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Error updating last login:', error.message);
      }

      return { error };
    } catch (error) {
      console.error('Unexpected error updating last login:', error);
      return { error: error as Error };
    }
  },

  /**
   * Get subscription history for user
   */
  async getSubscriptionHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscription history:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching subscription history:', error);
      return { data: null, error: error as Error };
    }
  },
};

export default supabase;
