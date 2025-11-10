import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Retrieve single plant by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const plant = await prisma.plant.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        currentLocation: true,
        careLogs: {
          orderBy: { date: 'desc' }
        },
        measurements: {
          orderBy: { measurementDate: 'desc' }
        },
        traits: {
          orderBy: { observationDate: 'desc' }
        },
        floweringCycles: {
          orderBy: { createdAt: 'desc' }
        },
        photos: {
          orderBy: { dateTaken: 'desc' }
        }
      }
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    return NextResponse.json(plant)
  } catch (error) {
    console.error('Error fetching plant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plant' },
      { status: 500 }
    )
  }
}

// PATCH: Update plant details
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    const updated = await prisma.plant.update({
      where: { id: params.id },
      data: {
        // Only update fields that are provided
        section: body.section !== undefined ? body.section : undefined,
        species: body.species !== undefined ? body.species : undefined,
        hybridName: body.hybridName !== undefined ? body.hybridName : undefined,
        crossNotation: body.crossNotation !== undefined ? body.crossNotation : undefined,
        generation: body.generation !== undefined ? body.generation : undefined,
        breeder: body.breeder !== undefined ? body.breeder : undefined,
        breederCode: body.breederCode !== undefined ? body.breederCode : undefined,
        locationId: body.locationId !== undefined ? body.locationId : undefined,
        healthStatus: body.healthStatus !== undefined ? body.healthStatus : undefined,
        currentPotSize: body.currentPotSize !== undefined ? parseFloat(body.currentPotSize) || null : undefined,
        currentPotType: body.currentPotType !== undefined ? body.currentPotType : undefined,
        lastRepotDate: body.lastRepotDate !== undefined ?
          (body.lastRepotDate ? new Date(body.lastRepotDate + 'T00:00:00.000Z') : null) : undefined,
        marketValue: body.marketValue !== undefined ? parseFloat(body.marketValue) || null : undefined,
        isForSale: body.isForSale !== undefined ? body.isForSale : undefined,
        isMother: body.isMother !== undefined ? body.isMother : undefined,
        isEliteGenetics: body.isEliteGenetics !== undefined ? body.isEliteGenetics : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        tags: body.tags !== undefined ? JSON.stringify(body.tags) : undefined,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating plant:', error)
    return NextResponse.json(
      { error: 'Failed to update plant' },
      { status: 500 }
    )
  }
}

// DELETE: Archive plant (soft delete - preserves all data for ML training)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json().catch(() => ({}))

    // Soft delete: mark as archived instead of actually deleting
    const archived = await prisma.plant.update({
      where: { id: params.id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archiveReason: body.reason || 'deleted'  // died, sold, culled, divided, lost, etc.
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Plant archived successfully',
      archived
    })
  } catch (error) {
    console.error('Error archiving plant:', error)
    return NextResponse.json(
      { error: 'Failed to archive plant' },
      { status: 500 }
    )
  }
}
