import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; logId: string }> }
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

    const careLog = await prisma.careLog.update({
      where: { id: params.logId },
      data: {
        date: body.date ? new Date(body.date + 'T00:00:00.000Z') : undefined,
        action: body.activityType || undefined,
        details: Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : undefined,
        dosage: body.dosage ? parseFloat(String(body.dosage).replace(/[^0-9.]/g, '')) : undefined,
        unit: body.dosage ? String(body.dosage).replace(/[0-9.]/g, '').trim() || 'ml' : undefined
      }
    })

    return NextResponse.json(careLog)
  } catch (error) {
    console.error('Error updating care log:', error)
    return NextResponse.json(
      { error: 'Failed to update care log' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const params = await context.params

    // Delete the care log
    await prisma.careLog.delete({
      where: { id: params.logId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting care log:', error)
    return NextResponse.json(
      { error: 'Failed to delete care log' },
      { status: 500 }
    )
  }
}
