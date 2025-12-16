'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LegalFooter } from '@/components/shared/LegalFooter';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';
import { Loader2, ArrowRight } from 'lucide-react';
import { WitnessLogo } from '@/components/ui/WitnessLogo';
import { analytics } from '@/services/analytics';

function LoginContent() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signInWithGoogle, signInWithPassword, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDev = process.env.NODE_ENV === 'development';
    
    const nextUrl = useMemo(() => {
        const next = searchParams.get('next');
        if (next && next.startsWith('/')) {
            return next;
        }
        return '/dashboard';
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace(nextUrl);
        }
    }, [authLoading, isAuthenticated, router, nextUrl]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        
        // Track login started
        analytics.authLoginStarted('google');
        
        try {
            const result = await signInWithGoogle(nextUrl);
            
            if (result.error) {
                setError(`Google error: ${result.error.message}`);
                setLoading(false);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Unexpected error: ${errorMessage}`);
            setLoading(false);
        }
    };

    const handleEmailPasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDev) {
            setError('Email/password login is disabled.');
            return;
        }
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }
        setLoading(true);
        setError('');
        
        // Track login started
        analytics.authLoginStarted('email');
        
        try {
            const result = await signInWithPassword(email, password);
            if (result.error) {
                setError(result.error.message);
                setLoading(false);
            } else {
                // Track successful login
                analytics.authLoginCompleted('email');
                router.replace(nextUrl);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(`Unexpected error: ${errorMessage}`);
            setLoading(false);
        }
    };

    if (authLoading || isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0A0A0A] relative">
            <GrainOverlay />
            
            {/* Navigation */}
            <nav className="border-b border-white/10 relative z-10">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <WitnessLogo size="sm" showWordmark />
                    </Link>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center px-6 relative z-10">
                <div className="w-full max-w-md">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#F97316]">
                            Welcome back
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-white">
                            SIGN IN
                        </h1>
                        <p className="text-white/50">
                            Continue your transformation journey
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Auth Buttons */}
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white text-black py-5 font-bold uppercase tracking-wide flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {loading ? 'Signing in...' : 'Continue with Google'}
                        </button>

                        {isDev && (
                            <>
                                {/* Divider */}
                                <div className="flex items-center gap-4 my-6">
                                    <div className="flex-1 h-px bg-white/10"></div>
                                    <span className="text-xs text-white/40 uppercase tracking-wide">or for testing</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>

                                {/* Email/Password Form - FOR TESTING */}
                                <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                        className="w-full bg-white/5 border border-white/20 text-white py-4 px-4 placeholder:text-white/40 focus:outline-none focus:border-[#F97316] transition-colors disabled:opacity-50"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        className="w-full bg-white/5 border border-white/20 text-white py-4 px-4 placeholder:text-white/40 focus:outline-none focus:border-[#F97316] transition-colors disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#F97316] text-black py-5 font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Signing in...' : 'Sign in with Email'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-10 pt-8 border-t border-white/10 text-center">
                        <p className="text-white/50 mb-4">New here?</p>
                        <Link 
                            href="/onboarding" 
                            className="inline-flex items-center gap-2 text-[#F97316] font-bold uppercase tracking-wide hover:text-[#FB923C] transition-colors"
                        >
                            Start your journey
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    {/* Legal */}
                    <p className="text-xs text-center text-white/40 mt-8">
                        By signing in, you agree to our{' '}
                        <Link href="/legal/terms" className="underline hover:text-white/60">Terms</Link>
                        {' '}and{' '}
                        <Link href="/legal/privacy" className="underline hover:text-white/60">Privacy Policy</Link>
                    </p>
                </div>
            </div>
            <LegalFooter />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
