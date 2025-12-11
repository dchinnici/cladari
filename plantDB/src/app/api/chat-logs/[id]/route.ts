import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/chat-logs/[id] - Get a single chat log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const chatLog = await prisma.chatLog.findUnique({
      where: { id },
      include: {
        plant: {
          select: { id: true, plantId: true, hybridName: true, species: true }
        }
      }
    })

    if (!chatLog) {
      return NextResponse.json({ error: 'Chat log not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...chatLog,
      messages: JSON.parse(chatLog.messages),
      userEdits: chatLog.userEdits ? JSON.parse(chatLog.userEdits) : null,
    })
  } catch (error) {
    console.error('Error fetching chat log:', error)
    return NextResponse.json({ error: 'Failed to fetch chat log' }, { status: 500 })
  }
}

// PATCH /api/chat-logs/[id] - Update a chat log (title, confidence, messages, userEdits)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, confidence, messages, userEdits } = body

    // Verify chat log exists
    const existing = await prisma.chatLog.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Chat log not found' }, { status: 404 })
    }

    // Build update data
    const updateData: {
      title?: string
      confidence?: string
      messages?: string
      userEdits?: string
    } = {}

    if (title !== undefined) updateData.title = title
    if (confidence !== undefined) {
      // Validate confidence value
      const validConfidence = ['unverified', 'verified', 'partially_verified', 'disputed']
      if (!validConfidence.includes(confidence)) {
        return NextResponse.json(
          { error: `confidence must be one of: ${validConfidence.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.confidence = confidence
    }
    if (messages !== undefined) {
      if (!Array.isArray(messages)) {
        return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
      }
      updateData.messages = JSON.stringify(messages)
    }
    if (userEdits !== undefined) {
      updateData.userEdits = JSON.stringify(userEdits)
    }

    const chatLog = await prisma.chatLog.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...chatLog,
      messages: JSON.parse(chatLog.messages),
      userEdits: chatLog.userEdits ? JSON.parse(chatLog.userEdits) : null,
    })
  } catch (error) {
    console.error('Error updating chat log:', error)
    return NextResponse.json({ error: 'Failed to update chat log' }, { status: 500 })
  }
}

// DELETE /api/chat-logs/[id] - Delete a chat log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify chat log exists
    const existing = await prisma.chatLog.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Chat log not found' }, { status: 404 })
    }

    await prisma.chatLog.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat log:', error)
    return NextResponse.json({ error: 'Failed to delete chat log' }, { status: 500 })
  }
}
