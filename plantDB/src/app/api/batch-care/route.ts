import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      plantIds,
      activityType,
      notes,
      dosage,
      inputEC,
      inputPH,
      outputEC,
      outputPH,
      rainAmount,
      rainDuration,
      date,
      isBaselineFeed,
      // Component tracking
      useCaMg,
      caMgDose,
      useTpsOne,
      tpsOneDose,
      useSilica,
      silicaDose
    } = body

    if (!plantIds || !Array.isArray(plantIds) || plantIds.length === 0) {
      return NextResponse.json(
        { error: 'No plants selected' },
        { status: 400 }
      )
    }

    // Verify ALL plants belong to this user (prevents cross-user care logging)
    const ownedPlants = await prisma.plant.findMany({
      where: {
        id: { in: plantIds },
        userId: user.id
      },
      select: { id: true }
    })

    const ownedIds = new Set(ownedPlants.map(p => p.id))
    const unauthorizedIds = plantIds.filter((id: string) => !ownedIds.has(id))

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: `Access denied to ${unauthorizedIds.length} plant(s)` },
        { status: 403 }
      )
    }

    // Build feed components array for ML analysis
    const feedComponents: { product: string; mlPerLiter: number }[] = []
    if (useCaMg && caMgDose) {
      feedComponents.push({ product: 'TPS CalMag', mlPerLiter: parseFloat(caMgDose) })
    }
    if (useTpsOne && tpsOneDose) {
      feedComponents.push({ product: 'TPS One', mlPerLiter: parseFloat(tpsOneDose) })
    }
    if (useSilica && silicaDose) {
      feedComponents.push({ product: 'TPS Silica', mlPerLiter: parseFloat(silicaDose) })
    }

    // Build details JSON for non-structured data (rain, substrate, notes)
    const detailsObj: Record<string, unknown> = {}
    if (notes) detailsObj.notes = notes
    if (rainAmount) detailsObj.rainAmount = rainAmount
    if (rainDuration) detailsObj.rainDuration = rainDuration
    // Repotting substrate details
    if (body.substrateType) detailsObj.substrateType = body.substrateType
    if (body.drainageType) detailsObj.drainageType = body.drainageType
    if (body.substrateMix) detailsObj.substrateMix = body.substrateMix

    // Create care logs for all selected plants
    const careLogs = await prisma.careLog.createMany({
      data: plantIds.map((plantId: string) => ({
        plantId,
        date: date ? new Date(date + 'T12:00:00') : new Date(),
        action: activityType,
        // Structured EC/pH fields (for ML)
        inputEC: inputEC ? parseFloat(inputEC) : null,
        inputPH: inputPH ? parseFloat(inputPH) : null,
        outputEC: outputEC ? parseFloat(outputEC) : null,
        outputPH: outputPH ? parseFloat(outputPH) : null,
        isBaselineFeed: isBaselineFeed || false,
        feedComponents: feedComponents.length > 0 ? JSON.stringify(feedComponents) : null,
        // Legacy/additional details
        details: Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null,
        dosage: dosage ? parseFloat(dosage.replace(/[^0-9.]/g, '')) : null,
        unit: dosage ? dosage.replace(/[0-9.]/g, '').trim() || 'ml' : null
      }))
    })

    return NextResponse.json({
      success: true,
      count: careLogs.count,
      message: `Successfully added care logs to ${careLogs.count} plants`
    })
  } catch (error) {
    console.error('Error creating batch care logs:', error)
    return NextResponse.json(
      { error: 'Failed to create batch care logs' },
      { status: 500 }
    )
  }
}
