import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

/**
 * GET /api/taxa/[species]
 *
 * Get full details for a single species.
 * Returns all morphological data, descriptions, and related species.
 *
 * Example: GET /api/taxa/papillilaminum
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ species: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { species } = await context.params

  try {
    // Get the species reference
    const taxon = await prisma.taxonReference.findFirst({
      where: {
        species: { equals: species.toLowerCase(), mode: 'insensitive' }
      }
    })

    if (!taxon) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      )
    }

    // Get related species if mentioned
    let relatedTaxa: any[] = []
    if (taxon.relatedSpecies && Array.isArray(taxon.relatedSpecies)) {
      const relatedNames = (taxon.relatedSpecies as any[]).map(r => r.species)
      relatedTaxa = await prisma.taxonReference.findMany({
        where: {
          species: { in: relatedNames }
        },
        select: {
          id: true,
          species: true,
          section: true,
          diagnosticTraits: true,
          bladeLength: true,
          bladeWidth: true,
          sourceUrl: true
        }
      })
    }

    // Get plants in collection that match this species
    const matchingPlants = await prisma.plant.findMany({
      where: {
        species: { contains: species, mode: 'insensitive' },
        userId: user.id
      },
      select: {
        id: true,
        plantId: true,
        species: true,
        hybridName: true,
        healthStatus: true
      },
      take: 10
    })

    return NextResponse.json({
      taxon,
      relatedTaxa,
      matchingPlants,
      metadata: {
        hasFullDescription: !!taxon.fullDescription,
        hasMeasurements: !!(taxon.bladeLength || taxon.spadixLength),
        hasImages: Array.isArray(taxon.images) && taxon.images.length > 0
      }
    })
  } catch (error) {
    console.error('Error fetching taxon:', error)
    return NextResponse.json(
      { error: 'Failed to fetch taxon' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/taxa/[species]
 *
 * Update verification status or add notes.
 * Used for HITL verification workflow.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ species: string }> }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { species } = await context.params
  const body = await request.json()

  const { verificationStatus, notes } = body

  try {
    const taxon = await prisma.taxonReference.findFirst({
      where: {
        species: { equals: species.toLowerCase(), mode: 'insensitive' }
      }
    })

    if (!taxon) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.taxonReference.update({
      where: { id: taxon.id },
      data: {
        verificationStatus: verificationStatus || taxon.verificationStatus,
        notes: notes !== undefined ? notes : taxon.notes,
        verifiedBy: verificationStatus ? user.id : taxon.verifiedBy,
        verifiedDate: verificationStatus ? new Date() : taxon.verifiedDate
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating taxon:', error)
    return NextResponse.json(
      { error: 'Failed to update taxon' },
      { status: 500 }
    )
  }
}
