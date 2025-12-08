import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSeedBatchId } from '@/lib/breeding-ids'

// GET /api/seed-batches - List all seed batches
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const harvestId = searchParams.get('harvestId')
    const status = searchParams.get('status')

    const batches = await prisma.seedBatch.findMany({
      where: {
        ...(harvestId && { harvestId }),
        ...(status && { status })
      },
      include: {
        harvest: {
          include: {
            breedingRecord: {
              select: {
                crossId: true,
                femalePlant: { select: { plantId: true, hybridName: true } },
                malePlant: { select: { plantId: true, hybridName: true } }
              }
            }
          }
        },
        _count: {
          select: { seedlings: true }
        }
      },
      orderBy: { sowDate: 'desc' }
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error('Error fetching seed batches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seed batches' },
      { status: 500 }
    )
  }
}

// POST /api/seed-batches - Create new seed batch
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.harvestId) {
      return NextResponse.json(
        { error: 'harvestId is required' },
        { status: 400 }
      )
    }

    // Verify harvest exists
    const harvest = await prisma.harvest.findUnique({
      where: { id: body.harvestId },
      include: { breedingRecord: { select: { crossId: true } } }
    })
    if (!harvest) {
      return NextResponse.json({ error: 'Harvest not found' }, { status: 404 })
    }

    // Generate batchId if not provided
    const batchId = body.batchId || await generateSeedBatchId()

    // Check for duplicate batchId
    const existing = await prisma.seedBatch.findUnique({ where: { batchId } })
    if (existing) {
      return NextResponse.json(
        { error: `BatchId ${batchId} already exists` },
        { status: 409 }
      )
    }

    const batch = await prisma.seedBatch.create({
      data: {
        batchId,
        harvestId: body.harvestId,
        sowDate: body.sowDate ? new Date(body.sowDate) : new Date(),
        seedCount: body.seedCount || 0,
        substrate: body.substrate || 'Unknown',
        container: body.container || null,
        temperature: body.temperature ? parseFloat(body.temperature) : null,
        humidity: body.humidity ? parseFloat(body.humidity) : null,
        heatMat: body.heatMat ?? false,
        domed: body.domed ?? true,
        lightLevel: body.lightLevel || null,
        status: body.status || 'SOWN',
        notes: body.notes || null,
        photos: body.photos ? JSON.stringify(body.photos) : '[]'
      },
      include: {
        harvest: {
          include: {
            breedingRecord: { select: { crossId: true } }
          }
        }
      }
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    console.error('Error creating seed batch:', error)
    return NextResponse.json(
      { error: 'Failed to create seed batch' },
      { status: 500 }
    )
  }
}
