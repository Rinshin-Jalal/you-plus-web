import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const origin = requestUrl.origin;

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
