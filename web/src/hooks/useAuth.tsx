'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '@/services/auth';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  signInWithApple: (redirectTo?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get auth state from cookies (via browser client)
        console.log('[useAuth] Initializing auth state...');
        const authState = await authService.getAuthState();
        console.log('[useAuth] Auth state received:', { 
          hasUser: !!authState.user, 
          userEmail: authState.user?.email,
          hasSession: !!authState.session 
        });
        
        if (mounted) {
          setUser(authState.user);
          setSession(authState.session);
        }
      } catch (error) {
        console.error('[AUTH] Error initializing:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes (handled by cookies automatically)
    const unsubscribe = authService.onAuthStateChange((newUser, newSession) => {
      if (mounted) {
        setUser(newUser);
        setSession(newSession);
        setLoading(false);

        // Note: updateLastLogin removed - column doesn't exist in users table
        // If needed, add last_login_at column to users table first
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (redirectTo?: string) => {
    return authService.signInWithGoogle(redirectTo);
  };

  const signInWithApple = async (redirectTo?: string) => {
    return authService.signInWithApple(redirectTo);
  };

  const signOut = async () => {
    const result = await authService.signOut();
    if (!result.error) {
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export function useRequireAuth(redirectTo: string = '/auth/login'): AuthContextType {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [auth.loading, auth.isAuthenticated, redirectTo]);

  return auth;
}
