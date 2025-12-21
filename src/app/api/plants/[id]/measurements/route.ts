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
        leafLength: body.leafLength ? parseFloat(body.leafLength) : null,
        leafWidth: body.leafWidth ? parseFloat(body.leafWidth) : null,
        petioleLength: body.petioleLength ? parseFloat(body.petioleLength) : null,
        internodeLength: body.internodeLength ? parseFloat(body.internodeLength) : null,
        leafCount: body.leafCount ? parseInt(body.leafCount) : null,
        height: body.height ? parseFloat(body.height) : null,
        vigorScore: body.vigorScore ? parseInt(body.vigorScore) : null,
        texture: body.texture || null,
        notes: body.notes || null
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