import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser, getSignedPhotoUrl } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Get authenticated user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plants = await prisma.plant.findMany({
      where: {
        userId: user.id,  // Filter by authenticated user
        isArchived: false  // Exclude archived plants from main collection view
      },
      select: {
        // Core identity fields
        id: true,
        plantId: true,
        hybridName: true,
        species: true,
        breederCode: true,
        section: true,
        healthStatus: true,
        updatedAt: true,
        coverPhotoId: true,

        // Minimal location info
        currentLocation: {
          select: {
            id: true,
            name: true,
          }
        },

        // Care logs - REQUIRED for dynamic threshold calculation (need 10+ for intervals)
        careLogs: {
          select: {
            date: true,
            action: true,
          },
          orderBy: { date: 'desc' },
          take: 10
        },

        // Only cover photo OR first photo (not all photos)
        photos: {
          select: {
            id: true,
            storagePath: true,
            url: true,
            dateTaken: true,
          },
          orderBy: { dateTaken: 'desc' },
          take: 1,
        }
      }
    })

    // Fetch actual cover photos for plants where coverPhotoId != most recent photo
    const missingCoverIds = plants
      .filter(p => p.coverPhotoId && (!p.photos[0] || p.photos[0].id !== p.coverPhotoId))
      .map(p => p.coverPhotoId!)

    if (missingCoverIds.length > 0) {
      const coverPhotos = await prisma.photo.findMany({
        where: { id: { in: missingCoverIds } },
        select: { id: true, storagePath: true, url: true, dateTaken: true, plantId: true }
      })
      // Swap in the correct cover photo
      for (const plant of plants) {
        if (plant.coverPhotoId) {
          const cover = coverPhotos.find(p => p.id === plant.coverPhotoId)
          if (cover) {
            (plant as any).photos = [cover]
          }
        }
      }
    }

    // Batch signed URL generation for photos (parallel instead of sequential)
    const photoPromises = plants.map(plant => {
      const photo = plant.photos[0]
      if (photo?.storagePath) {
        return getSignedPhotoUrl(photo.storagePath)
      }
      return Promise.resolve(null)
    })
    const signedUrls = await Promise.all(photoPromises)

    // Add lastActivityDate and attach signed URLs
    const plantsWithActivity = plants.map((plant, index) => {
      // Calculate lastActivityDate from care logs and updatedAt
      const dates = [
        plant.updatedAt,
        plant.careLogs[0]?.date,
      ].filter(Boolean).map(d => new Date(d!))

      const lastActivityDate = dates.length > 0
        ? new Date(Math.max(...dates.map(d => d.getTime())))
        : plant.updatedAt

      // Attach signed URL to photo if available
      const displayPhoto = plant.photos[0]
      if (displayPhoto && signedUrls[index]) {
        displayPhoto.url = signedUrls[index]!
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

import { z } from 'zod'

// Validation Schema
const createPlantSchema = z.object({
  plantId: z.string().optional(),
  accessionDate: z.string().or(z.date()).optional(),
  section: z.string().optional().nullable(),
  species: z.string().optional().nullable(),
  hybridName: z.string().optional().nullable(),
  crossNotation: z.string().optional().nullable(),
  generation: z.string().optional().nullable(),
  breeder: z.string().optional().nullable(),
  breederCode: z.string().optional().nullable(),
  propagationType: z.string().optional().nullable(),
  healthStatus: z.enum(['healthy', 'struggling', 'recovering', 'critical', 'diseased']).default('healthy'),
  acquisitionCost: z.union([z.string(), z.number()]).transform(val => (val === '' ? null : Number(val))).optional().nullable(),
  marketValue: z.union([z.string(), z.number()]).transform(val => (val === '' ? null : Number(val))).optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isEliteGenetics: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parseResult = createPlantSchema.safeParse(json)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.format() }, { status: 400 })
    }

    const body = parseResult.data

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
        userId: user.id,  // Associate with authenticated user
        accessionDate: body.accessionDate ? new Date(body.accessionDate) : new Date(),
        genus: 'Anthurium',
        section: body.section || null,
        species: body.species || null,
        hybridName: body.hybridName || null,
        crossNotation: body.crossNotation || null,
        generation: body.generation || null,
        breeder: body.breeder || null,
        breederCode: body.breederCode || null,
        acquisitionCost: body.acquisitionCost || null,
        propagationType: body.propagationType || null,
        healthStatus: body.healthStatus,
        marketValue: body.marketValue || null,
        notes: body.notes || null,
        tags: JSON.stringify(body.tags),
        isEliteGenetics: body.isEliteGenetics,
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
