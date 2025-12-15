import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

const isDev = process.env.NODE_ENV === 'development'

export async function middleware(request: NextRequest) {
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
    ]

    // Routes that should stay open to unauthenticated users
    // (onboarding, post-payment handoff, setup)
    const authOptionalRoutes = [
        '/onboarding',
        '/billing/success',
        '/setup',
        '/checkout',
    ]

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return pathname === '/'
        }
        return pathname === route || pathname.startsWith(route + '/')
    })

    // Check if route allows guests (no auth required)
    const isAuthOptionalRoute = authOptionalRoutes.some(route =>
        pathname === route || pathname.startsWith(route + '/'),
    )

    // ALWAYS refresh session (middleware runs on all routes per Supabase docs)
    const { supabaseResponse, claims } = await updateSession(request)
    const user = claims?.sub ? claims : null

    // Allow public or guest-friendly routes without forcing auth
    if (isPublicRoute || isAuthOptionalRoute) {
        return supabaseResponse
    }

    // Special handling for /checkout/welcome - requires authentication
    const isCheckoutWelcomeRoute = pathname.startsWith('/checkout/welcome')

    // Redirect to login if not authenticated
    if (!user) {
        if (isCheckoutWelcomeRoute) {
            if (isDev) console.log(`[MIDDLEWARE] ${pathname} - checkout/welcome requires auth, redirecting to /auth/login`)
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('next', pathname)
            return NextResponse.redirect(loginUrl)
        }

        if (isDev) console.log(`[MIDDLEWARE] ${pathname} - Not authenticated, redirecting to /auth/login`)
        const loginUrl = new URL('/auth/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    if (isDev) console.log(`[MIDDLEWARE] ${pathname} - User authenticated: ${claims?.email}`)

    // For all authenticated routes, allow through - subscription/onboarding checks
    // are handled at the page level via server components
    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
