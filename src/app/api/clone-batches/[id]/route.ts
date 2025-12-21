import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/clone-batches/[id] - Get single clone batch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const batch = await prisma.cloneBatch.findUnique({
      where: { id },
      include: {
        sourcePlant: {
          select: {
            id: true,
            plantId: true,
            hybridName: true,
            species: true,
            section: true
          }
        },
        plants: {
          select: {
            id: true,
            plantId: true,
            hybridName: true,
            healthStatus: true
          }
        },
        location: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    if (!batch) {
      return NextResponse.json({ error: 'Clone batch not found' }, { status: 404 })
    }

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Error fetching clone batch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clone batch' },
      { status: 500 }
    )
  }
}

// PUT /api/clone-batches/[id] - Update clone batch
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check batch exists
    const existing = await prisma.cloneBatch.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Clone batch not found' }, { status: 404 })
    }

    const batch = await prisma.cloneBatch.update({
      where: { id },
      data: {
        ...(body.propagationType && { propagationType: body.propagationType }),
        ...(body.sourcePlantId !== undefined && { sourcePlantId: body.sourcePlantId }),
        ...(body.externalSource !== undefined && { externalSource: body.externalSource }),
        ...(body.species !== undefined && { species: body.species }),
        ...(body.cultivarName !== undefined && { cultivarName: body.cultivarName }),
        ...(body.acquiredDate && { acquiredDate: new Date(body.acquiredDate) }),
        ...(body.acquiredCount && { acquiredCount: body.acquiredCount }),
        ...(body.currentCount !== undefined && { currentCount: body.currentCount }),
        ...(body.containerCount && { containerCount: body.containerCount }),
        ...(body.containerType !== undefined && { containerType: body.containerType }),
        ...(body.status && { status: body.status }),
        ...(body.locationId !== undefined && { locationId: body.locationId }),
        ...(body.identifier !== undefined && { identifier: body.identifier }),
        ...(body.notes !== undefined && { notes: body.notes }),
        // photos is now a relation, managed via /api/photos endpoint
      },
      include: {
        sourcePlant: {
          select: { plantId: true, hybridName: true, species: true }
        },
        location: {
          select: { name: true }
        },
        _count: {
          select: { plants: true }
        }
      }
    })

    return NextResponse.json(batch)
  } catch (error) {
    console.error('Error updating clone batch:', error)
    return NextResponse.json(
      { error: 'Failed to update clone batch' },
      { status: 500 }
    )
  }
}

// DELETE /api/clone-batches/[id] - Delete clone batch
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check batch exists
    const existing = await prisma.cloneBatch.findUnique({
      where: { id },
      include: { _count: { select: { plants: true } } }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Clone batch not found' }, { status: 404 })
    }

    // Warn if plants are linked
    if (existing._count.plants > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${existing._count.plants} plants linked to this batch` },
        { status: 400 }
      )
    }

    await prisma.cloneBatch.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting clone batch:', error)
    return NextResponse.json(
      { error: 'Failed to delete clone batch' },
      { status: 500 }
    )
  }
}
