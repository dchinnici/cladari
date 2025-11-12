import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // Build details JSON with EC/pH data, pest discovery, and notes
    const detailsObj: any = {}
    if (body.notes) detailsObj.notes = body.notes
    if (body.inputEC) detailsObj.inputEC = parseFloat(body.inputEC)
    if (body.inputPH) detailsObj.inputPH = parseFloat(body.inputPH)
    if (body.outputEC) detailsObj.outputEC = parseFloat(body.outputEC)
    if (body.outputPH) detailsObj.outputPH = parseFloat(body.outputPH)
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
        details: Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null,
        dosage: body.dosage ? parseFloat(String(body.dosage).replace(/[^0-9.]/g, '')) : null,
        unit: body.dosage ? String(body.dosage).replace(/[0-9.]/g, '').trim() || 'ml' : null
      }
    })

    // Auto-create journal entry for care log
    const journalEntry = []
    journalEntry.push(body.activityType)

    if (body.dosage) {
      journalEntry.push(`(${body.dosage})`)
    }

    if (detailsObj.notes) {
      journalEntry.push(`- ${detailsObj.notes}`)
    }

    if (detailsObj.inputEC || detailsObj.inputPH) {
      const metrics = []
      if (detailsObj.inputEC) metrics.push(`EC in: ${detailsObj.inputEC}`)
      if (detailsObj.inputPH) metrics.push(`pH in: ${detailsObj.inputPH}`)
      journalEntry.push(`[${metrics.join(', ')}]`)
    }

    if (detailsObj.outputEC || detailsObj.outputPH) {
      const metrics = []
      if (detailsObj.outputEC) metrics.push(`EC out: ${detailsObj.outputEC}`)
      if (detailsObj.outputPH) metrics.push(`pH out: ${detailsObj.outputPH}`)
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
