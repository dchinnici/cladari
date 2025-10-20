import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET: Retrieve all flowering cycles for a plant
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params

    const cycles = await prisma.floweringCycle.findMany({
      where: { plantId: params.id },
      orderBy: { spatheEmergence: 'desc' }
    })

    return NextResponse.json(cycles)
  } catch (error) {
    console.error('Error fetching flowering cycles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flowering cycles' },
      { status: 500 }
    )
  }
}

// POST: Create new flowering cycle or log fertility event
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // If cycleId provided, update existing cycle; otherwise create new
    if (body.cycleId) {
      // Update existing cycle
      const updatedCycle = await prisma.floweringCycle.update({
        where: { id: body.cycleId },
        data: {
          spatheEmergence: body.spatheEmergence ? new Date(body.spatheEmergence) : undefined,
          femaleStart: body.femaleStart ? new Date(body.femaleStart) : undefined,
          femaleEnd: body.femaleEnd ? new Date(body.femaleEnd) : undefined,
          maleStart: body.maleStart ? new Date(body.maleStart) : undefined,
          maleEnd: body.maleEnd ? new Date(body.maleEnd) : undefined,
          spatheClose: body.spatheClose ? new Date(body.spatheClose) : undefined,
          pollenCollected: body.pollenCollected,
          pollenQuality: body.pollenQuality,
          pollenStored: body.pollenStored,
          pollenStorageDate: body.pollenStorageDate ? new Date(body.pollenStorageDate) : undefined,
          temperature: body.temperature,
          humidity: body.humidity,
          notes: body.notes,
        }
      })

      return NextResponse.json(updatedCycle)
    } else {
      // Create new cycle
      const newCycle = await prisma.floweringCycle.create({
        data: {
          plantId: params.id,
          spatheEmergence: body.spatheEmergence ? new Date(body.spatheEmergence) : new Date(),
          femaleStart: body.femaleStart ? new Date(body.femaleStart) : undefined,
          femaleEnd: body.femaleEnd ? new Date(body.femaleEnd) : undefined,
          maleStart: body.maleStart ? new Date(body.maleStart) : undefined,
          maleEnd: body.maleEnd ? new Date(body.maleEnd) : undefined,
          spatheClose: body.spatheClose ? new Date(body.spatheClose) : undefined,
          pollenCollected: body.pollenCollected || false,
          pollenQuality: body.pollenQuality,
          pollenStored: body.pollenStored || false,
          pollenStorageDate: body.pollenStorageDate ? new Date(body.pollenStorageDate) : undefined,
          temperature: body.temperature,
          humidity: body.humidity,
          notes: body.notes,
        }
      })

      return NextResponse.json(newCycle)
    }
  } catch (error) {
    console.error('Error creating/updating flowering cycle:', error)
    return NextResponse.json(
      { error: 'Failed to save flowering cycle' },
      { status: 500 }
    )
  }
}
