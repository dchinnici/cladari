import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

/**
 * POST /api/clone-batches/[id]/graduate
 *
 * Graduates one or more individuals from a clone batch to Plant records.
 *
 * Body:
 * - count: number (how many to graduate, default 1)
 * - plantIds?: string[] (optional custom IDs, must match count)
 * - hybridName?: string (override default from batch)
 * - species?: string
 * - section?: string
 * - healthStatus?: string
 * - locationId?: string
 * - notes?: string
 *
 * Each new Plant will have:
 * - cloneBatchId linking back to this batch
 * - cloneSourceId from batch's sourcePlant (if internal source)
 * - propagationType matching batch's propagationType
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const count = body.count || 1
    const customPlantIds = body.plantIds || []

    if (customPlantIds.length > 0 && customPlantIds.length !== count) {
      return NextResponse.json(
        { error: `plantIds array (${customPlantIds.length}) must match count (${count})` },
        { status: 400 }
      )
    }

    // Fetch the clone batch with source plant info
    const cloneBatch = await prisma.cloneBatch.findUnique({
      where: { id },
      include: {
        sourcePlant: true,
        location: true,
        plants: true, // Already graduated plants
      }
    })

    if (!cloneBatch) {
      return NextResponse.json({ error: 'Clone batch not found' }, { status: 404 })
    }

    // Verify ownership
    if (cloneBatch.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if there are enough remaining
    const currentRemaining = (cloneBatch.currentCount ?? cloneBatch.acquiredCount) - cloneBatch.plants.length
    if (count > currentRemaining) {
      return NextResponse.json(
        {
          error: `Cannot graduate ${count} plants. Only ${currentRemaining} remaining in batch.`,
          remaining: currentRemaining,
          alreadyGraduated: cloneBatch.plants.length
        },
        { status: 400 }
      )
    }

    // Determine plant attributes from batch
    const hybridName = body.hybridName || cloneBatch.cultivarName || cloneBatch.species || null
    const species = body.species || cloneBatch.species || null
    const section = body.section || cloneBatch.sourcePlant?.section || null
    const locationId = body.locationId || cloneBatch.locationId || null
    const healthStatus = body.healthStatus || 'healthy'

    // Map batch propagationType to Plant model values
    // Note: Plant dropdown options are: seed, cutting, tissue_culture, division, purchase
    // OFFSET maps to division since offsets are vegetative divisions from mother plant
    const propagationTypeMap: Record<string, string> = {
      'TC': 'tissue_culture',
      'CUTTING': 'cutting',
      'DIVISION': 'division',
      'OFFSET': 'division',  // Offsets are a type of division
      'SEED': 'seed',
    }
    const propagationType = propagationTypeMap[cloneBatch.propagationType] || cloneBatch.propagationType.toLowerCase()

    // Generate plant IDs if not provided
    // IMPORTANT: Generate all IDs at once to avoid duplicates when creating multiple plants
    const plantIds: string[] = []
    if (customPlantIds.length > 0) {
      // Validate all custom IDs don't exist
      for (const customId of customPlantIds) {
        const existing = await prisma.plant.findUnique({
          where: { plantId: customId }
        })
        if (existing) {
          return NextResponse.json(
            { error: `PlantId ${customId} already exists` },
            { status: 409 }
          )
        }
        plantIds.push(customId)
      }
    } else {
      // Generate sequential IDs by finding the highest once, then incrementing
      const year = new Date().getFullYear()
      const prefix = `ANT-${year}-`

      const latest = await prisma.plant.findFirst({
        where: { plantId: { startsWith: prefix } },
        orderBy: { plantId: 'desc' }
      })

      let nextNum = 1
      if (latest) {
        const currentNum = parseInt(latest.plantId.split('-')[2], 10)
        nextNum = currentNum + 1
      }

      // Generate sequential IDs for all plants
      for (let i = 0; i < count; i++) {
        plantIds.push(`${prefix}${(nextNum + i).toString().padStart(4, '0')}`)
      }
    }

    // Parse pot size string to float (e.g., "4 inch" → 4, "1 gallon" → 6.5)
    let potSizeFloat: number | null = null
    if (body.potSize) {
      const potSizeMap: Record<string, number> = {
        '2 inch': 2,
        '3 inch': 3,
        '4 inch': 4,
        '5 inch': 5,
        '6 inch': 6,
        '1 gallon': 6.5,
        '2 gallon': 8.5,
        '3 gallon': 10,
      }
      potSizeFloat = potSizeMap[body.potSize] || null
    }

    // Parse accession date
    const accessionDate = body.accessionDate
      ? new Date(body.accessionDate + 'T12:00:00') // Noon to avoid timezone issues
      : new Date()

    // Build notes with substrate info if provided
    let notes = body.notes || `Graduated from ${cloneBatch.batchId} (${cloneBatch.propagationType})`
    if (body.substrate) {
      notes = `[Substrate: ${body.substrate}] ${notes}`
    }

    // Create the Plant records in a transaction (all-or-nothing)
    const newGraduatedCount = cloneBatch.plants.length + count
    const totalCount = cloneBatch.currentCount ?? cloneBatch.acquiredCount
    const newStatus = newGraduatedCount >= totalCount ? 'COMPLETE' : cloneBatch.status

    const createdPlants = await prisma.$transaction(async (tx) => {
      const plants = []
      for (let i = 0; i < count; i++) {
        const plant = await tx.plant.create({
          data: {
            plantId: plantIds[i],
            userId: user.id,
            accessionDate,
            genus: 'Anthurium',
            section,
            species,
            hybridName,
            cloneSourceId: cloneBatch.sourcePlantId || null,
            cloneBatchId: cloneBatch.id,
            propagationType,
            healthStatus,
            locationId,
            currentPotSize: potSizeFloat,
            notes,
          }
        })
        plants.push(plant)
      }

      // Copy batch care logs to each graduated plant
      const batchCareLogs = await tx.careLog.findMany({
        where: { cloneBatchId: id }
      })

      if (batchCareLogs.length > 0) {
        for (const plant of plants) {
          for (const log of batchCareLogs) {
            await tx.careLog.create({
              data: {
                plantId: plant.id,
                date: log.date,
                action: log.action,
                inputEC: log.inputEC,
                inputPH: log.inputPH,
                outputEC: log.outputEC,
                outputPH: log.outputPH,
                isBaselineFeed: log.isBaselineFeed,
                feedComponents: log.feedComponents,
                treatmentId: log.treatmentId,
                dosage: log.dosage,
                unit: log.unit,
                details: log.details
                  ? `[Batch ${cloneBatch.batchId}] ${log.details}`
                  : `[Batch ${cloneBatch.batchId}]`,
                nextActionDue: log.nextActionDue,
                performedBy: log.performedBy,
              }
            })
          }
        }
      }

      // Copy batch photos to each graduated plant
      const batchPhotos = await tx.photo.findMany({
        where: { cloneBatchId: id }
      })

      if (batchPhotos.length > 0) {
        for (const plant of plants) {
          for (const photo of batchPhotos) {
            await tx.photo.create({
              data: {
                plantId: plant.id,
                userId: photo.userId,
                storagePath: photo.storagePath,
                thumbnailPath: photo.thumbnailPath,
                originalFilename: photo.originalFilename,
                url: photo.url,
                thumbnailUrl: photo.thumbnailUrl,
                dateTaken: photo.dateTaken,
                growthStage: photo.growthStage,
                photoType: photo.photoType,
                photoContext: photo.photoContext,
                metadata: photo.metadata,
                aiAnalysis: photo.aiAnalysis,
                notes: photo.notes
                  ? `[Batch ${cloneBatch.batchId}] ${photo.notes}`
                  : `[Batch ${cloneBatch.batchId}]`,
              }
            })
          }
        }
      }

      // Update batch status within the same transaction
      await tx.cloneBatch.update({
        where: { id },
        data: { status: newStatus }
      })

      return { plants, careLogsCopied: batchCareLogs.length, photosCopied: batchPhotos.length }
    })

    return NextResponse.json({
      success: true,
      graduated: count,
      plants: createdPlants.plants.map(p => ({
        id: p.id,
        plantId: p.plantId,
        hybridName: p.hybridName,
        propagationType: p.propagationType
      })),
      transferred: {
        careLogsPerPlant: createdPlants.careLogsCopied,
        photosPerPlant: createdPlants.photosCopied
      },
      batch: {
        id: cloneBatch.id,
        batchId: cloneBatch.batchId,
        status: newStatus,
        remaining: totalCount - newGraduatedCount
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error graduating from clone batch:', error)
    return NextResponse.json(
      { error: 'Failed to graduate from clone batch' },
      { status: 500 }
    )
  }
}
