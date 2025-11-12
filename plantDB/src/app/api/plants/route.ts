import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const plants = await prisma.plant.findMany({
      where: {
        isArchived: false  // Exclude archived plants from main collection view
      },
      include: {
        vendor: true,
        currentLocation: true,
        careLogs: {
          orderBy: { date: 'desc' },
          take: 10  // Increased from 1 to 10 for care frequency calculations
        },
        measurements: {
          orderBy: { measurementDate: 'desc' },
          take: 1
        },
        traits: {
          orderBy: { observationDate: 'desc' },
          take: 1
        },
        floweringCycles: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        photos: {
          orderBy: { dateTaken: 'desc' }
        }
      }
    })

    // Add lastActivityDate and select display photo for each plant
    const plantsWithActivity = plants.map(plant => {
      const dates = [
        plant.updatedAt,
        plant.careLogs[0]?.date,
        plant.measurements[0]?.measurementDate,
        plant.traits[0]?.observationDate,
        plant.floweringCycles[0]?.createdAt
      ].filter(Boolean).map(d => new Date(d!))

      const lastActivityDate = dates.length > 0
        ? new Date(Math.max(...dates.map(d => d.getTime())))
        : plant.updatedAt

      // Select the display photo: use cover photo if set, otherwise use first photo
      let displayPhoto = null
      if (plant.coverPhotoId && plant.photos.length > 0) {
        displayPhoto = plant.photos.find(p => p.id === plant.coverPhotoId) || plant.photos[0]
      } else if (plant.photos.length > 0) {
        displayPhoto = plant.photos[0]
      }

      return {
        ...plant,
        photos: displayPhoto ? [displayPhoto] : [],  // Return as array for backward compatibility
        lastActivityDate
      }
    })

    // Sort by name (hybridName or species, whichever exists)
    const sortedPlants = plantsWithActivity.sort((a, b) => {
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
        accessionDate: body.accessionDate ? new Date(body.accessionDate + 'T00:00:00.000Z') : new Date(),
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
