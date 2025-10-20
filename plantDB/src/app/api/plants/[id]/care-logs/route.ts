import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // Build details JSON with EC/pH data and notes
    const detailsObj: any = {}
    if (body.notes) detailsObj.notes = body.notes
    if (body.inputEC) detailsObj.inputEC = parseFloat(body.inputEC)
    if (body.inputPH) detailsObj.inputPH = parseFloat(body.inputPH)
    if (body.outputEC) detailsObj.outputEC = parseFloat(body.outputEC)
    if (body.outputPH) detailsObj.outputPH = parseFloat(body.outputPH)

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

    return NextResponse.json(careLog)
  } catch (error) {
    console.error('Error creating care log:', error)
    return NextResponse.json(
      { error: 'Failed to create care log' },
      { status: 500 }
    )
  }
}
