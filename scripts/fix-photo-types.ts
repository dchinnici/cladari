/**
 * Fix Photo Types Script
 *
 * Normalizes photoType values in the Photo table to fix typos and
 * ensure consistency.
 *
 * Known fixes:
 *   - "catophyl" → "cataphyll" (typo)
 *   - Any other typos discovered during dry run
 *
 * Run with: npx tsx scripts/fix-photo-types.ts --dry-run   (preview changes)
 *           npx tsx scripts/fix-photo-types.ts              (apply changes)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

// Canonical photoType values (from schema comments and photo context system)
const CANONICAL_TYPES = new Set([
  'whole_plant',
  'leaf',
  'petiole',
  'spathe',
  'spadix',
  'stem',
  'cataphyll',
  'base',
  'roots',
])

// Mapping of known typos/variants → canonical value
const FIXES: Record<string, string> = {
  'catophyl': 'cataphyll',
  'catophyll': 'cataphyll',
  'catapyll': 'cataphyll',
  'cataphyl': 'cataphyll',
  'wholeplant': 'whole_plant',
  'whole plant': 'whole_plant',
  'root': 'roots',
  'leaves': 'leaf',
  'petioles': 'petiole',
}

async function main() {
  console.log('=== Photo Type Normalization ===')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`)
  console.log()

  // Step 1: Get all distinct photoType values with counts
  const typeCounts = await prisma.photo.groupBy({
    by: ['photoType'],
    _count: { photoType: true },
    orderBy: { _count: { photoType: 'desc' } },
  })

  console.log('--- Current photoType Distribution ---')
  console.log()

  let totalPhotos = 0
  const issues: { value: string; count: number; fix: string }[] = []

  for (const row of typeCounts) {
    const value = row.photoType
    const count = row._count.photoType
    totalPhotos += count

    const isCanonical = CANONICAL_TYPES.has(value)
    const fixTo = FIXES[value.toLowerCase()]

    let status = ''
    if (isCanonical) {
      status = '  [OK]'
    } else if (fixTo) {
      status = `  [FIX → "${fixTo}"]`
      issues.push({ value, count, fix: fixTo })
    } else {
      status = '  [UNKNOWN - review manually]'
    }

    console.log(`  "${value}": ${count} photos${status}`)
  }

  console.log()
  console.log(`Total photos: ${totalPhotos}`)
  console.log(`Distinct types: ${typeCounts.length}`)
  console.log()

  if (issues.length === 0) {
    console.log('No issues found. All photoType values are canonical.')
    return
  }

  // Step 2: Show planned fixes
  console.log('--- Planned Fixes ---')
  console.log()
  for (const issue of issues) {
    console.log(`  "${issue.value}" → "${issue.fix}"  (${issue.count} photos)`)
  }
  console.log()

  const totalToFix = issues.reduce((sum, i) => i.count, 0)
  console.log(`Total photos to update: ${totalToFix}`)
  console.log()

  if (isDryRun) {
    console.log('DRY RUN complete. Run without --dry-run to apply fixes.')
    return
  }

  // Step 3: Apply fixes
  console.log('--- Applying Fixes ---')
  console.log()

  for (const issue of issues) {
    const result = await prisma.photo.updateMany({
      where: { photoType: issue.value },
      data: { photoType: issue.fix },
    })
    console.log(`  Updated ${result.count} photos: "${issue.value}" → "${issue.fix}"`)
  }

  console.log()

  // Step 4: Show after counts
  const afterCounts = await prisma.photo.groupBy({
    by: ['photoType'],
    _count: { photoType: true },
    orderBy: { _count: { photoType: 'desc' } },
  })

  console.log('--- After Fix: photoType Distribution ---')
  console.log()
  for (const row of afterCounts) {
    const isCanonical = CANONICAL_TYPES.has(row.photoType)
    const marker = isCanonical ? '' : '  [UNKNOWN]'
    console.log(`  "${row.photoType}": ${row._count.photoType} photos${marker}`)
  }

  console.log()
  console.log('Done! All fixes applied.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
