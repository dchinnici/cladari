import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/breeding/[id]/harvests - List harvests for a breeding record
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const harvests = await prisma.harvest.findMany({
      where: { breedingRecordId: id },
      include: {
        seedBatches: {
          include: {
            _count: { select: { seedlings: true } }
          }
        }
      },
      orderBy: { harvestNumber: 'asc' }
    })

    return NextResponse.json(harvests)
  } catch (error) {
    console.error('Error fetching harvests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch harvests' },
      { status: 500 }
    )
  }
}

// POST /api/breeding/[id]/harvests - Create new harvest
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify breeding record exists
    const breedingRecord = await prisma.breedingRecord.findUnique({ where: { id } })
    if (!breedingRecord) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 })
    }

    // Auto-determine next harvest number
    const lastHarvest = await prisma.harvest.findFirst({
      where: { breedingRecordId: id },
      orderBy: { harvestNumber: 'desc' }
    })
    const harvestNumber = body.harvestNumber || (lastHarvest ? lastHarvest.harvestNumber + 1 : 1)

    // Check for duplicate harvest number
    const existing = await prisma.harvest.findUnique({
      where: {
        breedingRecordId_harvestNumber: {
          breedingRecordId: id,
          harvestNumber
        }
      }
    })
    if (existing) {
      return NextResponse.json(
        { error: `Harvest #${harvestNumber} already exists for this cross` },
        { status: 409 }
      )
    }

    const harvest = await prisma.harvest.create({
      data: {
        breedingRecordId: id,
        harvestNumber,
        harvestDate: body.harvestDate ? new Date(body.harvestDate) : new Date(),
        berryCount: body.berryCount || null,
        seedCount: body.seedCount || 0,
        seedViability: body.seedViability || null,
        notes: body.notes || null,
        photos: body.photos ? JSON.stringify(body.photos) : '[]'
      }
    })

    return NextResponse.json(harvest, { status: 201 })
  } catch (error) {
    console.error('Error creating harvest:', error)
    return NextResponse.json(
      { error: 'Failed to create harvest' },
      { status: 500 }
    )
  }
}
