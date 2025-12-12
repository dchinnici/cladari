import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper to compute retrieval weight from quality score
function computeRetrievalWeight(qualityScore: number): number {
  // v1 formula: linear scaling 0.25x to 2.0x
  return 0.25 * (qualityScore + 1)
}

const WEIGHT_VERSION = 1 // Increment when formula changes

// GET /api/chat-logs?plantId=xxx - Get all chat logs for a plant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plantId = searchParams.get('plantId')
    const minScore = searchParams.get('minScore') // Optional filter

    if (!plantId) {
      return NextResponse.json({ error: 'plantId is required' }, { status: 400 })
    }

    const chatLogs = await prisma.chatLog.findMany({
      where: {
        plantId,
        ...(minScore ? { qualityScore: { gte: parseInt(minScore) } } : {})
      },
      orderBy: { conversationDate: 'desc' },
      select: {
        id: true,
        title: true,
        messages: true,
        originalContent: true,
        displayContent: true,
        wasEdited: true,
        qualityScore: true,
        retrievalWeight: true,
        confidence: true,
        savedAt: true,
        scoredAt: true,
        conversationDate: true,
        modelUsed: true,
      }
    })

    // Parse messages JSON for each log
    const parsed = chatLogs.map(log => ({
      ...log,
      messages: JSON.parse(log.messages),
    }))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error fetching chat logs:', error)
    return NextResponse.json({ error: 'Failed to fetch chat logs' }, { status: 500 })
  }
}

// POST /api/chat-logs - Save a new chat conversation with quality scoring
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      plantId,
      title,
      messages,
      conversationDate,
      // New HITL fields
      qualityScore,
      originalContent,
      displayContent,
      modelUsed,
    } = body

    if (!plantId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'plantId and messages array are required' },
        { status: 400 }
      )
    }

    // Validate quality score if provided
    if (qualityScore !== undefined && qualityScore !== null) {
      if (!Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 4) {
        return NextResponse.json(
          { error: 'qualityScore must be an integer between 0 and 4' },
          { status: 400 }
        )
      }
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

    // Extract original content from last assistant message if not provided
    const extractedOriginal = originalContent || (() => {
      const lastAssistant = [...messages].reverse().find((m: { role: string }) => m.role === 'assistant')
      return lastAssistant?.content || null
    })()

    // Determine if content was edited
    const wasEdited = displayContent && displayContent !== extractedOriginal

    // Compute retrieval weight if quality score provided
    const retrievalWeight = qualityScore !== undefined && qualityScore !== null
      ? computeRetrievalWeight(qualityScore)
      : null

    const chatLog = await prisma.chatLog.create({
      data: {
        plantId,
        title: autoTitle,
        messages: JSON.stringify(messages),
        originalContent: extractedOriginal,
        displayContent: wasEdited ? displayContent : null,
        wasEdited: wasEdited || false,
        qualityScore,
        retrievalWeight,
        weightVersion: retrievalWeight ? WEIGHT_VERSION : 1,
        confidence: 'unverified',
        conversationDate: conversationDate ? new Date(conversationDate) : new Date(),
        scoredAt: qualityScore !== undefined && qualityScore !== null ? new Date() : null,
        modelUsed,
      }
    })

    return NextResponse.json({
      id: chatLog.id,
      title: chatLog.title,
      messages: messages,
      originalContent: chatLog.originalContent,
      displayContent: chatLog.displayContent,
      wasEdited: chatLog.wasEdited,
      qualityScore: chatLog.qualityScore,
      retrievalWeight: chatLog.retrievalWeight,
      confidence: chatLog.confidence,
      savedAt: chatLog.savedAt,
      scoredAt: chatLog.scoredAt,
      conversationDate: chatLog.conversationDate,
    })
  } catch (error) {
    console.error('Error saving chat log:', error)
    return NextResponse.json({ error: 'Failed to save chat log' }, { status: 500 })
  }
}
