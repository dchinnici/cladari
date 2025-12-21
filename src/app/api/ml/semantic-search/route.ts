/**
 * Hybrid Semantic Search API
 *
 * Combines:
 * - pgvector cosine similarity for semantic matching
 * - HITL quality weighting for result ranking
 * - Optional full-text filtering for exact terms
 *
 * Searches ChatLogChunks for AI consultation knowledge retrieval.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { embedder, EmbeddingService } from '@/lib/ml/embeddings'
import { getUser } from '@/lib/supabase/server'

interface ChunkSearchResult {
  id: string
  chatLogId: string
  chunkType: string
  content: string
  summary: string | null
  similarity: number
  qualityWeightedScore: number
  retrievalWeight: number | null
  chatLogTitle: string | null
  plantId: string
  plantDisplayId: string
  plantName: string | null
  qualityScore: number | null
  conversationDate: Date
}

/**
 * GET /api/ml/semantic-search?q=spider+mites&plantId=xxx&chunkType=damage_analysis&limit=10
 *
 * Simple GET endpoint for quick searches
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const plantId = searchParams.get('plantId')
    const chunkType = searchParams.get('chunkType')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const minQuality = searchParams.get('minQuality')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    // Check if embedding service is available
    await embedder.initialize()
    if (!embedder.isAvailable()) {
      // Fall back to keyword search if embeddings not available
      return keywordFallback(query, user.id, { plantId, chunkType, limit, minQuality })
    }

    // Generate query embedding
    const queryEmbedding = await embedder.embedQuery(query)
    const embeddingVector = EmbeddingService.toPgVector(queryEmbedding)

    // Build the WHERE clause conditions
    const conditions: string[] = ['clc.embedding IS NOT NULL']
    const params: (string | number)[] = [embeddingVector]
    let paramIndex = 2

    // Filter by user's plants only (through ChatLog -> Plant relationship)
    conditions.push(`p."userId" = $${paramIndex}::uuid`)
    params.push(user.id)
    paramIndex++

    if (plantId) {
      conditions.push(`cl."plantId" = $${paramIndex}`)
      params.push(plantId)
      paramIndex++
    }

    if (chunkType) {
      conditions.push(`clc."chunkType" = $${paramIndex}`)
      params.push(chunkType)
      paramIndex++
    }

    if (minQuality) {
      conditions.push(`cl."qualityScore" >= $${paramIndex}`)
      params.push(parseInt(minQuality))
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Execute hybrid search query
    // Uses pgvector <=> operator for cosine distance (lower = more similar)
    // Converts to similarity score (1 - distance)
    // Weights by retrieval weight from HITL scoring
    const results = await prisma.$queryRawUnsafe<ChunkSearchResult[]>(`
      SELECT
        clc.id,
        clc."chatLogId",
        clc."chunkType",
        clc.content,
        clc.summary,
        (1 - (clc.embedding <=> $1::vector)) as similarity,
        (1 - (clc.embedding <=> $1::vector)) * COALESCE(clc."retrievalWeight", 1.0) as "qualityWeightedScore",
        clc."retrievalWeight",
        cl.title as "chatLogTitle",
        cl."plantId",
        p."plantId" as "plantDisplayId",
        COALESCE(p."hybridName", p.species) as "plantName",
        cl."qualityScore",
        cl."conversationDate"
      FROM "ChatLogChunk" clc
      JOIN "ChatLog" cl ON clc."chatLogId" = cl.id
      JOIN "Plant" p ON cl."plantId" = p.id
      ${whereClause}
      ORDER BY "qualityWeightedScore" DESC
      LIMIT ${limit}
    `, ...params)

    return NextResponse.json({
      query,
      method: 'vector',
      resultCount: results.length,
      results: results.map(r => ({
        ...r,
        similarity: parseFloat(r.similarity.toString()),
        qualityWeightedScore: parseFloat(r.qualityWeightedScore.toString()),
        retrievalWeight: r.retrievalWeight ? parseFloat(r.retrievalWeight.toString()) : null
      }))
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

/**
 * POST /api/ml/semantic-search - Advanced search with more options
 *
 * Supports filtering by multiple chunk types, date ranges, multiple plants, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      query,
      plantIds,      // Array of plant IDs to search within
      chunkTypes,    // Array of chunk types to filter
      minQuality,    // Minimum quality score (0-4)
      dateFrom,      // Date range start
      dateTo,        // Date range end
      limit = 10,
      includeContext = false  // Include surrounding context from ChatLog
    } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Check if embedding service is available
    await embedder.initialize()
    if (!embedder.isAvailable()) {
      return NextResponse.json({
        error: 'Embedding service not available',
        hint: 'Install @xenova/transformers: npm install @xenova/transformers',
        fallback: 'Use GET endpoint for keyword search fallback'
      }, { status: 503 })
    }

    // Generate query embedding
    const queryEmbedding = await embedder.embedQuery(query)
    const embeddingVector = EmbeddingService.toPgVector(queryEmbedding)

    // Build dynamic query
    const conditions: string[] = ['clc.embedding IS NOT NULL']
    const params: (string | number | string[])[] = [embeddingVector]
    let paramIndex = 2

    // User filter (always apply)
    conditions.push(`p."userId" = $${paramIndex}::uuid`)
    params.push(user.id)
    paramIndex++

    if (plantIds && Array.isArray(plantIds) && plantIds.length > 0) {
      conditions.push(`cl."plantId" = ANY($${paramIndex}::text[])`)
      params.push(plantIds)
      paramIndex++
    }

    if (chunkTypes && Array.isArray(chunkTypes) && chunkTypes.length > 0) {
      conditions.push(`clc."chunkType" = ANY($${paramIndex}::text[])`)
      params.push(chunkTypes)
      paramIndex++
    }

    if (minQuality !== undefined && minQuality !== null) {
      conditions.push(`cl."qualityScore" >= $${paramIndex}`)
      params.push(minQuality)
      paramIndex++
    }

    if (dateFrom) {
      conditions.push(`cl."conversationDate" >= $${paramIndex}::timestamp`)
      params.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      conditions.push(`cl."conversationDate" <= $${paramIndex}::timestamp`)
      params.push(dateTo)
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`
    const safeLimit = Math.min(parseInt(limit.toString()), 50)

    // Include full ChatLog content if context requested
    const contextSelect = includeContext
      ? `, cl."displayContent", cl."originalContent"`
      : ''

    const results = await prisma.$queryRawUnsafe<ChunkSearchResult[]>(`
      SELECT
        clc.id,
        clc."chatLogId",
        clc."chunkType",
        clc.content,
        clc.summary,
        (1 - (clc.embedding <=> $1::vector)) as similarity,
        (1 - (clc.embedding <=> $1::vector)) * COALESCE(clc."retrievalWeight", 1.0) as "qualityWeightedScore",
        clc."retrievalWeight",
        cl.title as "chatLogTitle",
        cl."plantId",
        p."plantId" as "plantDisplayId",
        COALESCE(p."hybridName", p.species) as "plantName",
        cl."qualityScore",
        cl."conversationDate"${contextSelect}
      FROM "ChatLogChunk" clc
      JOIN "ChatLog" cl ON clc."chatLogId" = cl.id
      JOIN "Plant" p ON cl."plantId" = p.id
      ${whereClause}
      ORDER BY "qualityWeightedScore" DESC
      LIMIT ${safeLimit}
    `, ...params)

    return NextResponse.json({
      query,
      method: 'vector',
      filters: { plantIds, chunkTypes, minQuality, dateFrom, dateTo },
      resultCount: results.length,
      results: results.map(r => ({
        ...r,
        similarity: parseFloat(r.similarity.toString()),
        qualityWeightedScore: parseFloat(r.qualityWeightedScore.toString()),
        retrievalWeight: r.retrievalWeight ? parseFloat(r.retrievalWeight.toString()) : null
      }))
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

/**
 * Keyword fallback when embedding service is not available
 */
