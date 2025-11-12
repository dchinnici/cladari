import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { plantIds, activityType, notes, dosage, inputEC, inputPH, outputEC, outputPH, rainAmount, rainDuration, date } = body

    if (!plantIds || !Array.isArray(plantIds) || plantIds.length === 0) {
      return NextResponse.json(
        { error: 'No plants selected' },
        { status: 400 }
      )
    }

    // Build details JSON with EC/pH data, rain data, and notes
    const detailsObj: any = {}
    if (notes) detailsObj.notes = notes
    if (inputEC) detailsObj.inputEC = parseFloat(inputEC)
    if (inputPH) detailsObj.inputPH = parseFloat(inputPH)
    if (outputEC) detailsObj.outputEC = parseFloat(outputEC)
    if (outputPH) detailsObj.outputPH = parseFloat(outputPH)
    if (rainAmount) detailsObj.rainAmount = rainAmount
    if (rainDuration) detailsObj.rainDuration = rainDuration
    // Repotting substrate details
    if (body.substrateType) detailsObj.substrateType = body.substrateType
    if (body.drainageType) detailsObj.drainageType = body.drainageType
    if (body.substrateMix) detailsObj.substrateMix = body.substrateMix

    // Create care logs for all selected plants
    const careLogs = await prisma.careLog.createMany({
      data: plantIds.map(plantId => ({
        plantId,
        date: date ? new Date(date + 'T12:00:00') : new Date(),
        action: activityType,
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
