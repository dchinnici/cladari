import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/chat-logs?plantId=xxx - Get all chat logs for a plant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plantId = searchParams.get('plantId')

    if (!plantId) {
      return NextResponse.json({ error: 'plantId is required' }, { status: 400 })
    }

    const chatLogs = await prisma.chatLog.findMany({
      where: { plantId },
      orderBy: { conversationDate: 'desc' },
      select: {
        id: true,
        title: true,
        messages: true,
        confidence: true,
        userEdits: true,
        savedAt: true,
        conversationDate: true,
      }
    })

    // Parse messages JSON for each log
    const parsed = chatLogs.map(log => ({
      ...log,
      messages: JSON.parse(log.messages),
      userEdits: log.userEdits ? JSON.parse(log.userEdits) : null,
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error fetching chat logs:', error)
    return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
  }
}

// POST /api/chat-logs - Save a new chat conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plantId, title, messages, conversationDate } = body

    if (!plantId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'plantId and messages array are required' },
        { status: 400 }
      )
    }

    // Verify plant exists
    const plant = await prisma.plant.findUnique({
      where: { id: plantId },
      select: { id: true, plantId: true }
    })

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
    }

    // Generate title from first user message if not provided
    const autoTitle = title || (() => {
      const firstUserMsg = messages.find((m: { role: string }) => m.role === 'user')
      if (firstUserMsg) {
        const content = firstUserMsg.content as string
        return content.length > 60 ? content.slice(0, 57) + '...' : content
      }
      return 'AI Consultation'
    })()

    const chatLog = await prisma.chatLog.create({
      data: {
        plantId,
        title: autoTitle,
        messages: JSON.stringify(messages),
        confidence: 'unverified',
        conversationDate: conversationDate ? new Date(conversationDate) : new Date(),
      }
    })

    return NextResponse.json({
      id: chatLog.id,
      title: chatLog.title,
      messages: messages,
      confidence: chatLog.confidence,
      savedAt: chatLog.savedAt,
      conversationDate: chatLog.conversationDate,
    })
  } catch (error) {
    console.error('Error saving chat log:', error)
    return NextResponse.json({ error: 'Failed to save chat log' }, { status: 500 })
  }
}
