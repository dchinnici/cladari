import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Retrieve specific location
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        plants: {
          select: {
            id: true,
            plantId: true,
            breederCode: true
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

// PATCH: Update location
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    const updatedLocation = await prisma.location.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE: Remove location (only if no plants assigned)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    // Check if any plants are assigned to this location
    const plantCount = await prisma.plant.count({
      where: { locationId: params.id }
    })

    if (plantCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location with ${plantCount} plant(s) assigned. Please reassign plants first.` },
        { status: 400 }
      )
    }

    await prisma.location.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
