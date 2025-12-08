import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/seed-batches/[id] - Get single seed batch with seedlings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const batch = await prisma.seedBatch.findUnique({
      where: { id },
      include: {
        harvest: {
          include: {
            breedingRecord: {
              select: {
                crossId: true,
                crossCategory: true,
                femalePlant: { select: { plantId: true, hybridName: true, species: true } },
                malePlant: { select: { plantId: true, hybridName: true, species: true } }
              }
            }
          }
        },
        seedlings: {
          orderBy: { seedlingId: 'asc' },
          include: {
            graduatedToPlant: {
              select: { plantId: true, hybridName: true }
            },
            location: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    // Add computed stats
    const stats = {
      totalSeedlings: batch.seedlings.length,
      byStatus: batch.seedlings.reduce((acc, s) => {
        acc[s.selectionStatus] = (acc[s.selectionStatus] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({ ...batch, stats })
  } catch (error) {
    console.error('Error fetching seed batch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seed batch' },
      { status: 500 }
    )
  }
}

// PATCH /api/seed-batches/[id] - Update seed batch
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.seedBatch.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    const updated = await prisma.seedBatch.update({
      where: { id },
      data: {
        ...(body.sowDate && { sowDate: new Date(body.sowDate) }),
        ...(body.seedCount !== undefined && { seedCount: parseInt(body.seedCount) || body.seedCount }),
        ...(body.substrate !== undefined && { substrate: body.substrate }),
        ...(body.container !== undefined && { container: body.container || null }),
        ...(body.temperature !== undefined && { temperature: body.temperature ? parseFloat(body.temperature) : null }),
        ...(body.humidity !== undefined && { humidity: body.humidity ? parseFloat(body.humidity) : null }),
        ...(body.heatMat !== undefined && { heatMat: body.heatMat }),
        ...(body.domed !== undefined && { domed: body.domed }),
        ...(body.lightLevel !== undefined && { lightLevel: body.lightLevel }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.germinatedCount !== undefined && { germinatedCount: body.germinatedCount }),
        ...(body.germinationRate !== undefined && { germinationRate: body.germinationRate }),
        ...(body.firstEmergence && { firstEmergence: new Date(body.firstEmergence) }),
        ...(body.lastEmergence && { lastEmergence: new Date(body.lastEmergence) }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating seed batch:', error)
    return NextResponse.json(
      { error: 'Failed to update seed batch' },
      { status: 500 }
    )
  }
}

// DELETE /api/seed-batches/[id] - Delete seed batch
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.seedBatch.findUnique({
      where: { id },
      include: { seedlings: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    if (existing.seedlings.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete seed batch with ${existing.seedlings.length} seedlings` },
        { status: 409 }
      )
    }

    await prisma.seedBatch.delete({ where: { id } })

    return NextResponse.json({ success: true, deleted: existing.batchId })
  } catch (error) {
    console.error('Error deleting seed batch:', error)
    return NextResponse.json(
      { error: 'Failed to delete seed batch' },
      { status: 500 }
    )
  }
}
