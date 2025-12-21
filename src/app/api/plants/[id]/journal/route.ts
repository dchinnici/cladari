import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/plants/[id]/journal - Get all journal entries for a plant
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const entryType = searchParams.get('entryType')
    const contextFilter = searchParams.get('context')

    const where: any = { plantId: params.id }
    if (entryType) where.entryType = entryType
    if (contextFilter) where.context = contextFilter

    const entries = await prisma.plantJournal.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.plantJournal.count({ where })

    return NextResponse.json({
      entries,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    )
  }
}

// POST /api/plants/[id]/journal - Create a new journal entry
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // Verify plant exists
    const plant = await prisma.plant.findUnique({
      where: { id: params.id }
    })

    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      )
    }

    const entry = await prisma.plantJournal.create({
      data: {
        plantId: params.id,
        entry: body.entry,
        entryType: body.entryType || 'manual',
        context: body.context,
        referenceId: body.referenceId,
        referenceType: body.referenceType,
        author: body.author || 'user',
        tags: body.tags ? JSON.stringify(body.tags) : '[]',
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    )
  }
}

// PATCH /api/plants/[id]/journal - Update a journal entry
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { entryId, ...updateData } = body

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      )
    }

    // If tags are provided, stringify them
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags)
    }

    const updated = await prisma.plantJournal.update({
      where: { id: entryId },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to update journal entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/plants/[id]/journal - Delete a journal entry
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID required' },
        { status: 400 }
      )
    }

    await prisma.plantJournal.delete({
      where: { id: entryId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete journal entry' },
      { status: 500 }
    )
  }
}