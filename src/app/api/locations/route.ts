import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

// GET: Retrieve all locations
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locations = await prisma.location.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { plants: true }
        }
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST: Create new location
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const newLocation = await prisma.location.create({
      data: {
        userId: user.id,
        name: body.name,
        type: body.type,
        zone: body.zone,
        shelf: body.shelf,
        position: body.position,
        lightLevel: body.lightLevel,
        humidity: body.humidity,
        temperature: body.temperature,
        dli: body.dli,
        vpd: body.vpd,
        pressure: body.pressure,
        co2: body.co2,
        growLights: body.growLights,
        photoperiod: body.photoperiod,
        airflow: body.airflow,
        fanSpeed: body.fanSpeed,
        capacity: body.capacity,
        notes: body.notes,
      }
    })

    return NextResponse.json(newLocation)
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
