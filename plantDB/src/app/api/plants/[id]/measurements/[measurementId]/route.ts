import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH: Update existing measurement
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; measurementId: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    const updatedMeasurement = await prisma.measurement.update({
      where: { id: params.measurementId },
      data: {
        measurementDate: body.measurementDate ? new Date(body.measurementDate + 'T12:00:00') : undefined,
        leafLength: body.leafLength !== undefined ? (body.leafLength ? parseFloat(body.leafLength) : null) : undefined,
        leafWidth: body.leafWidth !== undefined ? (body.leafWidth ? parseFloat(body.leafWidth) : null) : undefined,
        petioleLength: body.petioleLength !== undefined ? (body.petioleLength ? parseFloat(body.petioleLength) : null) : undefined,
        internodeLength: body.internodeLength !== undefined ? (body.internodeLength ? parseFloat(body.internodeLength) : null) : undefined,
        leafCount: body.leafCount !== undefined ? (body.leafCount ? parseInt(body.leafCount) : null) : undefined,
        height: body.height !== undefined ? (body.height ? parseFloat(body.height) : null) : undefined,
        vigorScore: body.vigorScore !== undefined ? (body.vigorScore ? parseInt(body.vigorScore) : null) : undefined,
        ecValue: body.ecValue !== undefined ? (body.ecValue ? parseFloat(body.ecValue) : null) : undefined,
        phValue: body.phValue !== undefined ? (body.phValue ? parseFloat(body.phValue) : null) : undefined,
        tdsValue: body.tdsValue !== undefined ? (body.tdsValue ? parseInt(body.tdsValue) : null) : undefined,
        texture: body.texture !== undefined ? (body.texture || null) : undefined,
        notes: body.notes !== undefined ? (body.notes || null) : undefined,
      }
    })

    return NextResponse.json(updatedMeasurement)
  } catch (error) {
    console.error('Error updating measurement:', error)
    return NextResponse.json(
      { error: 'Failed to update measurement' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a measurement
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; measurementId: string }> }
) {
  try {
    const params = await context.params

    await prisma.measurement.delete({
      where: { id: params.measurementId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting measurement:', error)
    return NextResponse.json(
      { error: 'Failed to delete measurement' },
      { status: 500 }
    )
  }
}
