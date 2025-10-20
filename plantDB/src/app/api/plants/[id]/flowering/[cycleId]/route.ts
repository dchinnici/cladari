import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Retrieve specific flowering cycle
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; cycleId: string }> }
) {
  try {
    const params = await context.params

    const cycle = await prisma.floweringCycle.findUnique({
      where: { id: params.cycleId }
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Flowering cycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(cycle)
  } catch (error) {
    console.error('Error fetching flowering cycle:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flowering cycle' },
      { status: 500 }
    )
  }
}

// PATCH: Update flowering cycle (for stage progression or corrections)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; cycleId: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    const updatedCycle = await prisma.floweringCycle.update({
      where: { id: params.cycleId },
      data: {
        spatheEmergence: body.spatheEmergence ? new Date(body.spatheEmergence) : undefined,
        femaleStart: body.femaleStart ? new Date(body.femaleStart) : undefined,
        femaleEnd: body.femaleEnd ? new Date(body.femaleEnd) : undefined,
        maleStart: body.maleStart ? new Date(body.maleStart) : undefined,
        maleEnd: body.maleEnd ? new Date(body.maleEnd) : undefined,
        spatheClose: body.spatheClose ? new Date(body.spatheClose) : undefined,
        pollenCollected: body.pollenCollected !== undefined ? body.pollenCollected : undefined,
        pollenQuality: body.pollenQuality,
        pollenStored: body.pollenStored !== undefined ? body.pollenStored : undefined,
        pollenStorageDate: body.pollenStorageDate ? new Date(body.pollenStorageDate) : undefined,
        crossesAttempted: body.crossesAttempted,
        seedsProduced: body.seedsProduced,
        temperature: body.temperature,
        humidity: body.humidity,
        notes: body.notes,
      }
    })

    return NextResponse.json(updatedCycle)
  } catch (error) {
    console.error('Error updating flowering cycle:', error)
    return NextResponse.json(
      { error: 'Failed to update flowering cycle' },
      { status: 500 }
    )
  }
}

// DELETE: Remove flowering cycle (if logged in error)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; cycleId: string }> }
) {
  try {
    const params = await context.params

    await prisma.floweringCycle.delete({
      where: { id: params.cycleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flowering cycle:', error)
    return NextResponse.json(
      { error: 'Failed to delete flowering cycle' },
      { status: 500 }
    )
  }
}
