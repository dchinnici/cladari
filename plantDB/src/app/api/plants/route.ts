import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      include: {
        vendor: true,
        currentLocation: true,
      }
    })

    // Sort by name (hybridName or species, whichever exists)
    const sortedPlants = plants.sort((a, b) => {
      const nameA = (a.hybridName || a.species || '').toLowerCase()
      const nameB = (b.hybridName || b.species || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return NextResponse.json(sortedPlants)
  } catch (error) {
    console.error('Error fetching plants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plants' },
      { status: 500 }
    )
  }
}

function generatePlantId() {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ANT-${year}-${rand}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Generate or accept provided plantId
    let plantId: string = (body.plantId || '').trim()
    let attempts = 0
    while (!plantId && attempts < 5) {
      const candidate = generatePlantId()
      const exists = await prisma.plant.findUnique({ where: { plantId: candidate } })
      if (!exists) {
        plantId = candidate
      }
      attempts++
    }

    if (!plantId) {
      return NextResponse.json({ error: 'Could not generate plantId' }, { status: 500 })
    }

    const created = await prisma.plant.create({
      data: {
        plantId,
        accessionDate: body.accessionDate ? new Date(body.accessionDate) : new Date(),
        genus: 'Anthurium',
        section: body.section || null,
        species: body.species || null,
        hybridName: body.hybridName || null,
        crossNotation: body.crossNotation || null,
        generation: body.generation || null,
        breeder: body.breeder || null,
        breederCode: body.breederCode || null,
        acquisitionCost: body.acquisitionCost ? parseFloat(String(body.acquisitionCost)) : null,
        propagationType: body.propagationType || null,
        healthStatus: body.healthStatus || 'healthy',
        marketValue: body.marketValue ? parseFloat(String(body.marketValue)) : null,
        notes: body.notes || null,
        tags: JSON.stringify(body.tags ?? []),
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating plant:', error)
    return NextResponse.json(
      { error: 'Failed to create plant' },
      { status: 500 }
    )
  }
}
