import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/proxy'

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for well-known paths and static assets
    if (pathname.startsWith('/.well-known')) {
        return NextResponse.next()
    }

    const publicRoutes = [
        '/',
        '/auth/login',
        '/auth/signup',
        '/auth/callback',
        '/auth/finalize',
        '/auth/auth-code-error',
        '/api/auth/signout',
        '/legal',
        '/witness',
        '/pitch',
    ]

    // Routes that should stay open to unauthenticated users
    // (onboarding, post-payment handoff, setup)
    // NOTE: /checkout removed - handled specially below
    const authOptionalRoutes = [
        '/onboarding',
        '/billing/success',
        '/setup',
    ]

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return pathname === '/';
        }
        return pathname === route || pathname.startsWith(route + '/');
    });

    // Check if route allows guests (no auth required)
    const isAuthOptionalRoute = authOptionalRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/'),
    );

    const isBillingSuccessRoute = pathname.startsWith('/billing/success')

    // ALWAYS refresh session (proxy runs on all routes per Supabase docs)
    const { supabaseResponse, claims, accessToken } = await updateSession(request)
    const user = claims?.sub ? claims : null

    // Allow public or guest-friendly routes without forcing auth
    if (isPublicRoute || isAuthOptionalRoute) {
        return supabaseResponse
    }

    // Special handling for /checkout - accessible to all authenticated users
    // but subscribed users get redirected away
    // EXCEPTION: /checkout/welcome requires authentication
    const isCheckoutRoute = pathname.startsWith('/checkout')
    const isCheckoutWelcomeRoute = pathname.startsWith('/checkout/welcome')

    // Redirect to login if not authenticated (except checkout can be viewed)
    if (!user) {
        // /checkout/welcome requires auth - redirect to login
        if (isCheckoutWelcomeRoute) {
            console.log(`[MIDDLEWARE] ${pathname} - checkout/welcome requires auth, redirecting to /auth/login`)
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('next', pathname)
            return NextResponse.redirect(loginUrl)
        }
        // Allow unauthenticated users to VIEW regular checkout (see plans)
        if (isCheckoutRoute) {
            return supabaseResponse
        }
        console.log(`[MIDDLEWARE] ${pathname} - Not authenticated, redirecting to /auth/login`)
        const loginUrl = new URL('/auth/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    console.log(`[MIDDLEWARE] ${pathname} - User authenticated: ${claims?.email}`)

    // For /checkout: allow subscribed users to access for plan management
    // The page itself will show appropriate UI for current plan
    if (isCheckoutRoute) {
        console.log(`[MIDDLEWARE] /checkout - Allowing access for plan management`)
        return supabaseResponse
    }

    // Allow authenticated access to billing-success even if onboarding incomplete
    if (isBillingSuccessRoute) {
        return supabaseResponse
    }

    // For protected routes, check subscription via backend API (which calls DodoPayments directly)
    // For protected routes, check subscription AND onboarding via backend API
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

        if (!accessToken) {
            console.log(`[MIDDLEWARE] ${pathname} - No access token, redirecting to login`)
            const loginUrl = new URL('/auth/login', request.url)
            return NextResponse.redirect(loginUrl)
        }

        // Call our backend API which checks DodoPayments directly AND returns onboarding status
        const subResponse = await fetch(`${backendUrl}/api/billing/subscription`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })

        if (!subResponse.ok) {
            console.error(`[MIDDLEWARE] ${pathname} - Failed to check status: ${subResponse.status}`)
            // On error, allow through (fail open) - page will handle redirect
            return supabaseResponse
        }

        const { subscription, onboardingCompleted } = await subResponse.json()
        const hasActiveSubscription = subscription?.hasActiveSubscription

        // ═══════════════════════════════════════════════════════════════════════════
        // 4-STATE USER FLOW LOGIC
        // ═══════════════════════════════════════════════════════════════════════════

        // State 1: Fully Complete (Subscribed + Onboarded)
        // -> Goal: Dashboard
        if (onboardingCompleted && hasActiveSubscription) {
            // Block access to onboarding and checkout welcome (already done)
            if (pathname.startsWith('/onboarding') || pathname.startsWith('/checkout/welcome')) {
                console.log(`[MIDDLEWARE] ${pathname} - Fully complete, redirecting to /dashboard`)
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
            // Allow /checkout for subscription management, allow /dashboard, etc.
            return supabaseResponse
        }

        // State 2: Subscribed Only (Missing Onboarding)
        // -> Goal: Onboarding / Setup
        if (!onboardingCompleted && hasActiveSubscription) {
            // Must go to setup (handles post-payment data push + phone capture)
            if (!pathname.startsWith('/setup')) {
                console.log(`[MIDDLEWARE] ${pathname} - Subscribed but not onboarded, redirecting to /setup`)
                return NextResponse.redirect(new URL('/setup', request.url))
            }
            // Allow setup flow
            return supabaseResponse
        }

        // State 3: Onboarded Only (Missing Subscription)
        // -> Goal: Checkout
        if (onboardingCompleted && !hasActiveSubscription) {
            // Must go to checkout
            if (!pathname.startsWith('/checkout')) {
                console.log(`[MIDDLEWARE] ${pathname} - Onboarded but not subscribed, redirecting to /checkout`)
                return NextResponse.redirect(new URL('/checkout', request.url))
            }
            // Allow /checkout
            return supabaseResponse
        }

        // State 4: Nothing Complete (Missing Both)
        // -> Goal: Flexible (Onboarding OR Checkout)
        if (!onboardingCompleted && !hasActiveSubscription) {
            // Allow access to both flows
            if (pathname.startsWith('/onboarding') || pathname.startsWith('/setup') || pathname.startsWith('/checkout')) {
                return supabaseResponse
            }
            // Default entry point: Onboarding
            console.log(`[MIDDLEWARE] ${pathname} - Nothing complete, redirecting to /onboarding`)
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        return supabaseResponse

    } catch (error) {
        console.error(`[MIDDLEWARE] ${pathname} - Status check error:`, error)
        // Fail open - let the page handle it
        return supabaseResponse
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
