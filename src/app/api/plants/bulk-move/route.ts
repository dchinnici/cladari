import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

/**
 * POST /api/plants/bulk-move
 *
 * Move multiple plants to a new location in a single transaction.
 *
 * Body: { plantIds: string[], locationId: string | null }
 * - locationId: null removes plants from their current location
 */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plantIds, locationId } = body

    if (!Array.isArray(plantIds) || plantIds.length === 0) {
      return NextResponse.json({ error: 'plantIds array is required' }, { status: 400 })
    }

    if (locationId === undefined) {
      return NextResponse.json({ error: 'locationId is required (use null to unassign)' }, { status: 400 })
    }

    // If assigning to a location, verify the user owns it
    if (locationId !== null) {
      const location = await prisma.location.findFirst({
        where: { id: locationId, userId: user.id },
      })
      if (!location) {
        return NextResponse.json({ error: 'Location not found' }, { status: 404 })
      }
    }

    // Bulk update — only update plants owned by this user
    const result = await prisma.plant.updateMany({
      where: {
        id: { in: plantIds },
        userId: user.id,
      },
      data: {
        locationId: locationId,
      },
    })

    return NextResponse.json({
      success: true,
      moved: result.count,
      locationId,
    })
  } catch (error) {
    console.error('Bulk move error:', error)
    return NextResponse.json(
      { error: 'Failed to move plants' },
      { status: 500 }
    )
  }
}
