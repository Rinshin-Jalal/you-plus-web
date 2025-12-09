'use client';

import React from 'react';

export interface LoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Loading...' }: LoaderProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0D0D] text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
      <p className="mt-4 text-sm text-white/60 font-mono">{message}</p>
    </div>
  );
}

export function SectionLoader({ message = 'Loading...' }: LoaderProps) {
  return (
    <div className="w-full rounded-md border border-white/10 bg-[#0A0A0A] px-4 py-6 text-center">
      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">{message}</p>
    </div>
  );
}

export function SavingOverlay({ message = 'Saving...' }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 flex flex-col items-center gap-3 rounded-md border border-white/10 bg-[#0D0D0D] px-6 py-5">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
        <p className="text-sm font-mono uppercase tracking-[0.2em] text-white/70">{message}</p>
      </div>
    </div>
  );
}
