'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full border border-white/10 flex items-center justify-center">
              <span className="text-lg font-mono">!</span>
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-white/60 text-sm">
              We hit an unexpected error. Try again, or head back to the start.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => reset()}
                className="py-3 px-4 bg-[#F97316] text-black font-bold uppercase tracking-wide hover:bg-[#FB923C] transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="py-2 px-4 text-white/70 hover:text-white text-sm transition-colors"
              >
                Go home
              </button>
            </div>
            {error?.digest && (
              <p className="text-xs text-white/30 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
