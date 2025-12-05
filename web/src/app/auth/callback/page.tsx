'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Completing sign-in...');
  const [error, setError] = useState<string | null>(null);

  const codeVerifierKey = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl?.match(/https?:\/\/([^.]*)/)?.[1];
    return projectRef ? `sb-${projectRef}-auth-code-verifier` : null;
  }, []);

  useEffect(() => {
    const next = searchParams.get('next') || '/dashboard';

    const run = async () => {
      const url = window.location.href;
      const code = searchParams.get('code');
      if (codeVerifierKey) {
        const storedVerifier = window.localStorage.getItem(codeVerifierKey);
        console.debug('[CALLBACK] PKCE verifier presence:', {
          key: codeVerifierKey,
          exists: !!storedVerifier,
          length: storedVerifier?.length ?? 0,
        });
      } else {
        console.debug('[CALLBACK] PKCE verifier key unavailable; check NEXT_PUBLIC_SUPABASE_URL');
      }

      if (!code) {
        setError('Missing authorization code');
        console.warn('[CALLBACK] Missing authorization code in query string');
        router.replace('/auth/auth-code-error');
        return;
      }

      console.debug('[CALLBACK] Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (error) {
        console.error('[CALLBACK] Exchange error:', error.message);
        setError('Sign-in failed. Try again.');
        router.replace('/auth/auth-code-error');
        return;
      }

      setMessage('Signed in. Redirecting...');
      router.replace(next);
    };

    run();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="text-center space-y-3">
        <div className="text-xl font-semibold">{message}</div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}

