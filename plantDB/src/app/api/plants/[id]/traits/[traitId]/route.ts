import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH: Edit existing morphology observation (for corrections/completion)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; traitId: string }> }
) {
  try {
    const params = await context.params
    const body = await request.json()

    // Update the specific trait observation
    const updatedTrait = await prisma.trait.update({
      where: { id: params.traitId },
      data: {
        value: body.value,
        notes: body.notes,
        observationDate: body.observationDate ? new Date(body.observationDate + 'T00:00:00.000Z') : undefined,
      }
    })

    return NextResponse.json(updatedTrait)
  } catch (error) {
    console.error('Error updating trait:', error)
    return NextResponse.json(
      { error: 'Failed to update trait' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a trait observation (if entered in error)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; traitId: string }> }
) {
  try {
    const params = await context.params

    await prisma.trait.delete({
      where: { id: params.traitId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trait:', error)
    return NextResponse.json(
      { error: 'Failed to delete trait' },
      { status: 500 }
    )
  }
}
