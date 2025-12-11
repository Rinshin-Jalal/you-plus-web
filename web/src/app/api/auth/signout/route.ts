import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export async function POST() {
    if (isDev) console.log('[SIGNOUT API] Starting sign out process')
    
    const supabase = await createClient()

    // Sign out from Supabase (this will clear the server-side session cookies)
    const { error } = await supabase.auth.signOut()
    
    if (error) {
        console.error('[SIGNOUT API] Supabase signOut error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (isDev) console.log('[SIGNOUT API] Supabase signOut successful')
    return NextResponse.json({ success: true })
}
