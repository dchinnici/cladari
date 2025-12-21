import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/seedlings/[id] - Get single seedling with full lineage
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const seedling = await prisma.seedling.findUnique({
      where: { id },
      include: {
        seedBatch: {
          include: {
            harvest: {
              include: {
                breedingRecord: {
                  include: {
                    femalePlant: {
                      select: {
                        id: true,
                        plantId: true,
                        hybridName: true,
                        species: true,
                        section: true
                      }
                    },
                    malePlant: {
                      select: {
                        id: true,
                        plantId: true,
                        hybridName: true,
                        species: true,
                        section: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        graduatedToPlant: true,
        location: true
      }
    })

    if (!seedling) {
      return NextResponse.json({ error: 'Seedling not found' }, { status: 404 })
    }

    return NextResponse.json(seedling)
  } catch (error) {
    console.error('Error fetching seedling:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seedling' },
      { status: 500 }
    )
  }
}

// PATCH /api/seedlings/[id] - Update seedling
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.seedling.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Seedling not found' }, { status: 404 })
    }

    // Prevent editing graduated seedlings (except notes)
    if (existing.selectionStatus === 'GRADUATED' && Object.keys(body).some(
      k => !['notes', 'photos'].includes(k)
    )) {
      return NextResponse.json(
        { error: 'Cannot edit graduated seedling. Edit the Plant record instead.' },
        { status: 409 }
      )
    }

    const updated = await prisma.seedling.update({
      where: { id },
      data: {
        ...(body.positionLabel !== undefined && { positionLabel: body.positionLabel }),
        ...(body.emergenceDate && { emergenceDate: new Date(body.emergenceDate) }),
        ...(body.firstTrueLeaf && { firstTrueLeaf: new Date(body.firstTrueLeaf) }),
        ...(body.prickOutDate && { prickOutDate: new Date(body.prickOutDate) }),
        ...(body.potSize !== undefined && { potSize: body.potSize }),
        ...(body.leafCount !== undefined && { leafCount: body.leafCount }),
        ...(body.largestLeafCm !== undefined && { largestLeafCm: body.largestLeafCm }),
        ...(body.healthStatus !== undefined && { healthStatus: body.healthStatus }),
        ...(body.selectionStatus !== undefined && { selectionStatus: body.selectionStatus }),
        ...(body.selectionDate && { selectionDate: new Date(body.selectionDate) }),
        ...(body.selectionNotes !== undefined && { selectionNotes: body.selectionNotes }),
        ...(body.locationId !== undefined && { locationId: body.locationId }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating seedling:', error)
    return NextResponse.json(
      { error: 'Failed to update seedling' },
      { status: 500 }
    )
  }
}

// DELETE /api/seedlings/[id] - Delete seedling (only if not graduated)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.seedling.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Seedling not found' }, { status: 404 })
    }

    if (existing.graduatedToPlantId) {
      return NextResponse.json(
        { error: 'Cannot delete graduated seedling. Delete or archive the Plant instead.' },
        { status: 409 }
      )
    }

    await prisma.seedling.delete({ where: { id } })

    return NextResponse.json({ success: true, deleted: existing.seedlingId })
  } catch (error) {
    console.error('Error deleting seedling:', error)
    return NextResponse.json(
      { error: 'Failed to delete seedling' },
      { status: 500 }
    )
  }
}
