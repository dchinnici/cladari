import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateSeedlingId } from '@/lib/breeding-ids'

// GET /api/seedlings - List seedlings with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const seedBatchId = searchParams.get('seedBatchId')
    const selectionStatus = searchParams.get('selectionStatus')
    const healthStatus = searchParams.get('healthStatus')

    const seedlings = await prisma.seedling.findMany({
      where: {
        ...(seedBatchId && { seedBatchId }),
        ...(selectionStatus && { selectionStatus }),
        ...(healthStatus && { healthStatus })
      },
      include: {
        seedBatch: {
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
            }
          }
        },
        graduatedToPlant: {
          select: { plantId: true, hybridName: true }
        },
        location: {
          select: { id: true, name: true }
        }
      },
      orderBy: { seedlingId: 'asc' }
    })

    return NextResponse.json(seedlings)
  } catch (error) {
    console.error('Error fetching seedlings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seedlings' },
      { status: 500 }
    )
  }
}

// POST /api/seedlings - Create new seedling(s)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Support bulk creation
    const seedlingsData = Array.isArray(body) ? body : [body]

    if (seedlingsData.length === 0) {
      return NextResponse.json({ error: 'No seedling data provided' }, { status: 400 })
    }

    // Validate all have seedBatchId
    const firstBatchId = seedlingsData[0].seedBatchId
    if (!firstBatchId) {
      return NextResponse.json({ error: 'seedBatchId is required' }, { status: 400 })
    }

    // Verify seed batch exists
    const seedBatch = await prisma.seedBatch.findUnique({
      where: { id: firstBatchId },
      include: {
        harvest: {
          include: {
            breedingRecord: { select: { crossId: true } }
          }
        }
      }
    })
    if (!seedBatch) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    // Create seedlings
    const createdSeedlings = []
    for (const data of seedlingsData) {
      const seedlingId = data.seedlingId || await generateSeedlingId()

      // Check for duplicate
      const existing = await prisma.seedling.findUnique({ where: { seedlingId } })
      if (existing) {
        return NextResponse.json(
          { error: `SeedlingId ${seedlingId} already exists` },
          { status: 409 }
        )
      }

      const seedling = await prisma.seedling.create({
        data: {
          seedlingId,
          seedBatchId: data.seedBatchId || firstBatchId,
          positionLabel: data.positionLabel || null,
          emergenceDate: data.emergenceDate ? new Date(data.emergenceDate) : new Date(),
          firstTrueLeaf: data.firstTrueLeaf ? new Date(data.firstTrueLeaf) : null,
          prickOutDate: data.prickOutDate ? new Date(data.prickOutDate) : null,
          potSize: data.potSize || null,
          leafCount: data.leafCount || null,
          largestLeafCm: data.largestLeafCm || null,
          healthStatus: data.healthStatus || 'HEALTHY',
          selectionStatus: data.selectionStatus || 'GROWING',
          selectionDate: data.selectionDate ? new Date(data.selectionDate) : null,
          selectionNotes: data.selectionNotes || null,
          locationId: data.locationId || null,
          notes: data.notes || null,
          photos: data.photos ? JSON.stringify(data.photos) : '[]'
        }
      })
      createdSeedlings.push(seedling)
    }

    // Update seed batch germination count
    const totalSeedlings = await prisma.seedling.count({
      where: { seedBatchId: firstBatchId }
    })
    await prisma.seedBatch.update({
      where: { id: firstBatchId },
      data: {
        germinatedCount: totalSeedlings,
        germinationRate: seedBatch.seedCount > 0
          ? (totalSeedlings / seedBatch.seedCount) * 100
          : null,
        status: 'GERMINATING',
        ...(totalSeedlings === 1 && { firstEmergence: createdSeedlings[0].emergenceDate })
      }
    })

    return NextResponse.json(
      createdSeedlings.length === 1 ? createdSeedlings[0] : createdSeedlings,
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating seedling:', error)
    return NextResponse.json(
      { error: 'Failed to create seedling' },
      { status: 500 }
    )
  }
}
