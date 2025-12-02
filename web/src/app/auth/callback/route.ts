import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback - Handles OAuth redirects
 * 
 * Flow for EXISTING users (from /auth/login):
 * - Has subscription → Dashboard
 * - No subscription → Onboarding
 * 
 * Flow for NEW users (from /billing/success):
 * - Bypass checks, go directly to /billing/success (it handles everything)
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    console.log('[CALLBACK] Received request')
    console.log('[CALLBACK] Code present:', !!code)
    console.log('[CALLBACK] Next param:', next)

    // Routes that bypass all checks (they handle their own logic)
    const bypassRoutes = ['/billing/success']
    const shouldBypass = bypassRoutes.some(route => next.startsWith(route))

    if (!code) {
        console.log('[CALLBACK] No code provided')
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    // Create response - we'll set cookies on this
    let response = NextResponse.redirect(`${origin}${next}`)
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, {
                            ...options,
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                        })
                    })
                },
            },
        }
    )
    
    // Exchange code for session
    console.log('[CALLBACK] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
        console.error('[CALLBACK] Exchange error:', error.message)
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }
    
    console.log('[CALLBACK] Session exchanged for:', data.user?.email)
    
    // Bypass routes handle their own logic
    if (shouldBypass) {
        console.log('[CALLBACK] Bypassing checks, redirecting to:', next)
        return response
    }
    
    // For other routes, check user status
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        console.log('[CALLBACK] No user found after exchange')
        return NextResponse.redirect(`${origin}/auth/login`)
    }

    // Get user data
    const { data: userData } = await supabase
        .from('users')
        .select('id, onboarding_completed')
        .eq('id', user.id)
        .single()

    // Get subscription data - check for ANY subscription history
    const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, cancelled_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Check if user has active subscription
    const activeSubscription = subscriptions?.find(s => 
        s.status === 'active' && 
        (!s.current_period_end || new Date(s.current_period_end) > new Date())
    )
    const hasActiveSubscription = !!activeSubscription

    // Check if user HAD a subscription before (returning user)
    const hadPreviousSubscription = subscriptions && subscriptions.length > 0
    const isReturningUser = hadPreviousSubscription && !hasActiveSubscription

    console.log('[CALLBACK] User status:', { 
        onboardingCompleted: userData?.onboarding_completed, 
        hasSubscription: hasActiveSubscription,
        isReturningUser,
        totalSubscriptions: subscriptions?.length || 0
    })

    // Helper to create redirect with cookies
    const createRedirect = (path: string) => {
        const newResponse = NextResponse.redirect(`${origin}${path}`)
        response.cookies.getAll().forEach(cookie => {
            newResponse.cookies.set(cookie.name, cookie.value, {
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
            })
        })
        return newResponse
    }

    // Decision tree for existing users:
    // 1. Has subscription + onboarding done → Dashboard
    // 2. Has subscription + no onboarding → Onboarding (weird edge case)
    // 3. No subscription but HAD subscription before → Returning user onboarding (short)
    // 4. No subscription ever → Onboarding (full sales pitch → checkout)
    
    if (hasActiveSubscription && userData?.onboarding_completed) {
        console.log('[CALLBACK] Active user, going to dashboard')
        return createRedirect('/dashboard')
    }
    
    if (hasActiveSubscription && !userData?.onboarding_completed) {
        console.log('[CALLBACK] Has subscription but no onboarding, going to onboarding')
        return createRedirect('/onboarding')
    }

    // Returning user - had subscription before, needs short re-onboarding
    if (isReturningUser) {
        console.log('[CALLBACK] Returning user detected, going to personalized onboarding')
        return createRedirect('/onboarding/returning')
    }
    
    // No subscription ever - send to full onboarding (sales pitch → checkout)
    console.log('[CALLBACK] New user, no subscription, going to onboarding')
    return createRedirect('/onboarding')
}
