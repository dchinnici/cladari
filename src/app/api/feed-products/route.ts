import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/feed-products - List all active feed products
export async function GET() {
  try {
    const products = await prisma.feedProduct.findMany({
      where: { isActive: true },
      orderBy: [
        { isInBaseline: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching feed products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed products' },
      { status: 500 }
    )
  }
}

// POST /api/feed-products - Create new feed product
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.category) {
      return NextResponse.json(
        { error: 'name and category are required' },
        { status: 400 }
      )
    }

    const product = await prisma.feedProduct.create({
      data: {
        name: body.name,
        brand: body.brand || null,
        category: body.category,
        ecContribution: body.ecContribution || null,
        phEffect: body.phEffect || null,
        phEffectType: body.phEffectType || null,
        nitrogenN: body.nitrogenN || null,
        phosphorusP: body.phosphorusP || null,
        potassiumK: body.potassiumK || null,
        calcium: body.calcium || null,
        magnesium: body.magnesium || null,
        sulfur: body.sulfur || null,
        iron: body.iron || null,
        silica: body.silica || null,
        defaultDose: body.defaultDose || null,
        maxDose: body.maxDose || null,
        applicationNotes: body.applicationNotes || null,
        isActive: body.isActive ?? true,
        isInBaseline: body.isInBaseline ?? false
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating feed product:', error)
    return NextResponse.json(
      { error: 'Failed to create feed product' },
      { status: 500 }
    )
  }
}
