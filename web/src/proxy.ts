import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl
    
    // Debug: log full URL for callback
    if (pathname === '/auth/callback') {
        console.log('[PROXY] /auth/callback hit')
        console.log('[PROXY] Full URL:', request.url)
        console.log('[PROXY] Search params:', search)
        console.log('[PROXY] Code param:', request.nextUrl.searchParams.get('code'))
    }

    // Public routes that don't require auth or onboarding
    const publicRoutes = [
        '/',
        '/auth/login',
        '/auth/signup',
        '/auth/callback',
        '/api/auth/signout',
        '/checkout',
    ]

    // Routes that require auth but not onboarding/subscription
    const authOnlyRoutes = [
        '/onboarding',
        '/billing/success',
    ]

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return pathname === '/';
        }
        return pathname === route || pathname.startsWith(route + '/');
    });

    // ALWAYS refresh session (proxy runs on all routes per Supabase docs)
    const { supabaseResponse, claims } = await updateSession(request)
    const user = claims?.sub ? claims : null

    // Allow public routes even without auth
    if (isPublicRoute) {
        return supabaseResponse
    }

    // Redirect to login if not authenticated
    if (!user) {
        console.log(`[MIDDLEWARE] ${pathname} - Not authenticated, redirecting to /auth/login`)
        const loginUrl = new URL('/auth/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    console.log(`[MIDDLEWARE] ${pathname} - User authenticated: ${claims?.email}`)

    // For auth-only routes (onboarding, checkout), allow access
    const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route))
    if (isAuthOnlyRoute) {
        return supabaseResponse
    }

    // For all other routes, check onboarding and subscription status
    // We need to create a server client here for database queries
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()

    const { data: userData } = await supabase
        .from('users')
        .select('id, onboarding_completed')
        .eq('id', user.sub)
        .single()

    // If user doesn't exist in DB, redirect to onboarding
    if (!userData) {
        console.log(`[MIDDLEWARE] ${pathname} - User not in DB, redirecting to /onboarding`)
        const onboardingUrl = new URL('/onboarding', request.url)
        return NextResponse.redirect(onboardingUrl)
    }

    // If onboarding not completed, redirect to onboarding
    if (!userData.onboarding_completed) {
        console.log(`[MIDDLEWARE] ${pathname} - Onboarding not completed, redirecting`)
        const onboardingUrl = new URL('/onboarding', request.url)
        return NextResponse.redirect(onboardingUrl)
    }

    // Check subscription status
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.sub)
        .single()

    const hasActiveSubscription =
        subscription &&
        subscription.status === 'active' &&
        (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())

    // If no active subscription, redirect to checkout
    if (!hasActiveSubscription) {
        console.log(`[MIDDLEWARE] ${pathname} - No active subscription, redirecting to /checkout`)
        const checkoutUrl = new URL('/checkout', request.url)
        return NextResponse.redirect(checkoutUrl)
    }

    console.log(`[MIDDLEWARE] ${pathname} - Access granted`)
    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
