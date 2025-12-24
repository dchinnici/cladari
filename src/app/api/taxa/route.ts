import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase/server'

/**
 * GET /api/taxa
 *
 * Query taxon references with filtering and search.
 *
 * Query params:
 *   - species: Filter by species name (partial match)
 *   - section: Filter by section (exact match)
 *   - genus: Filter by genus (default: Anthurium)
 *   - source: Filter by source (IAS, MOBOT, etc.)
 *   - limit: Max results (default: 50)
 *   - offset: Pagination offset
 *
 * Examples:
 *   GET /api/taxa?species=papillilaminum
 *   GET /api/taxa?section=Cardiolonchium
 *   GET /api/taxa?species=crystal&limit=10
 */
export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const species = searchParams.get('species')
  const section = searchParams.get('section')
  const genus = searchParams.get('genus') || 'Anthurium'
  const source = searchParams.get('source')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = {
      genus: { equals: genus, mode: 'insensitive' }
    }

    if (species) {
      where.species = { contains: species.toLowerCase(), mode: 'insensitive' }
    }

    if (section) {
      where.section = { equals: section, mode: 'insensitive' }
    }

    if (source) {
      where.source = source
    }

    const [taxa, total] = await Promise.all([
      prisma.taxonReference.findMany({
        where,
        orderBy: { species: 'asc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          genus: true,
          species: true,
          authority: true,
          section: true,
          habit: true,
          distribution: true,
          diagnosticTraits: true,
          bladeLength: true,
          bladeWidth: true,
          spadixLength: true,
          images: true,
          source: true,
          sourceUrl: true,
          verificationStatus: true,
          createdAt: true
        }
      }),
      prisma.taxonReference.count({ where })
    ])

    return NextResponse.json({
      taxa,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching taxa:', error)
    return NextResponse.json(
      { error: 'Failed to fetch taxa' },
      { status: 500 }
    )
  }
}
