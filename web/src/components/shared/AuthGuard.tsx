'use client';

import React, { useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/Loaders';

export interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

function AuthGuardInner({ children, redirectTo = '/auth/login', fallback }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const targetPath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const redirectUrl = useMemo(() => {
    const separator = redirectTo.includes('?') ? '&' : '?';
    return `${redirectTo}${separator}next=${encodeURIComponent(targetPath)}`;
  }, [redirectTo, targetPath]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, loading, redirectUrl, router]);

  if (loading) {
    return fallback || <FullPageLoader message="Checking authentication…" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export function AuthGuard(props: AuthGuardProps) {
  return (
    <Suspense fallback={props.fallback || <FullPageLoader message="Loading…" />}>
      <AuthGuardInner {...props} />
    </Suspense>
  );
}
