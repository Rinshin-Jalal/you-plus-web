/**
 * Auth Service
 * Handles authentication operations using Google/Apple OAuth via Supabase
 * NO email/password authentication - OAuth only
 */

import { auth as supabaseAuth, db, supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Auth Service Class
 */
class AuthService {
  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
    try {
      const result = await supabaseAuth.signInWithGoogle(redirectTo);
      
      if (result.error) {
        console.error('Google sign-in error:', result.error);
        return { error: result.error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected Google sign-in error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Sign in with Apple OAuth
   */
  async signInWithApple(redirectTo?: string): Promise<{ error: Error | null }> {
    try {
      const result = await supabaseAuth.signInWithApple(redirectTo);
      
      if (result.error) {
        console.error('Apple sign-in error:', result.error);
        return { error: result.error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected Apple sign-in error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const result = await supabaseAuth.signOut();
      
      if (result.error) {
        console.error('Sign out error:', result.error);
        return { error: result.error };
      }

      // Clear any local storage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    return supabaseAuth.getSession();
  }

  /**
   * Get current user
   */
  async getUser(): Promise<User | null> {
    return supabaseAuth.getUser();
  }

  /**
   * Get current auth state
   */
  async getAuthState(): Promise<AuthState> {
    try {
      const user = await this.getUser();
      const session = await this.getSession();
      
      return {
        user,
        session,
        loading: false,
      };
    } catch (error) {
      console.error('Error getting auth state:', error);
      return {
        user: null,
        session: null,
        loading: false,
      };
    }
  }

  /**
   * Update last login timestamp after successful login
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await db.updateLastLogin(userId);
    } catch (error) {
      // Non-critical error - log but don't throw
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Listen to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(
    callback: (user: User | null, session: Session | null) => void
  ): () => void {
    const { data } = supabaseAuth.onAuthStateChange(callback);
    
    // Return unsubscribe function
    return () => {
      data.subscription.unsubscribe();
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  }

  /**
   * Handle OAuth callback (called after redirect from OAuth provider)
   */
  async handleOAuthCallback(): Promise<{ user: User | null; error: Error | null }> {
    try {
      // Supabase automatically handles the callback
      // We just need to get the current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        return { user: null, error };
      }

      if (!session) {
        return { user: null, error: new Error('No session found after OAuth callback') };
      }

      // Update last login
      await this.updateLastLogin(session.user.id);

      return { user: session.user, error: null };
    } catch (error) {
      console.error('Unexpected OAuth callback error:', error);
      return { user: null, error: error as Error };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export for testing/mocking
export default authService;
