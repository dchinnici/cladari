import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Valid failure types for categorization
const FAILURE_TYPES = [
  'hallucination',      // Made up facts, wrong plant info
  'missed_context',     // Didn't use available data
  'wrong_tone',         // Too casual, too formal, inappropriate
  'factual_error',      // Wrong but not hallucinated (e.g., bad calculation)
  'irrelevant',         // Off-topic or unhelpful
  'incomplete',         // Stopped short, missing important info
  'other'               // Catchall
] as const

// GET /api/negative-examples - List negative examples for analysis/export
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plantId = searchParams.get('plantId')
    const failureType = searchParams.get('failureType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const negativeExamples = await prisma.negativeExample.findMany({
      where: {
        ...(plantId ? { plantId } : {}),
        ...(failureType ? { failureType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        plant: {
          select: {
            id: true,
            plantId: true,
            hybridName: true,
            species: true,
          }
        }
      }
    })

    return NextResponse.json(negativeExamples)
  } catch (error) {
    console.error('Error fetching negative examples:', error)
    return NextResponse.json({ error: 'Failed to fetch negative examples' }, { status: 500 })
  }
}

// POST /api/negative-examples - Save a bad AI response for training
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      plantId,
      messages,
      originalContent,
      failureType,
      failureNotes,
      correctedResponse,
      modelUsed,
      userPrompt,
    } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    // Validate failure type if provided
    if (failureType && !FAILURE_TYPES.includes(failureType)) {
      return NextResponse.json(
        { error: `failureType must be one of: ${FAILURE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // If plantId provided, verify it exists
    if (plantId) {
      const plant = await prisma.plant.findUnique({
        where: { id: plantId },
        select: { id: true }
      })
      if (!plant) {
        return NextResponse.json({ error: 'Plant not found' }, { status: 404 })
      }
    }

    // Extract original content from last assistant message if not provided
    const extractedOriginal = originalContent || (() => {
      const lastAssistant = [...messages].reverse().find((m: { role: string }) => m.role === 'assistant')
      return lastAssistant?.content || null
    })()

    // Extract user prompt from first user message if not provided
    const extractedPrompt = userPrompt || (() => {
      const firstUser = messages.find((m: { role: string }) => m.role === 'user')
      return firstUser?.content || null
    })()

    const negativeExample = await prisma.negativeExample.create({
      data: {
        plantId: plantId || null,
        messages,  // Json type - no stringify needed
        originalContent: extractedOriginal,
        failureType,
        failureNotes,
        correctedResponse,
        modelUsed,
        userPrompt: extractedPrompt,
      }
    })

    return NextResponse.json({
      id: negativeExample.id,
      plantId: negativeExample.plantId,
      failureType: negativeExample.failureType,
      failureNotes: negativeExample.failureNotes,
      createdAt: negativeExample.createdAt,
    })
  } catch (error) {
    console.error('Error saving negative example:', error)
    return NextResponse.json({ error: 'Failed to save negative example' }, { status: 500 })
  }
}

// GET /api/negative-examples/stats - Get aggregate stats for dashboard
export async function OPTIONS() {
  // Return failure type options for UI
  return NextResponse.json({ failureTypes: FAILURE_TYPES })
}
