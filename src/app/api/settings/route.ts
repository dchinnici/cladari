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
        baselineEC: true,
        baselinePH: true,
        baselineNotes: true,
        substrateMixes: true,
        ipmProducts: true,
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
    const allowedFields = ['displayName', 'timezone', 'latitude', 'longitude', 'city', 'baselineEC', 'baselinePH', 'baselineNotes', 'substrateMixes', 'ipmProducts'] as const
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

    // Validate baseline feed values if provided
    if (data.baselineEC !== undefined && data.baselineEC !== null) {
      const ec = Number(data.baselineEC)
      if (isNaN(ec) || ec < 0 || ec > 10) {
        return NextResponse.json({ error: 'Invalid baseline EC (must be 0-10)' }, { status: 400 })
      }
      data.baselineEC = ec
    }
    if (data.baselinePH !== undefined && data.baselinePH !== null) {
      const ph = Number(data.baselinePH)
      if (isNaN(ph) || ph < 0 || ph > 14) {
        return NextResponse.json({ error: 'Invalid baseline pH (must be 0-14)' }, { status: 400 })
      }
      data.baselinePH = ph
    }
    if (data.baselineNotes !== undefined && data.baselineNotes !== null) {
      if (typeof data.baselineNotes !== 'string' || data.baselineNotes.length > 200) {
        return NextResponse.json({ error: 'Baseline notes must be a string under 200 characters' }, { status: 400 })
      }
    }

    // Validate substrate mixes if provided
    if (data.substrateMixes !== undefined && data.substrateMixes !== null) {
      if (!Array.isArray(data.substrateMixes) || data.substrateMixes.length > 50) {
        return NextResponse.json({ error: 'Substrate mixes must be an array (max 50)' }, { status: 400 })
      }
      for (const mix of data.substrateMixes) {
        if (!mix.id || !mix.name || typeof mix.name !== 'string') {
          return NextResponse.json({ error: 'Each substrate mix must have an id and name' }, { status: 400 })
        }
      }
    }

    // Validate IPM products if provided
    if (data.ipmProducts !== undefined && data.ipmProducts !== null) {
      if (!Array.isArray(data.ipmProducts) || data.ipmProducts.length > 50) {
        return NextResponse.json({ error: 'IPM products must be an array (max 50)' }, { status: 400 })
      }
      for (const product of data.ipmProducts) {
        if (!product.id || !product.name || typeof product.name !== 'string') {
          return NextResponse.json({ error: 'Each IPM product must have an id and name' }, { status: 400 })
        }
      }
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
        baselineEC: true,
        baselinePH: true,
        baselineNotes: true,
        substrateMixes: true,
        ipmProducts: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
