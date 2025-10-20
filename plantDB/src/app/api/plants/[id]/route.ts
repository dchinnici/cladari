import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const plant = await prisma.plant.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        currentLocation: true,
        genetics: true,
        traits: true,
        photos: true,
        careLogs: {
          orderBy: { date: 'desc' }
        },
        measurements: {
          orderBy: { measurementDate: 'desc' }
        },
        femaleBreedings: {
          include: {
            malePlant: true
          }
        },
        maleBreedings: {
          include: {
            femalePlant: true
          }
        }
      }
    })

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(plant)
  } catch (error) {
    console.error('Error fetching plant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plant' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    const plant = await prisma.plant.update({
      where: { id: params.id },
      data: body
    })

    return NextResponse.json(plant)
  } catch (error) {
    console.error('Error updating plant:', error)
    return NextResponse.json(
      { error: 'Failed to update plant' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    // Delete plant and all related records (Prisma cascade will handle relations)
    await prisma.plant.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Plant deleted successfully' })
  } catch (error) {
    console.error('Error deleting plant:', error)
    return NextResponse.json(
      { error: 'Failed to delete plant' },
      { status: 500 }
    )
  }
}