import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST: Create new morphology observation (temporal tracking)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // Create NEW observation with current date
    const observationDate = body.observationDate ? new Date(body.observationDate + 'T00:00:00.000Z') : new Date()
    const traitData = []

    if (body.leafShape) {
      traitData.push({
        plantId: params.id,
        category: 'leaf',
        traitName: 'shape',
        value: body.leafShape,
        observationDate
      })
    }

    if (body.leafTexture) {
      traitData.push({
        plantId: params.id,
        category: 'leaf',
        traitName: 'texture',
        value: body.leafTexture,
        observationDate
      })
    }

    if (body.leafColor) {
      traitData.push({
        plantId: params.id,
        category: 'leaf',
        traitName: 'color',
        value: body.leafColor,
        observationDate
      })
    }

    if (body.leafSize) {
      traitData.push({
        plantId: params.id,
        category: 'leaf',
        traitName: 'size',
        value: body.leafSize,
        observationDate
      })
    }

    if (body.spadixColor) {
      traitData.push({
        plantId: params.id,
        category: 'spadix',
        traitName: 'color',
        value: body.spadixColor,
        observationDate
      })
    }

    if (body.spatheColor) {
      traitData.push({
        plantId: params.id,
        category: 'spathe',
        traitName: 'color',
        value: body.spatheColor,
        observationDate
      })
    }

    if (body.spatheShape) {
      traitData.push({
        plantId: params.id,
        category: 'spathe',
        traitName: 'shape',
        value: body.spatheShape,
        observationDate
      })
    }

    if (body.growthRate) {
      traitData.push({
        plantId: params.id,
        category: 'growth',
        traitName: 'rate',
        value: body.growthRate,
        observationDate
      })
    }

    if (body.matureSize) {
      traitData.push({
        plantId: params.id,
        category: 'growth',
        traitName: 'matureSize',
        value: body.matureSize,
        observationDate
      })
    }

    if (body.petioleColor) {
      traitData.push({
        plantId: params.id,
        category: 'leaf',
        traitName: 'petioleColor',
        value: body.petioleColor,
        observationDate
      })
    }

    if (body.cataphyllColor) {
      traitData.push({
        plantId: params.id,
        category: 'growth',
        traitName: 'cataphyllColor',
        value: body.cataphyllColor,
        observationDate
      })
    }

    if (body.newLeafColor) {
      traitData.push({
        plantId: params.id,
        category: 'leaf',
        traitName: 'newLeafColor',
        value: body.newLeafColor,
        observationDate
      })
    }

    // Create all traits (no upsert - allows temporal tracking)
    for (const t of traitData) {
      await prisma.trait.create({ data: t as any })
    }

    // Return all traits for this plant, ordered by date (most recent first)
    const traits = await prisma.trait.findMany({
      where: { plantId: params.id },
      orderBy: { observationDate: 'desc' }
    })

    return NextResponse.json(traits)
  } catch (error) {
    console.error('Error creating traits:', error)
    return NextResponse.json(
      { error: 'Failed to create traits' },
      { status: 500 }
    )
  }
}
