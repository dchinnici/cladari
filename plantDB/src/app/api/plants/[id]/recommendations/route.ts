import { NextResponse } from 'next/server'
import { generateRecommendations } from '@/lib/care/recommendations'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const recommendations = await generateRecommendations(params.id)

    return NextResponse.json({
      recommendations,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
