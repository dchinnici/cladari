import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser, getSignedPhotoUrl } from '@/lib/supabase/server'

// GET: Retrieve single plant by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const plant = await prisma.plant.findUnique({
      where: {
        id: params.id,
        userId: user.id  // Ensure user owns this plant
      },
      include: {
        vendor: true,
        currentLocation: true,
        careLogs: {
          orderBy: { date: 'desc' }
        },
        measurements: {
          orderBy: { measurementDate: 'desc' }
        },
        traits: {
          orderBy: { observationDate: 'desc' }
        },
        floweringCycles: {
          orderBy: { createdAt: 'desc' }
        },
        photos: {
          orderBy: { dateTaken: 'desc' }
        },
        chatLogs: {
          orderBy: { conversationDate: 'desc' }
        },
        // Lineage relations
        femaleParent: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        },
        maleParent: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        },
        cloneSource: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        },
        cloneBatch: {
          select: {
            id: true,
            batchId: true,
            propagationType: true,
            cultivarName: true,
            species: true,
            externalSource: true,
            acquiredDate: true
          }
        },
        breedingRecord: {
          select: {
            id: true,
            crossId: true,
            crossDate: true,
            femalePlant: { select: { id: true, plantId: true, hybridName: true, species: true } },
            malePlant: { select: { id: true, plantId: true, hybridName: true, species: true } },
            f1PlantsRaised: true
          }
        },
        // Progeny
        femaleOffspring: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        },
        maleOffspring: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        },
        clones: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        },
        cloneBatchesSourced: {
          select: {
            id: true,
            batchId: true,
            propagationType: true,
            cultivarName: true,
            species: true,
            acquiredDate: true,
            acquiredCount: true,
            currentCount: true,
            status: true,
            _count: { select: { plants: true } }
          },
          orderBy: { acquiredDate: 'desc' }
        },
        // Breeding participation
        femaleBreedings: {
          select: {
            id: true,
            crossId: true,
            crossDate: true,
            malePlant: { select: { id: true, plantId: true, hybridName: true, species: true } },
            f1PlantsRaised: true
          }
        },
        maleBreedings: {
          select: {
            id: true,
            crossId: true,
            crossDate: true,
            femalePlant: { select: { id: true, plantId: true, hybridName: true, species: true } },
            f1PlantsRaised: true
          }
        }
      }
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    // Get signed URLs for all photos
    const photosWithUrls = await Promise.all(
      plant.photos.map(async (photo) => {
        if (photo.storagePath) {
          const signedUrl = await getSignedPhotoUrl(photo.storagePath)
          if (signedUrl) {
            return { ...photo, url: signedUrl }
          }
        }
        return photo
      })
    )

    return NextResponse.json({ ...plant, photos: photosWithUrls })
  } catch (error) {
    console.error('Error fetching plant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plant' },
      { status: 500 }
    )
  }
}

// PATCH: Update plant details
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const body = await request.json()

    const updated = await prisma.plant.update({
      where: {
        id: params.id,
        userId: user.id  // Ensure user owns this plant
      },
      data: {
        // Only update fields that are provided
        section: body.section !== undefined ? body.section : undefined,
        species: body.species !== undefined ? body.species : undefined,
        hybridName: body.hybridName !== undefined ? body.hybridName : undefined,
        crossNotation: body.crossNotation !== undefined ? body.crossNotation : undefined,
        generation: body.generation !== undefined ? body.generation : undefined,
        breeder: body.breeder !== undefined ? body.breeder : undefined,
        breederCode: body.breederCode !== undefined ? body.breederCode : undefined,
        locationId: body.locationId !== undefined ? body.locationId : undefined,
        healthStatus: body.healthStatus !== undefined ? body.healthStatus : undefined,
        currentPotSize: body.currentPotSize !== undefined ? parseFloat(body.currentPotSize) || null : undefined,
        currentPotType: body.currentPotType !== undefined ? body.currentPotType : undefined,
        lastRepotDate: body.lastRepotDate !== undefined ?
          (body.lastRepotDate ? new Date(body.lastRepotDate + 'T00:00:00.000Z') : null) : undefined,
        marketValue: body.marketValue !== undefined ? parseFloat(body.marketValue) || null : undefined,
        isForSale: body.isForSale !== undefined ? body.isForSale : undefined,
        isMother: body.isMother !== undefined ? body.isMother : undefined,
        isEliteGenetics: body.isEliteGenetics !== undefined ? body.isEliteGenetics : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        tags: body.tags !== undefined ? JSON.stringify(body.tags) : undefined,
        coverPhotoId: body.coverPhotoId !== undefined ? body.coverPhotoId : undefined,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating plant:', error)
    return NextResponse.json(
      { error: 'Failed to update plant' },
      { status: 500 }
    )
  }
}

// PUT: Update plant details (alias for PATCH for compatibility)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context)
}

// DELETE: Archive plant (soft delete - preserves all data for ML training)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const body = await request.json().catch(() => ({}))

    // Soft delete: mark as archived instead of actually deleting
    const archived = await prisma.plant.update({
      where: {
        id: params.id,
        userId: user.id  // Ensure user owns this plant
      },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archiveReason: body.reason || 'deleted'  // died, sold, culled, divided, lost, etc.
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Plant archived successfully',
      archived
    })
  } catch (error) {
    console.error('Error archiving plant:', error)
    return NextResponse.json(
      { error: 'Failed to archive plant' },
      { status: 500 }
    )
  }
}
