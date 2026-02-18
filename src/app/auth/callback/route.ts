import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Auto-provision Profile for new users
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await prisma.profile.upsert({
            where: { id: user.id },
            update: {},
            create: {
              id: user.id,
              email: user.email!,
              displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
            },
          })
        }
      } catch (e) {
        // Don't block login if Profile creation fails — log and continue
        console.error('Profile auto-provision failed:', e)
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return to login on error
  return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
}
