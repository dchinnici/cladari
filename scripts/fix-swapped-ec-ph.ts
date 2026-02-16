/**
 * Fix Swapped EC/pH Values Script
 *
 * Identifies care logs where EC and pH values were entered in the wrong fields
 * (user entered pH value into EC field and vice versa) and swaps them.
 *
 * Detection heuristic:
 *   - Normal pH range: 4.0–8.5
 *   - Normal EC range: 0.01–4.0 mS/cm
 *   - A "swapped" entry has inputEC in pH range AND inputPH in EC range
 *     (or only one field populated but clearly in the wrong range)
 *
 * Run with: npx tsx scripts/fix-swapped-ec-ph.ts
 *
 * Options:
 *   --dry-run     Show what would be fixed without making changes
 *   --verbose     Show all details of each entry
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isVerbose = args.includes('--verbose')

// Thresholds for detection
const PH_MIN = 4.0
const PH_MAX = 8.5
const EC_MIN = 0.01
const EC_MAX = 4.0

function looksLikePH(val: number): boolean {
  return val >= PH_MIN && val <= PH_MAX
}

function looksLikeEC(val: number): boolean {
  return val >= EC_MIN && val <= EC_MAX
}

function isSwapped(ecField: number | null, phField: number | null): boolean {
  // Both populated and both in wrong range
  if (ecField !== null && phField !== null) {
    return looksLikePH(ecField) && looksLikeEC(phField)
  }
  // Only EC populated but looks like pH
  if (ecField !== null && phField === null) {
    return looksLikePH(ecField) && !looksLikeEC(ecField)
  }
  // Only pH populated but looks like EC
  if (phField !== null && ecField === null) {
    return looksLikeEC(phField) && !looksLikePH(phField)
  }
  return false
}

async function main() {
  console.log(`\n🔍 Scanning care logs for swapped EC/pH values...`)
  console.log(`   Mode: ${isDryRun ? '🏜️  DRY RUN (no changes)' : '🔧 LIVE (will update database)'}\n`)

  // Fetch all care logs that have any EC or pH values
  const careLogs = await prisma.careLog.findMany({
    where: {
      OR: [
        { inputEC: { not: null } },
        { inputPH: { not: null } },
        { outputEC: { not: null } },
        { outputPH: { not: null } },
      ]
    },
    include: {
      plant: {
        select: { plantId: true, hybridName: true, species: true }
      }
    },
    orderBy: { date: 'desc' }
  })

  console.log(`   Found ${careLogs.length} care logs with EC/pH data\n`)

  const toFix: Array<{
    id: string
    plantId: string
    customId: string | null
    date: Date
    inputSwapped: boolean
    outputSwapped: boolean
    oldInputEC: number | null
    oldInputPH: number | null
    oldOutputEC: number | null
    oldOutputPH: number | null
  }> = []

  for (const log of careLogs) {
    const inputSwapped = isSwapped(log.inputEC, log.inputPH)
    const outputSwapped = isSwapped(log.outputEC, log.outputPH)

    if (inputSwapped || outputSwapped) {
      toFix.push({
        id: log.id,
        plantId: log.plantId,
        customId: log.plant?.plantId ?? '(orphaned)',
        date: log.date,
        inputSwapped,
        outputSwapped,
        oldInputEC: log.inputEC,
        oldInputPH: log.inputPH,
        oldOutputEC: log.outputEC,
        oldOutputPH: log.outputPH,
      })
    }
  }

  if (toFix.length === 0) {
    console.log('✅ No swapped entries found. Database looks clean!')
    return
  }

  console.log(`⚠️  Found ${toFix.length} entries with swapped EC/pH values:\n`)

  // Group by date for readability
  const byDate = new Map<string, typeof toFix>()
  for (const entry of toFix) {
    const dateKey = entry.date.toISOString().split('T')[0]
    if (!byDate.has(dateKey)) byDate.set(dateKey, [])
    byDate.get(dateKey)!.push(entry)
  }

  for (const [date, entries] of byDate) {
    console.log(`  📅 ${date} (${entries.length} entries)`)
    for (const e of entries) {
      const parts: string[] = []
      if (e.inputSwapped) {
        parts.push(`input: EC=${e.oldInputEC}→pH, pH=${e.oldInputPH}→EC`)
      }
      if (e.outputSwapped) {
        parts.push(`output: EC=${e.oldOutputEC}→pH, pH=${e.oldOutputPH}→EC`)
      }
      console.log(`     ${e.customId?.padEnd(16) ?? '(orphaned)'.padEnd(16)} ${parts.join(' | ')}`)
    }
  }

  console.log('')

  if (isDryRun) {
    console.log(`🏜️  Dry run complete. Run without --dry-run to apply ${toFix.length} fixes.\n`)
    return
  }

  // Apply fixes
  console.log(`🔧 Applying ${toFix.length} fixes...\n`)

  let fixed = 0
  let errors = 0

  for (const entry of toFix) {
    try {
      const updateData: Record<string, number | null> = {}

      if (entry.inputSwapped) {
        // Swap: old EC field (has pH value) → new pH field, and vice versa
        updateData.inputPH = entry.oldInputEC  // EC field had the pH value
        updateData.inputEC = entry.oldInputPH  // pH field had the EC value
      }
      if (entry.outputSwapped) {
        updateData.outputPH = entry.oldOutputEC
        updateData.outputEC = entry.oldOutputPH
      }

      await prisma.careLog.update({
        where: { id: entry.id },
        data: updateData
      })

      fixed++
      if (isVerbose) {
        console.log(`   ✅ ${entry.customId} (${entry.date.toISOString().split('T')[0]})`)
      }
    } catch (err) {
      errors++
      console.error(`   ❌ Failed to fix ${entry.id}: ${err}`)
    }
  }

  console.log(`\n✅ Done! Fixed: ${fixed}, Errors: ${errors}`)
  if (fixed > 0) {
    console.log(`\n💡 Tip: Verify a few entries in Prisma Studio to confirm values look correct.`)
    console.log(`   Run: npx prisma studio`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
