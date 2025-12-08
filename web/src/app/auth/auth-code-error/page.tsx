'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GrainOverlay } from '@/components/onboarding/ui/GrainOverlay';

interface ErrorDetails {
  error?: string;
  origin?: string;
  hasVerifier?: boolean;
  timestamp?: string;
}

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const [details, setDetails] = useState<ErrorDetails | null>(null);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setDetails({ error: urlError });
      return;
    }
    
    try {
      const stored = sessionStorage.getItem('auth_error_details');
      if (stored) {
        setDetails(JSON.parse(stored));
        sessionStorage.removeItem('auth_error_details');
      }
    } catch (e) {
      console.debug('Could not read error details:', e);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white px-6 relative">
      <GrainOverlay />
      <div className="max-w-md space-y-4 text-center relative z-10">
        <div className="text-2xl font-bold">We couldn&apos;t complete sign-in</div>
        <p className="text-sm text-white/70">
          The authorization code exchange failed. This is usually caused by a missing PKCE code verifier in local storage.
        </p>
        
        {details && (
          <div className="text-left text-xs bg-red-500/10 text-red-400 p-3 rounded-md space-y-1 font-mono border border-red-500/30">
            <div className="font-semibold text-sm mb-2 text-red-300">Error Details:</div>
            {details.error && <div>Error: {details.error}</div>}
            {details.origin && <div>Origin: {details.origin}</div>}
            <div>Verifier present: {details.hasVerifier ? 'Yes' : 'No'}</div>
            {details.timestamp && <div>Time: {details.timestamp}</div>}
          </div>
        )}
        
        <div className="text-left text-sm bg-white/5 text-white/80 p-4 rounded-md space-y-2 border border-white/10">
          <div className="font-semibold text-white">Try this:</div>
          <ol className="list-decimal list-inside space-y-1 text-white/60">
            <li>Open DevTools console on the callback tab and copy any lines starting with <code className="text-white/80">[CALLBACK]</code> or <code className="text-white/80">[AUTH]</code>.</li>
            <li>Ensure you started the login from the same origin (e.g. http://localhost:3000) and that cookies/localStorage are allowed.</li>
            <li>Avoid using 127.0.0.1 if you started on localhost (or vice versa).</li>
            <li>Disable any ad-blockers or strict tracking prevention temporarily.</li>
            <li>Reload the page, then retry login.</li>
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/auth/login"
            className="inline-flex justify-center px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wide bg-[#F97316] text-black hover:bg-[#FB923C] transition-colors"
          >
            Back to login
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex justify-center border border-white/20 px-4 py-3 rounded-md text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            Sign up instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded animate-spin" />
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  );
}
