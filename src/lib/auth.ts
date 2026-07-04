import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}

// In-memory cache for user sessions to prevent connection congestion on concurrent API hits
const authCache = new Map<string, { user: any; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 1000 // 1 minute

export async function verifyUser(req: NextRequest, targetUserId: string | null) {
  if (!targetUserId) {
    return { error: NextResponse.json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } }, { status: 400 }) }
  }

  // Check auth cache first
  const cookieHeader = req.headers.get('cookie') || ''
  const cacheKey = `${targetUserId}_${cookieHeader}`
  const cached = authCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return { user: cached.user }
  }

  // Always verify that the user exists in our local PostgreSQL database and is not deleted/deactivated
  let dbUser = null
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, deletedAt: true, isApproved: true }
    })
    if (!dbUser || dbUser.deletedAt) {
      return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'User not found or deactivated in local database' } }, { status: 401 }) }
    }
    if (dbUser.email !== 'admin@lifeos.com' && !dbUser.isApproved) {
      return { error: NextResponse.json({ error: { code: 'PENDING_APPROVAL', message: 'Your account is pending approval by the administrator.' } }, { status: 403 }) }
    }
  } catch (err) {
    return { error: NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Database session check failed' } }, { status: 500 }) }
  }

  // Detect PostgreSQL-only mode or placeholder setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isPostgresOnly = !supabaseUrl || supabaseUrl.includes('placeholder-lifeos') || supabaseUrl === ''

  if (isPostgresOnly) {
    authCache.set(cacheKey, { user: dbUser, expiresAt: Date.now() + CACHE_TTL_MS })
    return { user: dbUser }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || user.id !== targetUserId) {
      return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' } }, { status: 401 }) }
    }

    authCache.set(cacheKey, { user, expiresAt: Date.now() + CACHE_TTL_MS })
    return { user }
  } catch (err) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Session validation failed' } }, { status: 401 }) }
  }
}
