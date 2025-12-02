import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Debug: Log incoming cookies
  const incomingCookies = request.cookies.getAll()
  console.log('[PROXY] Incoming cookies:', incomingCookies.map(c => c.name))
  
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
          console.log('[PROXY] setAll called with:', cookiesToSet.map(c => c.name))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const { data, error } = await supabase.auth.getClaims()
  
  if (error) {
    console.log('[PROXY] Error getting claims:', error.message)
  }
  
  console.log('[PROXY] Claims result:', data?.claims ? 'has claims' : 'no claims')
  
  const claims = data?.claims ?? null

  return { supabaseResponse, claims }
}
