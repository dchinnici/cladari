import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    const measurement = await prisma.measurement.create({
      data: {
        plantId: params.id,
        measurementDate: body.measurementDate ? new Date(body.measurementDate + 'T00:00:00.000Z') : new Date(),
        ecValue: body.ecValue ? parseFloat(body.ecValue) : null,
        phValue: body.phValue ? parseFloat(body.phValue) : null,
        tdsValue: body.tdsValue ? parseInt(body.tdsValue) : null,
        notes: body.notes || null,
        measurementType: body.measurementType || 'routine'
      }
    })

    return NextResponse.json(measurement)
  } catch (error) {
    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}