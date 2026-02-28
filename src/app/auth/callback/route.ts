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

    if (error) {
      console.error('Auth callback code exchange failed:', {
        error: error.message,
        code: error.status,
        next,
      })
    }

    if (!error) {
      // Auto-provision Profile for new users
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          try {
            await prisma.profile.upsert({
              where: { id: user.id },
              update: { email: user.email! },
              create: {
                id: user.id,
                email: user.email!,
                displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
              },
            })
          } catch (upsertError: any) {
            // P2002 = unique constraint violation (likely email exists under different ID)
            if (upsertError?.code === 'P2002') {
              // Find existing profile with this email and update its ID to the current auth user
              const existing = await prisma.profile.findUnique({
                where: { email: user.email! },
              })
              if (existing && existing.id !== user.id) {
                // Transfer profile ownership to the new auth ID
                // This handles: email/password user → Google OAuth sign-in (different Supabase UUID)
                await prisma.$executeRawUnsafe(
                  `UPDATE "Profile" SET id = $1, email = $2 WHERE id = $3`,
                  user.id,
                  user.email!,
                  existing.id,
                )
                // Update all FK references from old ID to new ID
                const tables = ['Plant', 'Location', 'Vendor', 'BreedingRecord', 'CloneBatch']
                for (const table of tables) {
                  await prisma.$executeRawUnsafe(
                    `UPDATE "${table}" SET "userId" = $1 WHERE "userId" = $2`,
                    user.id,
                    existing.id,
                  )
                }
                console.log(`Profile migrated: ${existing.id} → ${user.id} (${user.email})`)
              }
            } else {
              throw upsertError
            }
          }
        }
      } catch (e) {
        // Don't block login if Profile creation fails — log and continue
        console.error('Profile auto-provision failed:', e)
      }

      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Return to login on error
  const errorMsg = code ? 'code_exchange_failed' : 'no_code'
  return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, request.url))
}
