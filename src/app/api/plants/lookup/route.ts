import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUser } from '@/lib/supabase/server';

/**
 * Plant Lookup API
 *
 * Finds a plant by various identifiers:
 * - plantId (ANT-2025-0036)
 * - database id (CUID)
 * - catalogId
 *
 * Used by QR code redirects to resolve human-readable IDs to database IDs.
 */
export async function GET(req: NextRequest) {
  // Get authenticated user
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    // Try to find plant by various ID fields (only user's plants)
    const plant = await prisma.plant.findFirst({
      where: {
        OR: [
          { plantId: query },
          { id: query },
        ],
        userId: user.id,  // Multi-tenant isolation
        isArchived: false,
      },
      select: {
        id: true,
        plantId: true,
        hybridName: true,
        species: true,
      },
    });

    if (!plant) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    return NextResponse.json(plant);
  } catch (error) {
    console.error('Plant lookup error:', error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}
