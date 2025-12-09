import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: 'lax', // Safari requires 'lax' for proper cookie handling
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims ?? null
  
  // Also get the session for access token
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token ?? null

  return { supabaseResponse, claims, accessToken }
}
