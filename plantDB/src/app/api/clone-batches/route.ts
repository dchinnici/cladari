import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateCloneBatchId } from '@/lib/breeding-ids'
import { getUser } from '@/lib/supabase/server'

// GET /api/clone-batches - List all clone batches
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const propagationType = searchParams.get('propagationType')

    const batches = await prisma.cloneBatch.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
        ...(propagationType && { propagationType })
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
      },
      orderBy: { acquiredDate: 'desc' }
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error('Error fetching clone batches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clone batches' },
      { status: 500 }
    )
  }
}

// POST /api/clone-batches - Create new clone batch
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.propagationType) {
      return NextResponse.json(
        { error: 'propagationType is required (TC, CUTTING, DIVISION, OFFSET)' },
        { status: 400 }
      )
    }

    if (!body.acquiredCount || body.acquiredCount < 1) {
      return NextResponse.json(
        { error: 'acquiredCount must be at least 1' },
        { status: 400 }
      )
    }

    // Verify source plant exists if provided and belongs to user
    if (body.sourcePlantId) {
      const sourcePlant = await prisma.plant.findUnique({
        where: { id: body.sourcePlantId, userId: user.id }
      })
      if (!sourcePlant) {
        return NextResponse.json({ error: 'Source plant not found' }, { status: 404 })
      }
    }

    // Generate batchId if not provided
    const batchId = body.batchId || await generateCloneBatchId()

    // Check for duplicate batchId
    const existing = await prisma.cloneBatch.findUnique({ where: { batchId } })
    if (existing) {
      return NextResponse.json(
        { error: `BatchId ${batchId} already exists` },
        { status: 409 }
      )
    }

    const batch = await prisma.cloneBatch.create({
      data: {
        batchId,
        userId: user.id,
        propagationType: body.propagationType,
        sourcePlantId: body.sourcePlantId || null,
        externalSource: body.externalSource || null,
        species: body.species || null,
        cultivarName: body.cultivarName || null,
        acquiredDate: body.acquiredDate ? new Date(body.acquiredDate) : new Date(),
        acquiredCount: body.acquiredCount,
        currentCount: body.currentCount ?? body.acquiredCount,
        containerCount: body.containerCount || 1,
        containerType: body.containerType || null,
        status: body.status || 'GROWING',
        locationId: body.locationId || null,
        identifier: body.identifier || null,
        notes: body.notes || null,
        photos: body.photos || []
      },
      include: {
        sourcePlant: {
          select: { plantId: true, hybridName: true, species: true }
        },
        location: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error('Error creating clone batch:', error)
    return NextResponse.json(
      { error: 'Failed to create clone batch' },
      { status: 500 }
    )
  }
}
