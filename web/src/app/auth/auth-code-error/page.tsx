'use client';

import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-6">
      <div className="max-w-md space-y-4 text-center">
        <div className="text-2xl font-semibold">We couldn&apos;t complete sign-in</div>
        <p className="text-sm text-gray-700">
          The authorization code exchange failed. This is usually caused by a missing PKCE code verifier in local storage.
        </p>
        <div className="text-left text-sm bg-gray-100 text-gray-800 rounded-md p-4 space-y-2">
          <div className="font-semibold">Try this:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open DevTools console on the callback tab and copy any lines starting with <code>[CALLBACK]</code>.</li>
            <li>Ensure you started the login from the same origin (e.g. http://localhost:3000) and that cookies/localStorage are allowed.</li>
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

