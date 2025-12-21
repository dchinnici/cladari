import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/clone-batches/[id]/care-logs - List care logs for a batch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify batch exists
    const batch = await prisma.cloneBatch.findUnique({ where: { id } })
    if (!batch) {
      return NextResponse.json({ error: 'Clone batch not found' }, { status: 404 })
    }

    const careLogs = await prisma.careLog.findMany({
      where: { cloneBatchId: id },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        action: true,
        inputEC: true,
        inputPH: true,
        outputEC: true,
        outputPH: true,
        isBaselineFeed: true,
        feedComponents: true,
        dosage: true,
        unit: true,
        details: true,
        createdAt: true
      }
    })

    return NextResponse.json(careLogs)
  } catch (error) {
    console.error('Error fetching batch care logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch care logs' },
      { status: 500 }
    )
  }
}

// POST /api/clone-batches/[id]/care-logs - Create care log for a batch
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify batch exists
    const batch = await prisma.cloneBatch.findUnique({ where: { id } })
    if (!batch) {
      return NextResponse.json({ error: 'Clone batch not found' }, { status: 404 })
    }

    // Build details JSON for notes
    const detailsObj: any = {}
    if (body.notes) detailsObj.notes = body.notes

    const careLog = await prisma.careLog.create({
      data: {
        cloneBatchId: id,
        date: body.date ? new Date(body.date + 'T00:00:00.000Z') : new Date(),
        action: body.action || body.activityType || 'watering',
        // EC/pH in structured columns
        inputEC: body.inputEC ? parseFloat(body.inputEC) : null,
        inputPH: body.inputPH ? parseFloat(body.inputPH) : null,
        outputEC: body.outputEC ? parseFloat(body.outputEC) : null,
        outputPH: body.outputPH ? parseFloat(body.outputPH) : null,
        // Feed tracking
        isBaselineFeed: body.isBaselineFeed || false,
        feedComponents: body.feedComponents ? JSON.stringify(body.feedComponents) : null,
        // Other details in JSON
        details: Object.keys(detailsObj).length > 0 ? JSON.stringify(detailsObj) : null,
        dosage: body.dosage ? parseFloat(String(body.dosage).replace(/[^0-9.]/g, '')) : null,
        unit: body.dosage ? String(body.dosage).replace(/[0-9.]/g, '').trim() || 'ml' : null
      }
    })

    return NextResponse.json(careLog, { status: 201 })
  } catch (error) {
    console.error('Error creating batch care log:', error)
    return NextResponse.json(
      { error: 'Failed to create care log' },
      { status: 500 }
    )
  }
}
