import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAdmin } from '@/lib/supabase/server'

export async function GET() {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      tier: true,
      createdAt: true,
      _count: {
        select: {
          plants: true,
          locations: true,
          breedingRecords: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(profiles)
}
