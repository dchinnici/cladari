import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params

    // Verify plant ownership
    const plant = await prisma.plant.findFirst({
      where: { id: params.id, userId: user.id }
    })
    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    const body = await request.json()

    // Build details JSON for non-EC/pH data (notes, pest discovery, substrate)
    const detailsObj: any = {}
    if (body.notes) detailsObj.notes = body.notes
    // Pest/disease discovery fields
    if (body.pestType) detailsObj.pestType = body.pestType
    if (body.severity) detailsObj.severity = body.severity
    if (body.affectedArea) detailsObj.affectedArea = body.affectedArea
    // Repotting substrate details
    if (body.substrateType) detailsObj.substrateType = body.substrateType
    if (body.drainageType) detailsObj.drainageType = body.drainageType
    if (body.substrateMix) detailsObj.substrateMix = body.substrateMix

    const careLog = await prisma.careLog.create({
      data: {
        plantId: params.id,
        date: body.date ? new Date(body.date + 'T12:00:00') : new Date(),
        action: body.activityType, // Map activityType to action field
        // EC/pH in structured columns (for ML analysis)
        inputEC: body.inputEC ? parseFloat(body.inputEC) : null,
        inputPH: body.inputPH ? parseFloat(body.inputPH) : null,
        outputEC: body.outputEC ? parseFloat(body.outputEC) : null,
        outputPH: body.outputPH ? parseFloat(body.outputPH) : null,
        // Other details in JSON
        details: Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null,
        dosage: body.dosage ? parseFloat(String(body.dosage).replace(/[^0-9.]/g, '')) : null,
        unit: body.dosage ? String(body.dosage).replace(/[0-9.]/g, '').trim() || 'ml' : null
      }
    })

    // Store EC/pH values for journal entry (from body, not detailsObj)
    const inputEC = body.inputEC ? parseFloat(body.inputEC) : null
    const inputPH = body.inputPH ? parseFloat(body.inputPH) : null
    const outputEC = body.outputEC ? parseFloat(body.outputEC) : null
    const outputPH = body.outputPH ? parseFloat(body.outputPH) : null

    // Auto-create journal entry for care log
    const journalEntry = []
    journalEntry.push(body.activityType)

    if (body.dosage) {
      journalEntry.push(`(${body.dosage})`)
    }

    if (detailsObj.notes) {
      journalEntry.push(`- ${detailsObj.notes}`)
    }

    if (inputEC || inputPH) {
      const metrics = []
      if (inputEC) metrics.push(`EC in: ${inputEC}`)
      if (inputPH) metrics.push(`pH in: ${inputPH}`)
      journalEntry.push(`[${metrics.join(', ')}]`)
    }

    if (outputEC || outputPH) {
      const metrics = []
      if (outputEC) metrics.push(`EC out: ${outputEC}`)
      if (outputPH) metrics.push(`pH out: ${outputPH}`)
      journalEntry.push(`[Runoff: ${metrics.join(', ')}]`)
    }

    if (detailsObj.pestType) {
      journalEntry.push(`⚠️ Pest discovered: ${detailsObj.pestType} (${detailsObj.severity || 'unknown'} severity)`)
    }

    // Add substrate details for repotting
    if (body.activityType === 'repotting' && (detailsObj.substrateType || detailsObj.drainageType || detailsObj.substrateMix)) {
      const substrateDetails = []
      if (detailsObj.substrateType) substrateDetails.push(detailsObj.substrateType)
      if (detailsObj.drainageType) substrateDetails.push(detailsObj.drainageType)
      if (detailsObj.substrateMix) substrateDetails.push(`(${detailsObj.substrateMix})`)
      journalEntry.push(`🌱 Substrate: ${substrateDetails.join(', ')}`)
    }

    await prisma.plantJournal.create({
      data: {
        plantId: params.id,
        entry: journalEntry.join(' '),
        entryType: 'care',
        context: 'care_logs',
        referenceId: careLog.id,
        referenceType: 'CareLog',
        author: 'system',
        timestamp: careLog.date
      }
    })

    return NextResponse.json(careLog)
  } catch (error) {
    console.error('Error creating care log:', error)
    return NextResponse.json(
      { error: 'Failed to create care log' },
      { status: 500 }
    )
  }
}
