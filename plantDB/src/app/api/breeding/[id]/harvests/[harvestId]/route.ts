import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/breeding/[id]/harvests/[harvestId] - Get single harvest
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; harvestId: string }> }
) {
  try {
    const { harvestId } = await params

    const harvest = await prisma.harvest.findUnique({
      where: { id: harvestId },
      include: {
        breedingRecord: {
          select: { crossId: true }
        },
        seedBatches: {
          include: {
            seedlings: {
              orderBy: { seedlingId: 'asc' }
            }
          }
        }
      }
    })

    if (!harvest) {
      return NextResponse.json({ error: 'Harvest not found' }, { status: 404 })
    }

    return NextResponse.json(harvest)
  } catch (error) {
    console.error('Error fetching harvest:', error)
    return NextResponse.json(
      { error: 'Failed to fetch harvest' },
      { status: 500 }
    )
  }
}

// PATCH /api/breeding/[id]/harvests/[harvestId] - Update harvest
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; harvestId: string }> }
) {
  try {
    const { harvestId } = await params
    const body = await request.json()

    const existing = await prisma.harvest.findUnique({ where: { id: harvestId } })
    if (!existing) {
      return NextResponse.json({ error: 'Harvest not found' }, { status: 404 })
    }

    const updated = await prisma.harvest.update({
      where: { id: harvestId },
      data: {
        ...(body.harvestDate && { harvestDate: new Date(body.harvestDate) }),
        ...(body.berryCount !== undefined && { berryCount: body.berryCount }),
        ...(body.seedCount !== undefined && { seedCount: body.seedCount }),
        ...(body.seedViability !== undefined && { seedViability: body.seedViability }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating harvest:', error)
    return NextResponse.json(
      { error: 'Failed to update harvest' },
      { status: 500 }
    )
  }
}

// DELETE /api/breeding/[id]/harvests/[harvestId] - Delete harvest
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; harvestId: string }> }
) {
  try {
    const { harvestId } = await params

    const existing = await prisma.harvest.findUnique({
      where: { id: harvestId },
      include: { seedBatches: { include: { seedlings: true } } }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Harvest not found' }, { status: 404 })
    }

    // Warn if there are seedlings
    const seedlingCount = existing.seedBatches.reduce(
      (sum, batch) => sum + batch.seedlings.length, 0
    )
    if (seedlingCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete harvest with ${seedlingCount} seedlings` },
        { status: 409 }
      )
    }

    await prisma.harvest.delete({ where: { id: harvestId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting harvest:', error)
    return NextResponse.json(
      { error: 'Failed to delete harvest' },
      { status: 500 }
    )
  }
}
