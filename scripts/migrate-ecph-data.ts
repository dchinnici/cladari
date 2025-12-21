/**
 * Migration Script: Extract EC/pH data from CareLog.details JSON to structured columns
 *
 * Run with: npx ts-node scripts/migrate-ecph-data.ts
 * Or: npx tsx scripts/migrate-ecph-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DetailsJson {
  inputEC?: number
  inputPH?: number
  outputEC?: number
  outputPH?: number
  notes?: string
}

async function migrateECPHData() {
  console.log('Starting EC/pH data migration...\n')

  // Get all care logs with details that might contain EC/pH data
  const careLogs = await prisma.careLog.findMany({
    where: {
      details: {
        not: null
      }
    },
    select: {
      id: true,
      details: true,
      plantId: true
    }
  })

  console.log(`Found ${careLogs.length} care logs with details field`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const log of careLogs) {
    if (!log.details) {
      skipped++
      continue
    }

    try {
      // Try to parse as JSON
      const details: DetailsJson = JSON.parse(log.details)

      // Check if there's any EC/pH data to migrate
      const hasData = details.inputEC !== undefined ||
                      details.inputPH !== undefined ||
                      details.outputEC !== undefined ||
                      details.outputPH !== undefined

      if (!hasData) {
        skipped++
        continue
      }

      // Update the care log with extracted values
      await prisma.careLog.update({
        where: { id: log.id },
        data: {
          inputEC: details.inputEC ?? null,
          inputPH: details.inputPH ?? null,
          outputEC: details.outputEC ?? null,
          outputPH: details.outputPH ?? null,
          // Keep notes in details, clear the rest
          details: details.notes ? JSON.stringify({ notes: details.notes }) : null
        }
      })

      updated++

      if (updated % 50 === 0) {
        console.log(`  Migrated ${updated} records...`)
      }

    } catch (e) {
      // Not valid JSON or other error - skip
      skipped++
    }
  }

  console.log('\n--- Migration Complete ---')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)

  // Verify migration
  const withInputEC = await prisma.careLog.count({ where: { inputEC: { not: null } } })
  const withOutputEC = await prisma.careLog.count({ where: { outputEC: { not: null } } })
  const withInputPH = await prisma.careLog.count({ where: { inputPH: { not: null } } })
  const withOutputPH = await prisma.careLog.count({ where: { outputPH: { not: null } } })

  console.log('\n--- Verification ---')
  console.log(`Records with inputEC: ${withInputEC}`)
  console.log(`Records with inputPH: ${withInputPH}`)
  console.log(`Records with outputEC: ${withOutputEC}`)
  console.log(`Records with outputPH: ${withOutputPH}`)
}

async function seedFeedProducts() {
  console.log('\n--- Seeding FeedProduct Table ---\n')

  const products = [
    {
      name: 'TPS CalMag',
      brand: 'TPS Nutrients',
      category: 'supplement',
      ecContribution: 0.15,
      phEffect: 0.0,
      phEffectType: 'neutral',
      calcium: 4.0,
      magnesium: 1.5,
      defaultDose: 1.0,
      maxDose: 2.0,
      isInBaseline: true,
      applicationNotes: 'Base calcium/magnesium supplement. Use in every feed.'
    },
    {
      name: 'TPS One',
      brand: 'TPS Nutrients',
      category: 'fertilizer',
      ecContribution: 0.5,
      phEffect: -0.1,
      phEffectType: 'buffer',
      nitrogenN: 3.0,
      phosphorusP: 3.0,
      potassiumK: 3.0,
      defaultDose: 2.0,
      maxDose: 3.0,
      isInBaseline: true,
      applicationNotes: 'Complete 3-3-3 fertilizer. Core of baseline feed.'
    },
    {
      name: 'TPS Silica',
      brand: 'TPS Nutrients',
      category: 'supplement',
      ecContribution: 0.05,
      phEffect: 1.0,
      phEffectType: 'buffer',
      silica: 7.8,
      defaultDose: 1.0,
      maxDose: 2.0,
      isInBaseline: false,
      applicationNotes: 'Silica supplement. Raises pH significantly - add first, then pH down.'
    },
    {
      name: 'K-Carb (pH Up)',
      brand: 'Generic',
      category: 'ph_adjuster',
      ecContribution: 0.02,
      phEffect: 0.3,
      phEffectType: 'direct',
      potassiumK: 50.0,
      defaultDose: 0.5,
      maxDose: 1.5,
      isInBaseline: false,
      applicationNotes: 'Potassium carbonate. Direct pH raiser, adds K.'
    },
    {
      name: 'pH Down',
      brand: 'Generic',
      category: 'ph_adjuster',
      ecContribution: 0.01,
      phEffect: -0.5,
      phEffectType: 'direct',
      defaultDose: 0.3,
      maxDose: 1.0,
      isInBaseline: false,
      applicationNotes: 'Phosphoric acid. Use sparingly to lower pH.'
    },
    {
      name: 'Purified Water',
      brand: null,
      category: 'water_source',
      ecContribution: 0.02,
      phEffect: null,
      phEffectType: null,
      defaultDose: null,
      maxDose: null,
      isInBaseline: true,
      applicationNotes: 'RO or purified water base. ~7.1 pH with minerals for taste.'
    },
    {
      name: 'Tap Water',
      brand: null,
      category: 'water_source',
      ecContribution: 0.3,
      phEffect: null,
      phEffectType: null,
      defaultDose: null,
      maxDose: null,
      isInBaseline: true,
      applicationNotes: 'Fort Lauderdale tap. ~8.5 pH, moderate hardness.'
    }
  ]

  for (const product of products) {
    await prisma.feedProduct.upsert({
      where: { name: product.name },
      update: product,
      create: product
    })
    console.log(`  Created/updated: ${product.name}`)
  }

  console.log('\nFeedProduct seeding complete!')
}

async function main() {
  try {
    await migrateECPHData()
    await seedFeedProducts()
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