async function keywordFallback(
  query: string,
  userId: string,
  options: { plantId?: string | null; chunkType?: string | null; limit: number; minQuality?: string | null }
) {
  const where: Record<string, unknown> = {
    chatLog: {
      plant: {
        userId
      }
    },
    content: {
      contains: query,
      mode: 'insensitive'
    }
  }

  if (options.plantId) {
    where.chatLog = { ...where.chatLog as object, plantId: options.plantId }
  }

  if (options.chunkType) {
    where.chunkType = options.chunkType
  }

  if (options.minQuality) {
    where.chatLog = {
      ...where.chatLog as object,
      qualityScore: { gte: parseInt(options.minQuality) }
    }
  }

  const chunks = await prisma.chatLogChunk.findMany({
    where,
    take: options.limit,
    include: {
      chatLog: {
        select: {
          id: true,
          title: true,
          plantId: true,
          qualityScore: true,
          conversationDate: true,
          plant: {
            select: {
              id: true,
              plantId: true,
              hybridName: true,
              species: true
            }
          }
        }
      }
    }
  })

  return NextResponse.json({
    query,
    method: 'keyword',
    note: 'Using keyword fallback - install @xenova/transformers for semantic search',
    resultCount: chunks.length,
    results: chunks.map(chunk => ({
      id: chunk.id,
      chatLogId: chunk.chatLogId,
      chunkType: chunk.chunkType,
      content: chunk.content,
      summary: chunk.summary,
      similarity: 0.5, // Placeholder for keyword match
      qualityWeightedScore: 0.5 * (chunk.retrievalWeight || 1),
      retrievalWeight: chunk.retrievalWeight,
      chatLogTitle: chunk.chatLog.title,
      plantId: chunk.chatLog.plantId,
      plantDisplayId: chunk.chatLog.plant.plantId,
      plantName: chunk.chatLog.plant.hybridName || chunk.chatLog.plant.species,
      qualityScore: chunk.chatLog.qualityScore,
      conversationDate: chunk.chatLog.conversationDate
    }))
  })
}
