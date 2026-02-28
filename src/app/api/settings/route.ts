import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

/** GET /api/settings — Return current user's profile settings */
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        displayName: true,
        email: true,
        timezone: true,
        latitude: true,
        longitude: true,
        city: true,
        tier: true,
        maxPlants: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

/** PATCH /api/settings — Update current user's profile settings */
export async function PATCH(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Only allow updating these fields
    const allowedFields = ['displayName', 'timezone', 'latitude', 'longitude', 'city'] as const
    const data: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        data[field] = body[field]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Validate coordinates if provided
    if (data.latitude !== undefined && data.latitude !== null) {
      const lat = Number(data.latitude)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
      }
      data.latitude = lat
    }
    if (data.longitude !== undefined && data.longitude !== null) {
      const lon = Number(data.longitude)
      if (isNaN(lon) || lon < -180 || lon > 180) {
        return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
      }
      data.longitude = lon
    }

    const updated = await prisma.profile.update({
      where: { id: user.id },
      data,
      select: {
        displayName: true,
        email: true,
        timezone: true,
        latitude: true,
        longitude: true,
        city: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
