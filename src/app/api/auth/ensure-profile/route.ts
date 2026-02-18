import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/auth/ensure-profile
 * Creates a Profile record for the authenticated user if one doesn't exist.
 * Called after email/password login (OAuth users get this via the auth callback).
 */
export async function POST() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
      },
    })

    return NextResponse.json({ profile: { id: profile.id, email: profile.email } })
  } catch (e) {
    console.error('Profile ensure failed:', e)
    return NextResponse.json({ error: 'Failed to ensure profile' }, { status: 500 })
  }
}
