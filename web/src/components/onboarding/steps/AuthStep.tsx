'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthStepProps {
  data: Record<string, unknown>;
  onComplete: () => void;
}

export const AuthStep = ({ data, onComplete }: AuthStepProps) => {
  const { signInWithGoogle, signInWithApple, signInWithPassword, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const name = (data?.name as string) || (data?.[4] as string) || 'there';

  // If already authenticated, complete immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      onComplete();
    }
  }, [isAuthenticated, onComplete]);

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    setError(null);

    try {
      // Redirect to welcome checkout (personalized for onboarding users) after auth
      const result = await signInWithGoogle('/checkout/welcome');
      if (result.error) {
        setError('Failed to sign in with Google. Please try again.');
        setIsLoading(null);
      }
      // If successful, the page will redirect
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading('apple');
    setError(null);

    try {
      // Redirect to welcome checkout (personalized for onboarding users) after auth
      const result = await signInWithApple('/checkout/welcome');
      if (result.error) {
        setError('Failed to sign in with Apple. Please try again.');
        setIsLoading(null);
      }
      // If successful, the page will redirect
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(null);
    }
  };

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setIsLoading('email');
    setError(null);

    try {
      const result = await signInWithPassword(email, password);
      if (result.error) {
        setError(result.error.message || 'Failed to sign in. Please try again.');
        setIsLoading(null);
      }
      // If successful, the auth state change will trigger onComplete
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4 text-white">
          Lock it in, {name}.
        </h2>
        <p className="font-mono text-white/50">
          Create your account to save your commitment
        </p>
      </div>

      {/* Auth Buttons */}
      <div className="space-y-4">
        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading !== null}
          className={`w-full p-4 border-2 border-white/10 bg-white/5 
                     hover:border-white/30 hover:bg-white/10 
                     transition-all duration-200 
                     flex items-center justify-center gap-3
                     disabled:opacity-50 disabled:cursor-not-allowed
                     group`}
        >
          {isLoading === 'google' ? (
            <div className="w-6 h-6 border-2 border-t-[#F97316] border-white/20 rounded-full animate-spin" />
          ) : (
            <>
              {/* Google Icon */}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  className="text-[#4285F4] group-hover:text-[#F97316]"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  className="text-[#34A853] group-hover:text-[#F97316]"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  className="text-[#FBBC05] group-hover:text-[#F97316]"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  className="text-[#EA4335] group-hover:text-[#F97316]"
                />
              </svg>
              <span className="font-mono font-bold text-white group-hover:text-[#F97316] transition-colors">
                Continue with Google
              </span>
            </>
          )}
        </button>

        {/* Apple Sign In */}
        <button
          onClick={handleAppleSignIn}
          disabled={isLoading !== null}
          className={`w-full p-4 border-2 border-white/10 bg-white/5 
                     hover:border-white/30 hover:bg-white/10 
                     transition-all duration-200 
                     flex items-center justify-center gap-3
                     disabled:opacity-50 disabled:cursor-not-allowed
                     group`}
        >
          {isLoading === 'apple' ? (
            <div className="w-6 h-6 border-2 border-t-[#F97316] border-white/20 rounded-full animate-spin" />
          ) : (
            <>
              {/* Apple Icon */}
              <svg className="w-6 h-6 text-white group-hover:text-[#F97316] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="font-mono font-bold text-white group-hover:text-[#F97316] transition-colors">
                Continue with Apple
              </span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-xs text-white/40 uppercase tracking-wide font-mono">or for testing</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Email/Password Form - FOR TESTING */}
        <form onSubmit={handleEmailPasswordSignIn} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading !== null}
            className="w-full p-4 border-2 border-white/10 bg-white/5 text-white font-mono placeholder:text-white/40 focus:outline-none focus:border-[#F97316] transition-colors disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading !== null}
            className="w-full p-4 border-2 border-white/10 bg-white/5 text-white font-mono placeholder:text-white/40 focus:outline-none focus:border-[#F97316] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading !== null}
            className="w-full p-4 bg-[#F97316] text-black font-mono font-bold hover:bg-[#FB923C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'email' ? (
              <div className="w-6 h-6 border-2 border-t-black border-black/20 rounded-full animate-spin mx-auto" />
            ) : (
              'Sign in with Email'
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 border-2 border-red-500">
          <p className="font-mono text-sm text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Privacy Note */}
      <p className="text-center text-xs text-white/30 mt-8 font-mono">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>

      {/* Secure Badge */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <svg 
          className="w-4 h-4 text-white/30" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-xs text-white/30 font-mono">Secured by Supabase</span>
      </div>
    </div>
  );
};
