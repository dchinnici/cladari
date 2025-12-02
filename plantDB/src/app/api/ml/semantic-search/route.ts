/**
 * Semantic Search API Endpoint
 * Uses embeddings to find plants by natural language queries
 * Example: "Show me velvety dark plants that are struggling"
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EmbeddingService } from '@/lib/ml/embeddings';

const embedder = new EmbeddingService();

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate query embedding
    const queryEmbedding = await embedder.generateQueryEmbedding(query);

    // For SQLite (current), fall back to keyword search
    // This will be replaced with vector similarity when using PostgreSQL
    const plants = await prisma.plant.findMany({
      where: {
        OR: [
          { plantId: { contains: query } },
          { healthStatus: { contains: query } },
          { notes: { contains: query } }
        ]
      },
      include: {
        currentLocation: true,
        traits: {
          orderBy: { observationDate: 'desc' },
          take: 5
        }
      },
      take: limit
    });

    // Calculate pseudo-similarity scores based on keyword matches
    const results = plants.map(plant => {
      let similarity = 0.5; // Base score

      // Boost score for exact matches
      if (plant.plantId?.toLowerCase().includes(query.toLowerCase())) {
        similarity += 0.2;
      }
      if (plant.healthStatus?.toLowerCase().includes(query.toLowerCase())) {
        similarity += 0.15;
      }
      if (plant.notes?.toLowerCase().includes(query.toLowerCase())) {
        similarity += 0.1;
      }

      // Check traits for matches
      const traitMatches = plant.traits.filter(trait =>
        trait.value?.toLowerCase().includes(query.toLowerCase())
      );
      similarity += traitMatches.length * 0.05;

      return {
        ...plant,
        similarity: Math.min(1, similarity)
      };
    });

    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      results,
      query,
      method: 'keyword', // Will be 'vector' after PostgreSQL migration
      note: 'Full semantic search available after PostgreSQL + pgvector migration'
    });

  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoints: {
      search: 'POST /api/ml/semantic-search',
      predict: 'POST /api/ml/predict-care',
      diagnose: 'POST /api/ml/diagnose',
      insights: 'GET /api/ml/insights'
    },
    note: 'Full ML capabilities available after PostgreSQL migration'
  });
}