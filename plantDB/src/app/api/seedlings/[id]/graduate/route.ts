import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generatePlantId } from '@/lib/breeding-ids'

/**
 * POST /api/seedlings/[id]/graduate
 *
 * Graduates a seedling to the Plant table.
 * This is the key workflow that transitions a seedling to a full Plant record.
 *
 * The new Plant will have:
 * - femaleParentId/maleParentId from the breeding record
 * - breedingRecordId linking to the cross
 * - seedlingOrigin back-reference
 * - propagationType = 'seed'
 * - generation (if provided, otherwise inferred as F1)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Fetch seedling with full lineage
    const seedling = await prisma.seedling.findUnique({
      where: { id },
      include: {
        seedBatch: {
          include: {
            harvest: {
              include: {
                breedingRecord: {
                  include: {
                    femalePlant: true,
                    malePlant: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!seedling) {
      return NextResponse.json({ error: 'Seedling not found' }, { status: 404 })
    }

    // Check not already graduated
    if (seedling.graduatedToPlantId) {
      return NextResponse.json(
        { error: 'Seedling already graduated', plantId: seedling.graduatedToPlantId },
        { status: 409 }
      )
    }

    // Only KEEPER or HOLDBACK can graduate
    if (!['KEEPER', 'HOLDBACK'].includes(seedling.selectionStatus)) {
      return NextResponse.json(
        {
          error: `Seedling must be KEEPER or HOLDBACK to graduate (current: ${seedling.selectionStatus})`,
          hint: 'Update selectionStatus first'
        },
        { status: 400 }
      )
    }

    const breedingRecord = seedling.seedBatch.harvest.breedingRecord
    const femalePlant = breedingRecord.femalePlant
    const malePlant = breedingRecord.malePlant

    // Generate plant ID
    const plantId = body.plantId || await generatePlantId()

    // Check for duplicate
    const existingPlant = await prisma.plant.findUnique({ where: { plantId } })
    if (existingPlant) {
      return NextResponse.json(
        { error: `PlantId ${plantId} already exists` },
        { status: 409 }
      )
    }

    // Build hybrid name from parents if not provided
    let hybridName = body.hybridName
    if (!hybridName) {
      const femaleName = femalePlant.hybridName || femalePlant.species || 'Unknown'
      const maleName = malePlant.hybridName || malePlant.species || 'Unknown'
      hybridName = `${femaleName} × ${maleName}`
    }

    // Determine generation
    let generation = body.generation || 'F1'
    // If both parents are from same cross, it's F2
    if (femalePlant.breedingRecordId && femalePlant.breedingRecordId === malePlant.breedingRecordId) {
      generation = body.generation || 'F2'
    }
    // If self-pollinated (same plant), it's S1
    if (femalePlant.id === malePlant.id) {
      generation = body.generation || 'S1'
    }

    // Create the Plant record
    const plant = await prisma.plant.create({
      data: {
        plantId,
        accessionDate: body.accessionDate ? new Date(body.accessionDate) : new Date(),
        genus: 'Anthurium',
        section: body.section || femalePlant.section || malePlant.section || null,
        species: body.species || null,
        hybridName,
        crossNotation: body.crossNotation || null,
        generation,
        femaleParentId: femalePlant.id,
        maleParentId: malePlant.id,
        breedingRecordId: breedingRecord.id,
        propagationType: 'seed',
        healthStatus: body.healthStatus || seedling.healthStatus.toLowerCase() || 'healthy',
        currentPotSize: seedling.potSize || body.potSize || null,
        locationId: seedling.locationId || body.locationId || null,
        notes: body.notes || `Graduated from ${seedling.seedlingId}. ${seedling.selectionNotes || ''}`.trim(),
        tags: JSON.stringify(body.tags || [])
      }
    })

    // Update seedling to link to graduated plant
    await prisma.seedling.update({
      where: { id },
      data: {
        graduatedToPlantId: plant.id,
        graduationDate: new Date(),
        selectionStatus: 'GRADUATED'
      }
    })

    // Update breeding record summary
    const graduatedCount = await prisma.plant.count({
      where: { breedingRecordId: breedingRecord.id }
    })
    await prisma.breedingRecord.update({
      where: { id: breedingRecord.id },
      data: { f1PlantsRaised: graduatedCount }
    })

    return NextResponse.json({
      success: true,
      seedling: {
        id: seedling.id,
        seedlingId: seedling.seedlingId,
        selectionStatus: 'GRADUATED'
      },
      plant: {
        id: plant.id,
        plantId: plant.plantId,
        hybridName: plant.hybridName,
        generation: plant.generation,
        femaleParent: femalePlant.plantId,
        maleParent: malePlant.plantId
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error graduating seedling:', error)
    return NextResponse.json(
      { error: 'Failed to graduate seedling' },
      { status: 500 }
    )
  }
}
