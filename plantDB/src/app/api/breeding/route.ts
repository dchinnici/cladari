import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateCrossId } from '@/lib/breeding-ids'

// GET /api/breeding - List all breeding records
export async function GET() {
  try {
    const records = await prisma.breedingRecord.findMany({
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
        },
        harvests: {
          include: {
            seedBatches: {
              include: {
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
            hybridName: true
          }
        }
      },
      orderBy: { crossDate: 'desc' }
    })

    // Add computed summary fields
    const recordsWithSummary = records.map(record => {
      const totalSeeds = record.harvests.reduce((sum, h) => sum + h.seedCount, 0)
      const totalSeedlings = record.harvests.reduce((sum, h) =>
        sum + h.seedBatches.reduce((batchSum, b) => batchSum + b._count.seedlings, 0), 0)

      return {
        ...record,
        summary: {
          totalHarvests: record.harvests.length,
          totalSeeds,
          totalSeedlings,
          totalGraduated: record.offspring.length
        }
      }
    })

    return NextResponse.json(recordsWithSummary)
  } catch (error) {
    console.error('Error fetching breeding records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch breeding records' },
      { status: 500 }
    )
  }
}

// POST /api/breeding - Create new breeding record
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.femalePlantId || !body.malePlantId) {
      return NextResponse.json(
        { error: 'femalePlantId and malePlantId are required' },
        { status: 400 }
      )
    }

    // Verify plants exist
    const [female, male] = await Promise.all([
      prisma.plant.findUnique({ where: { id: body.femalePlantId } }),
      prisma.plant.findUnique({ where: { id: body.malePlantId } })
    ])

    if (!female) {
      return NextResponse.json({ error: 'Female plant not found' }, { status: 404 })
    }
    if (!male) {
      return NextResponse.json({ error: 'Male plant not found' }, { status: 404 })
    }

    // Generate crossId if not provided
    const crossId = body.crossId || await generateCrossId()

    // Check for duplicate crossId
    const existing = await prisma.breedingRecord.findUnique({ where: { crossId } })
    if (existing) {
      return NextResponse.json(
        { error: `CrossId ${crossId} already exists` },
        { status: 409 }
      )
    }

    const record = await prisma.breedingRecord.create({
      data: {
        crossId,
        crossDate: body.crossDate ? new Date(body.crossDate) : new Date(),
        femalePlantId: body.femalePlantId,
        malePlantId: body.malePlantId,
        crossType: body.crossType || 'CONTROLLED',
        crossCategory: body.crossCategory || null,
        pollinationMethod: body.pollinationMethod || null,
        targetTraits: body.targetTraits ? JSON.stringify(body.targetTraits) : null,
        notes: body.notes || null
      },
      include: {
        femalePlant: {
          select: { plantId: true, hybridName: true, species: true }
        },
        malePlant: {
          select: { plantId: true, hybridName: true, species: true }
        }
      }
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating breeding record:', error)
    return NextResponse.json(
      { error: 'Failed to create breeding record' },
      { status: 500 }
    )
  }
}
