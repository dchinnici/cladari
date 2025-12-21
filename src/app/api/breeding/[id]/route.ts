import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/breeding/[id] - Get single breeding record with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const record = await prisma.breedingRecord.findUnique({
      where: { id },
      include: {
        femalePlant: {
          select: {
            id: true,
            plantId: true,
            hybridName: true,
            species: true,
            section: true,
            photos: { take: 1, orderBy: { dateTaken: 'desc' } }
          }
        },
        malePlant: {
          select: {
            id: true,
            plantId: true,
            hybridName: true,
            species: true,
            section: true,
            photos: { take: 1, orderBy: { dateTaken: 'desc' } }
          }
        },
        harvests: {
          include: {
            seedBatches: {
              include: {
                seedlings: {
                  orderBy: { seedlingId: 'asc' }
                },
                _count: {
                  select: { seedlings: true }
                }
              }
            }
          },
          orderBy: { harvestNumber: 'asc' }
        },
        offspring: {
          select: {
            id: true,
            plantId: true,
            hybridName: true,
            species: true,
            healthStatus: true,
            photos: { take: 1, orderBy: { dateTaken: 'desc' } }
          }
        }
      }
    })

    if (!record) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching breeding record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch breeding record' },
      { status: 500 }
    )
  }
}

// PATCH /api/breeding/[id] - Update breeding record
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check record exists
    const existing = await prisma.breedingRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 })
    }

    const updated = await prisma.breedingRecord.update({
      where: { id },
      data: {
        ...(body.crossDate && { crossDate: new Date(body.crossDate) }),
        ...(body.crossType && { crossType: body.crossType }),
        ...(body.crossCategory !== undefined && { crossCategory: body.crossCategory }),
        ...(body.pollinationMethod !== undefined && { pollinationMethod: body.pollinationMethod }),
        ...(body.targetTraits !== undefined && {
          targetTraits: body.targetTraits ? JSON.stringify(body.targetTraits) : null
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
        // Legacy summary fields (can be updated manually or computed)
        ...(body.seedsProduced !== undefined && { seedsProduced: body.seedsProduced }),
        ...(body.germinationRate !== undefined && { germinationRate: body.germinationRate }),
        ...(body.seedlingCount !== undefined && { seedlingCount: body.seedlingCount }),
        ...(body.f1PlantsRaised !== undefined && { f1PlantsRaised: body.f1PlantsRaised })
      },
      include: {
        femalePlant: { select: { plantId: true, hybridName: true } },
        malePlant: { select: { plantId: true, hybridName: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating breeding record:', error)
    return NextResponse.json(
      { error: 'Failed to update breeding record' },
      { status: 500 }
    )
  }
}

// DELETE /api/breeding/[id] - Delete breeding record (cascades to harvests, batches, seedlings)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check record exists
    const existing = await prisma.breedingRecord.findUnique({
      where: { id },
      include: { offspring: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 })
    }

    // Warn if there are graduated plants
    if (existing.offspring.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete breeding record with graduated plants',
          graduatedPlants: existing.offspring.map(p => p.plantId)
        },
        { status: 409 }
      )
    }

    await prisma.breedingRecord.delete({ where: { id } })

    return NextResponse.json({ success: true, deleted: existing.crossId })
  } catch (error) {
    console.error('Error deleting breeding record:', error)
    return NextResponse.json(
      { error: 'Failed to delete breeding record' },
      { status: 500 }
    )
  }
}
