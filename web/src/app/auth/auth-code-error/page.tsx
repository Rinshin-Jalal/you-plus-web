'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
    // First check URL params (from route handler)
    const urlError = searchParams.get('error');
    if (urlError) {
      setDetails({ error: urlError });
      return;
    }
    
    // Fallback to sessionStorage (from old client-side handler)
    try {
      const stored = sessionStorage.getItem('auth_error_details');
      if (stored) {
        setDetails(JSON.parse(stored));
        // Clear after reading
        sessionStorage.removeItem('auth_error_details');
      }
    } catch (e) {
      console.debug('Could not read error details:', e);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-6">
      <div className="max-w-md space-y-4 text-center">
        <div className="text-2xl font-semibold">We couldn&apos;t complete sign-in</div>
        <p className="text-sm text-gray-700">
          The authorization code exchange failed. This is usually caused by a missing PKCE code verifier in local storage.
        </p>
        
        {details && (
          <div className="text-left text-xs bg-red-50 text-red-800 rounded-md p-3 space-y-1 font-mono">
            <div className="font-semibold text-sm mb-2">Error Details:</div>
            {details.error && <div>Error: {details.error}</div>}
            {details.origin && <div>Origin: {details.origin}</div>}
            <div>Verifier present: {details.hasVerifier ? 'Yes' : 'No'}</div>
            {details.timestamp && <div>Time: {details.timestamp}</div>}
          </div>
        )}
        
        <div className="text-left text-sm bg-gray-100 text-gray-800 rounded-md p-4 space-y-2">
          <div className="font-semibold">Try this:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open DevTools console on the callback tab and copy any lines starting with <code>[CALLBACK]</code> or <code>[AUTH]</code>.</li>
            <li>Ensure you started the login from the same origin (e.g. http://localhost:3000) and that cookies/localStorage are allowed.</li>
            <li>Avoid using 127.0.0.1 if you started on localhost (or vice versa).</li>
            <li>Disable any ad-blockers or strict tracking prevention temporarily.</li>
            <li>Reload the page, then retry login.</li>
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/auth/login"
            className="inline-flex justify-center rounded-md bg-black px-4 py-2 text-white text-sm font-medium hover:bg-gray-900"
          >
            Back to login
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
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
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    }>
      <AuthCodeErrorContent />
    </Suspense>
  );
}

