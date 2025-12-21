import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH: Update plant's location
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // If locationId is null, we're clearing the location
    // If it's a string, we're setting a new location
    const updatedPlant = await prisma.plant.update({
      where: { id: params.id },
      data: {
        locationId: body.locationId === null ? null : body.locationId
      },
      include: {
        currentLocation: true
      }
    })

    // Update location occupancy counts
    if (body.locationId) {
      // Increment new location occupancy
      await prisma.location.update({
        where: { id: body.locationId },
        data: { currentOccupancy: { increment: 1 } }
      })
    }

    // Decrement old location occupancy if there was one
    if (body.oldLocationId) {
      await prisma.location.update({
        where: { id: body.oldLocationId },
        data: { currentOccupancy: { decrement: 1 } }
      })
    }

    return NextResponse.json(updatedPlant)
  } catch (error) {
    console.error('Error updating plant location:', error)
    return NextResponse.json(
      { error: 'Failed to update plant location' },
      { status: 500 }
    )
  }
}
