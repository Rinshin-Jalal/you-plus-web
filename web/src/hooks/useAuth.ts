/**
 * useAuth Hook
 * Provides authentication state and functions throughout the app
 * Uses React Context for global state management
 */

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

/**
 * Auth Provider Component
 * Wrap your app with this to provide auth state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const authState = await authService.getAuthState();
        
        if (mounted) {
          setUser(authState.user);
          setSession(authState.session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((newUser, newSession) => {
      if (mounted) {
        setUser(newUser);
        setSession(newSession);
        setLoading(false);

        // Update last login timestamp when user logs in
        if (newUser && !user) {
          authService.updateLastLogin(newUser.id).catch(console.error);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (redirectTo?: string) => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle(redirectTo);
      return result;
    } finally {
      // Don't set loading to false here - auth state change will handle it
    }
  };

  const signInWithApple = async (redirectTo?: string) => {
    setLoading(true);
    try {
      const result = await authService.signInWithApple(redirectTo);
      return result;
    } finally {
      // Don't set loading to false here - auth state change will handle it
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await authService.signOut();
      if (!result.error) {
        setUser(null);
        setSession(null);
      }
      return result;
    } finally {
      setLoading(false);
    }
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

/**
 * useAuth Hook
 * Access auth state and functions from any component
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Helper hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/auth/login'): AuthContextType {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [auth.loading, auth.isAuthenticated, redirectTo]);

  return auth;
}
