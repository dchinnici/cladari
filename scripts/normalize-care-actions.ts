/**
 * Normalize CareLog action values
 *
 * Finds inconsistent action names and normalizes them to canonical values.
 *
 * Usage:
 *   npx tsx scripts/normalize-care-actions.ts --dry-run   # Preview changes
 *   npx tsx scripts/normalize-care-actions.ts              # Apply changes
 */

import prisma from '../src/lib/prisma';

// Canonical action values and their aliases
const NORMALIZATION_MAP: Record<string, string> = {
  'water': 'watering',
  'calmag': 'watering',       // CalMag is a feed additive applied during watering
  'fertilize': 'fertilizing',
  'fertilise': 'fertilizing',
  'feed': 'fertilizing',
  'repot': 'repotting',
  'prune': 'pruning',
  'treat': 'treatment',
  'mist': 'misting',
  'spray': 'misting',
};

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  CareLog Action Normalizer ${isDryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Get all distinct action values with counts
  const actionCounts = await prisma.careLog.groupBy({
    by: ['action'],
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
  });

  console.log('CURRENT ACTION VALUES:');
  console.log('-'.repeat(40));
  for (const row of actionCounts) {
    const action = row.action;
    const count = row._count.action;
    const normalized = NORMALIZATION_MAP[action] || NORMALIZATION_MAP[action.toLowerCase()];
    const marker = normalized && normalized !== action ? ` --> "${normalized}"` : '';
    console.log(`  "${action}" : ${count}${marker}`);
  }
  console.log(`\n  Total distinct values: ${actionCounts.length}`);
  console.log(`  Total records: ${actionCounts.reduce((sum, r) => sum + r._count.action, 0)}\n`);

  // Step 2: Build the update plan
  const updates: { from: string; to: string; count: number }[] = [];

  for (const row of actionCounts) {
    const action = row.action;
    const count = row._count.action;

    // Check exact match first, then lowercase match
    const normalized = NORMALIZATION_MAP[action] || NORMALIZATION_MAP[action.toLowerCase()];

    if (normalized && normalized !== action) {
      updates.push({ from: action, to: normalized, count });
    }
  }

  if (updates.length === 0) {
    console.log('No normalizations needed. All action values are already canonical.\n');
    await prisma.$disconnect();
    return;
  }

  console.log('PLANNED NORMALIZATIONS:');
  console.log('-'.repeat(40));
  for (const u of updates) {
    console.log(`  "${u.from}" (${u.count} records) --> "${u.to}"`);
  }
  const totalAffected = updates.reduce((sum, u) => sum + u.count, 0);
  console.log(`\n  Total records to update: ${totalAffected}\n`);

  if (isDryRun) {
    console.log('DRY RUN complete. Run without --dry-run to apply changes.\n');
    await prisma.$disconnect();
    return;
  }

  // Step 3: Apply updates
  console.log('APPLYING UPDATES...');
  console.log('-'.repeat(40));

  for (const u of updates) {
    const result = await prisma.careLog.updateMany({
      where: { action: u.from },
      data: { action: u.to },
    });
    console.log(`  "${u.from}" --> "${u.to}" : ${result.count} records updated`);
  }

  // Step 4: Show after counts
  console.log('\nAFTER NORMALIZATION:');
  console.log('-'.repeat(40));
  const afterCounts = await prisma.careLog.groupBy({
    by: ['action'],
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
  });

  for (const row of afterCounts) {
    console.log(`  "${row.action}" : ${row._count.action}`);
  }
  console.log(`\n  Total distinct values: ${afterCounts.length}`);
  console.log(`  Total records: ${afterCounts.reduce((sum, r) => sum + r._count.action, 0)}\n`);

  console.log('Done.\n');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
