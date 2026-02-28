import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAdmin, createSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * DELETE /api/admin/users/[id]?mode=purge|revoke|delete-data
 *
 * Modes:
 *   purge       — Delete Supabase auth user AND Postgres Profile + all data (full removal)
 *   revoke      — Delete Supabase auth user only (keeps Postgres data for training/audit)
 *   delete-data — Delete Postgres Profile + all data only (keeps Supabase auth login)
 *
 * Cascade behavior (from schema): Deleting a Profile cascades to all owned entities
 * (plants, locations, vendors, breeding records, clone batches, and their children).
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'purge'

  if (!['purge', 'revoke', 'delete-data'].includes(mode)) {
    return NextResponse.json(
      { error: 'Invalid mode. Use: purge, revoke, or delete-data' },
      { status: 400 }
    )
  }

  const results: Record<string, string> = { mode, userId: id }

  try {
    // Look up the profile (may not exist if only Supabase auth remains)
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: { email: true, displayName: true },
    })

    // --- Supabase Auth deletion ---
    if (mode === 'purge' || mode === 'revoke') {
      const supabase = createSupabaseAdminClient()
      const { error } = await supabase.auth.admin.deleteUser(id)
      if (error) {
        // User may already be deleted from Supabase — that's OK
        if (error.message?.includes('not found')) {
          results.supabase = 'already deleted'
        } else {
          return NextResponse.json(
            { error: `Supabase deletion failed: ${error.message}` },
            { status: 500 }
          )
        }
      } else {
        results.supabase = 'deleted'
      }
    }

    // --- Postgres Profile + cascaded data deletion ---
    if (mode === 'purge' || mode === 'delete-data') {
      if (profile) {
        // Prisma cascade handles: Plants (→ care logs, photos, journals, etc.),
        // Locations, Vendors, BreedingRecords, CloneBatches
        await prisma.profile.delete({ where: { id } })
        results.postgres = 'deleted'
        results.email = profile.email
        results.displayName = profile.displayName || ''
      } else {
        results.postgres = 'no profile found'
      }
    }

    if (mode === 'revoke') {
      results.postgres = 'preserved (revoke mode)'
      if (profile) {
        results.email = profile.email
        results.displayName = profile.displayName || ''
      }
    }

    console.log(`Admin user deletion:`, results)
    return NextResponse.json({ success: true, ...results })
  } catch (error: any) {
    console.error('Admin user deletion failed:', error)
    return NextResponse.json(
      { error: `Deletion failed: ${error.message}` },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/users/[id]
 *
 * Returns detailed user info for admin inspection.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params

  const profile = await prisma.profile.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      tier: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          plants: true,
          locations: true,
          vendors: true,
          breedingRecords: true,
          cloneBatches: true,
        },
      },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check Supabase auth status
  const supabase = createSupabaseAdminClient()
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id)

  return NextResponse.json({
    ...profile,
    auth: authError ? { status: 'not found in supabase' } : {
      status: 'active',
      provider: authUser?.user?.app_metadata?.provider || 'unknown',
      lastSignIn: authUser?.user?.last_sign_in_at,
      createdAt: authUser?.user?.created_at,
    },
  })
}
