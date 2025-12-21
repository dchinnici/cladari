/**
 * Migration Script: Convert Legacy Plants to Proper Batches
 *
 * This script migrates three "placeholder" Plant records that were created
 * before the batch system existed into proper SeedBatch/CloneBatch records,
 * then graduates the appropriate individuals.
 *
 * Plants to migrate:
 * - ANT-2025-0056 (Wendlingerii) → SeedBatch, 12 seedlings, 0 graduated
 * - ANT-2025-0062 (Lavender) → SeedBatch, 14 total (11 in tray + 3 graduated)
 * - ANT-2025-0012 (Dark Mama) → CloneBatch (TC), 10 acquired, 3 keepers, 7 discarded
 *
 * Run with: npx tsx scripts/migrate-legacy-batches.ts
 * Or dry-run: npx tsx scripts/migrate-legacy-batches.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DRY_RUN = process.argv.includes('--dry-run')

interface MigrationPlan {
  plantId: string
  batchType: 'seed' | 'clone'
  batchId: string // CLB-YYYY-### or SDB-YYYY-###
  species: string
  cultivarName: string | null
  acquiredCount: number
  currentCount: number
  graduateCount: number
  propagationType?: string // For clone batches: TC, CUTTING, etc.
  externalSource: string
}

const MIGRATIONS: MigrationPlan[] = [
  {
    // Database shows: "sp nova Lavender" in Grow Tent 1
    // Using CloneBatch with SEED type since SeedBatch requires Harvest chain
    plantId: 'ANT-2025-0056',
    batchType: 'seed',
    batchId: 'CLB-2025-005', // Next available after existing 001-004
    species: 'sp. nova',
    cultivarName: 'Lavender',
    acquiredCount: 12,
    currentCount: 12,
    graduateCount: 0, // None graduated yet, all still in seedling tray
    externalSource: 'NSE Tropicals',
  },
  {
    // Database shows: "Wendlingerii" in Grow Center 1 (loft)
    // Using CloneBatch with SEED type since SeedBatch requires Harvest chain
    plantId: 'ANT-2025-0062',
    batchType: 'seed',
    batchId: 'CLB-2025-006',
    species: 'wendlingerii',
    cultivarName: null,
    acquiredCount: 14,
    currentCount: 14, // 11 in tray + 3 in 4" pots
    graduateCount: 3, // 3 have been separated into individual pots
    externalSource: 'NSE Tropicals',
  },
  {
    // Database shows: "Dark Mama" in Ambient Display
    plantId: 'ANT-2025-0012',
    batchType: 'clone',
    batchId: 'CLB-2025-007',
    species: null,
    cultivarName: 'Dark Mama',
    acquiredCount: 10,
    currentCount: 3, // 7 discarded yesterday
    graduateCount: 3, // The 3 keepers become individual plants
    propagationType: 'TC',
    externalSource: 'NSE Tropicals',
  },
]

async function generatePlantId(): Promise<string> {
  const year = new Date().getFullYear()
  let attempts = 0

  while (attempts < 10) {
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const candidate = `ANT-${year}-${rand}`

    const existing = await prisma.plant.findUnique({
      where: { plantId: candidate }
    })

    if (!existing) {
      return candidate
    }
    attempts++
  }

  throw new Error('Could not generate unique plant ID after 10 attempts')
}

async function migratePlant(plan: MigrationPlan) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Migrating ${plan.plantId} → ${plan.batchId}`)
  console.log('='.repeat(60))

  // 1. Find the placeholder plant
  const plant = await prisma.plant.findUnique({
    where: { plantId: plan.plantId },
    include: {
      careLogs: { orderBy: { date: 'asc' } },
      user: true,
    }
  })

  if (!plant) {
    console.error(`❌ Plant ${plan.plantId} not found!`)
    return
  }

  console.log(`Found plant: ${plant.plantId}`)
  console.log(`  User: ${plant.userId}`)
  console.log(`  Care logs: ${plant.careLogs.length}`)
  console.log(`  Location: ${plant.locationId || 'none'}`)

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would perform the following:')
  }

  // 2. Create the batch record
  if (plan.batchType === 'seed') {
    console.log(`\nCreating SeedBatch: ${plan.batchId}`)

    if (!DRY_RUN) {
      // For SeedBatch, we need a harvest and breeding record
      // Since these are from external source, we'll create a minimal structure
      // Actually, SeedBatch requires a harvest which requires a breeding record
      // For external seeds, we might need to handle this differently
      // Let's check the schema...

      // Actually, looking at the schema, SeedBatch requires harvestId which requires breedingRecordId
      // For external purchases, we might need to create "placeholder" records
      // OR we could just use CloneBatch for all of them with different propagation types

      // Let me check if there's a way to have a SeedBatch without a harvest...
      // Looking at schema: harvestId is required on SeedBatch

      // For now, let's note this limitation
      console.log(`⚠️  SeedBatch requires a Harvest which requires a BreedingRecord`)
      console.log(`   For external seed purchases, consider using a CloneBatch with propagationType='SEED'`)
      console.log(`   Or create placeholder breeding/harvest records`)

      // Using CloneBatch with type 'SEED' since SeedBatch requires Harvest chain
      const batch = await prisma.cloneBatch.create({
        data: {
          batchId: plan.batchId, // Already using CLB format
          userId: plant.userId,
          propagationType: 'SEED', // Special case for purchased seeds
          externalSource: plan.externalSource,
          species: plan.species,
          cultivarName: plan.cultivarName,
          acquiredDate: plant.accessionDate,
          acquiredCount: plan.acquiredCount,
          currentCount: plan.currentCount,
          containerCount: 1,
          containerType: 'seedling tray',
          status: plan.graduateCount > 0 ? 'SEPARATING' : 'GROWING',
          locationId: plant.locationId,
          notes: `Migrated from ${plan.plantId}. Originally purchased seeds from ${plan.externalSource}.`,
        }
      })
      console.log(`✅ Created CloneBatch (for seeds): ${batch.batchId}`)

      // 3. Move care logs to batch
      console.log(`\nMoving ${plant.careLogs.length} care logs to batch...`)

      for (const log of plant.careLogs) {
        await prisma.careLog.update({
          where: { id: log.id },
          data: {
            plantId: null, // Remove from plant
            cloneBatchId: batch.id, // Add to batch
          }
        })
      }
      console.log(`✅ Moved care logs`)

      // 4. Graduate individuals if needed
      if (plan.graduateCount > 0) {
        console.log(`\nGraduating ${plan.graduateCount} individuals...`)

        const graduatedPlants = []
        for (let i = 0; i < plan.graduateCount; i++) {
          const newPlantId = await generatePlantId()

          const graduatedPlant = await prisma.plant.create({
            data: {
              plantId: newPlantId,
              userId: plant.userId,
              accessionDate: new Date(),
              genus: 'Anthurium',
              species: plan.species,
              hybridName: plan.cultivarName,
              cloneBatchId: batch.id,
              propagationType: 'seed',
              healthStatus: 'healthy',
              locationId: plant.locationId,
              notes: `Graduated from ${batch.batchId} (originally ${plan.plantId})`,
            }
          })

          // Copy batch care logs to graduated plant
          const batchCareLogs = await prisma.careLog.findMany({
            where: { cloneBatchId: batch.id }
          })

          for (const log of batchCareLogs) {
            await prisma.careLog.create({
              data: {
                plantId: graduatedPlant.id,
                cloneBatchId: null,
                date: log.date,
                action: log.action,
                inputEC: log.inputEC,
                inputPH: log.inputPH,
                outputEC: log.outputEC,
                outputPH: log.outputPH,
                isBaselineFeed: log.isBaselineFeed,
                details: log.details,
              }
            })
          }

          graduatedPlants.push(graduatedPlant)
          console.log(`  ✅ Created ${newPlantId} with ${batchCareLogs.length} care logs`)
        }
      }

      // 5. Archive the original plant
      console.log(`\nArchiving original plant ${plan.plantId}...`)
      await prisma.plant.update({
        where: { id: plant.id },
        data: {
          isArchived: true,
          notes: `${plant.notes || ''}\n\n[ARCHIVED] Migrated to batch ${batch.batchId} on ${new Date().toISOString().split('T')[0]}`,
        }
      })
      console.log(`✅ Archived ${plan.plantId}`)
    }
  } else {
    // CloneBatch (TC, cutting, etc.)
    console.log(`\nCreating CloneBatch: ${plan.batchId}`)

    if (!DRY_RUN) {
      const batch = await prisma.cloneBatch.create({
        data: {
          batchId: plan.batchId,
          userId: plant.userId,
          propagationType: plan.propagationType || 'TC',
          externalSource: plan.externalSource,
          species: plan.species,
          cultivarName: plan.cultivarName,
          acquiredDate: plant.accessionDate,
          acquiredCount: plan.acquiredCount,
          currentCount: plan.currentCount,
          containerCount: 1,
          containerType: plan.propagationType === 'TC' ? 'TC cups' : 'pots',
          status: plan.graduateCount >= plan.currentCount ? 'COMPLETE' : 'GROWING',
          locationId: plant.locationId,
          notes: `Migrated from ${plan.plantId}. ${plan.propagationType} from ${plan.externalSource}.`,
        }
      })
      console.log(`✅ Created CloneBatch: ${batch.batchId}`)

      // Move care logs to batch
      console.log(`\nMoving ${plant.careLogs.length} care logs to batch...`)

      for (const log of plant.careLogs) {
        await prisma.careLog.update({
          where: { id: log.id },
          data: {
            plantId: null,
            cloneBatchId: batch.id,
          }
        })
      }
      console.log(`✅ Moved care logs`)

      // Graduate individuals if needed
      if (plan.graduateCount > 0) {
        console.log(`\nGraduating ${plan.graduateCount} individuals...`)

        for (let i = 0; i < plan.graduateCount; i++) {
          const newPlantId = await generatePlantId()

          const graduatedPlant = await prisma.plant.create({
            data: {
              plantId: newPlantId,
              userId: plant.userId,
              accessionDate: new Date(),
              genus: 'Anthurium',
              species: plan.species,
              hybridName: plan.cultivarName,
              cloneBatchId: batch.id,
              propagationType: plan.propagationType?.toLowerCase() || 'tissue_culture',
              healthStatus: 'healthy',
              locationId: plant.locationId,
              notes: `Graduated from ${batch.batchId} (originally ${plan.plantId})`,
            }
          })

          // Copy batch care logs to graduated plant
          const batchCareLogs = await prisma.careLog.findMany({
            where: { cloneBatchId: batch.id }
          })

          for (const log of batchCareLogs) {
            await prisma.careLog.create({
              data: {
                plantId: graduatedPlant.id,
                cloneBatchId: null,
                date: log.date,
                action: log.action,
                inputEC: log.inputEC,
                inputPH: log.inputPH,
                outputEC: log.outputEC,
                outputPH: log.outputPH,
                isBaselineFeed: log.isBaselineFeed,
                details: log.details,
              }
            })
          }

          console.log(`  ✅ Created ${newPlantId} with ${batchCareLogs.length} care logs`)
        }
      }

      // Archive the original plant
      console.log(`\nArchiving original plant ${plan.plantId}...`)
      await prisma.plant.update({
        where: { id: plant.id },
        data: {
          isArchived: true,
          notes: `${plant.notes || ''}\n\n[ARCHIVED] Migrated to batch ${batch.batchId} on ${new Date().toISOString().split('T')[0]}`,
        }
      })
      console.log(`✅ Archived ${plan.plantId}`)
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║  Legacy Plant → Batch Migration Script                      ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n')
  }

  console.log('Migrations planned:')
  for (const plan of MIGRATIONS) {
    console.log(`  • ${plan.plantId} → ${plan.batchId} (${plan.batchType}, graduate ${plan.graduateCount})`)
  }

  for (const plan of MIGRATIONS) {
    await migratePlant(plan)
  }

  console.log('\n' + '='.repeat(60))
  console.log('Migration complete!')
  console.log('='.repeat(60))

  if (DRY_RUN) {
    console.log('\nThis was a dry run. Run without --dry-run to execute.')
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Migration failed:', e)
  await prisma.$disconnect()
  process.exit(1)
})
