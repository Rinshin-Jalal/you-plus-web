import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  // In production behind a proxy (e.g. OpenNext/Cloudflare), request.url can be an internal
  // localhost URL. Prefer forwarded headers to compute the public origin.
  const h = await headers();
  const forwardedProto = (h.get('x-forwarded-proto') ?? '').split(',')[0]?.trim();
  const forwardedHost = (h.get('x-forwarded-host') ?? '').split(',')[0]?.trim();
  const host = forwardedHost || h.get('host');
  const proto = forwardedProto || requestUrl.protocol.replace(':', '');
  const origin = host ? `${proto}://${host}` : requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=missing_code`);
  }

  const cookieStore = await cookies();
  cookieStore.getAll(); // ensure PKCE cookies are loaded before exchange

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`
    );
  }

  const finalizeUrl = `/auth/finalize?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(`${origin}${finalizeUrl}`);
}
