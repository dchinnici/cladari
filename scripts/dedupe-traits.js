const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔎 Checking for duplicate traits (plantId, category, traitName)...')
  console.log('cwd:', process.cwd())
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  const grouped = await prisma.trait.groupBy({
    by: ['plantId', 'category', 'traitName'],
    _count: { _all: true },
  })
  const dupGroups = grouped.filter((g) => g._count._all > 1)

  if (dupGroups.length === 0) {
    console.log('✅ No duplicates found.')
    return
  }

  console.log(`Found ${dupGroups.length} duplicate groups. Cleaning up...`)
  let totalDeleted = 0

  for (const g of dupGroups) {
    const rows = await prisma.trait.findMany({
      where: {
        plantId: g.plantId,
        category: g.category,
        traitName: g.traitName,
      },
      orderBy: [{ updatedAt: 'desc' }],
    })

    const keep = rows[0]
    const toDelete = rows.slice(1)

    if (toDelete.length > 0) {
      await prisma.trait.deleteMany({
        where: { id: { in: toDelete.map(r => r.id) } },
      })
      totalDeleted += toDelete.length
      console.log(`- Kept ${keep.id} for (${g.plantId}, ${g.category}, ${g.traitName}); deleted ${toDelete.length}`)
    }
  }

  console.log(`🧹 Done. Deleted ${totalDeleted} duplicate rows.`)
}

main()
  .catch((e) => {
    console.error('❌ Dedupe failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
