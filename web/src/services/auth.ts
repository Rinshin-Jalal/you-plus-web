import { auth as supabaseAuth, db } from './supabase';
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

class AuthService {
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

  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Call server API to clear cookies
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      // Sign out from client (Supabase will handle cookie cleanup)
      const result = await supabaseAuth.signOut();

      if (result.error) {
        console.error('Sign out error:', result.error);
        return { error: result.error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      return { error: error as Error };
    }
  }

  async getSession(): Promise<Session | null> {
    return supabaseAuth.getSession();
  }

  async getUser(): Promise<User | null> {
    return supabaseAuth.getUser();
  }

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

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await db.updateLastLogin(userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  onAuthStateChange(
    callback: (user: User | null, session: Session | null) => void
  ): () => void {
    const { data } = supabaseAuth.onAuthStateChange(callback);

    return () => {
      data.subscription.unsubscribe();
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  }
}

export const authService = new AuthService();
export default authService;
