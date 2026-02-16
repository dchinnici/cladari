/**
 * Comprehensive Data Audit for ML Training & Vector Search Readiness
 * Run: npx tsx scripts/data-audit.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(80));
  console.log('  CLADARI DATA AUDIT — ML Training & Vector Search Readiness');
  console.log('  Run date:', new Date().toISOString());
  console.log('='.repeat(80));

  // --- 1. VOLUME COUNTS ---
  console.log('\n' + '-'.repeat(80));
  console.log('  1. VOLUME COUNTS');
  console.log('-'.repeat(80));

  const [
    plantCount, careLogCount, photoCount, chatLogCount,
    breedingCount, harvestCount, seedBatchCount, seedlingCount,
    cloneBatchCount, taxaCount, measurementCount, traitCount,
    floweringCount, journalCount, chatLogChunkCount, negativeExampleCount,
    geneticsCount, vendorCount, locationCount, feedProductCount,
    archivedPlantCount, activePlantCount
  ] = await Promise.all([
    prisma.plant.count(),
    prisma.careLog.count(),
    prisma.photo.count(),
    prisma.chatLog.count(),
    prisma.breedingRecord.count(),
    prisma.harvest.count(),
    prisma.seedBatch.count(),
    prisma.seedling.count(),
    prisma.cloneBatch.count(),
    prisma.taxonReference.count(),
    prisma.measurement.count(),
    prisma.trait.count(),
    prisma.floweringCycle.count(),
    prisma.plantJournal.count(),
    prisma.chatLogChunk.count(),
    prisma.negativeExample.count(),
    prisma.genetics.count(),
    prisma.vendor.count(),
    prisma.location.count(),
    prisma.feedProduct.count(),
    prisma.plant.count({ where: { isArchived: true } }),
    prisma.plant.count({ where: { isArchived: false } }),
  ]);

  const volumeTable: [string, number][] = [
    ['Plants (total)', plantCount],
    ['  Active', activePlantCount],
    ['  Archived', archivedPlantCount],
    ['Care Logs', careLogCount],
    ['Photos', photoCount],
    ['Chat Logs (AI consultations)', chatLogCount],
    ['Chat Log Chunks (embeddings)', chatLogChunkCount],
    ['Negative Examples (RLHF)', negativeExampleCount],
    ['Breeding Records (crosses)', breedingCount],
    ['Harvests', harvestCount],
    ['Seed Batches', seedBatchCount],
    ['Seedlings', seedlingCount],
    ['Clone Batches', cloneBatchCount],
    ['Taxon References', taxaCount],
    ['Measurements', measurementCount],
    ['Traits', traitCount],
    ['Flowering Cycles', floweringCount],
    ['Journal Entries', journalCount],
    ['Genetics', geneticsCount],
    ['Vendors', vendorCount],
    ['Locations', locationCount],
    ['Feed Products', feedProductCount],
  ];

  for (const [label, count] of volumeTable) {
    console.log(`  ${String(label).padEnd(38)} ${String(count).padStart(6)}`);
  }

  // --- 2. CARE LOG DEPTH ---
  console.log('\n' + '-'.repeat(80));
  console.log('  2. CARE LOG DEPTH PER PLANT');
  console.log('-'.repeat(80));

  const carePerPlant = await prisma.careLog.groupBy({
    by: ['plantId'],
    _count: { id: true },
    where: { plantId: { not: null } },
  });

  const careCounts = carePerPlant.map(c => c._count.id);
  const totalPlantsWithCare = careCounts.length;
  const plantsWithoutCare = plantCount - totalPlantsWithCare;
  const avgCare = careCounts.length > 0 ? (careCounts.reduce((a, b) => a + b, 0) / careCounts.length).toFixed(1) : '0';
  const minCare = careCounts.length > 0 ? Math.min(...careCounts) : 0;
  const maxCare = careCounts.length > 0 ? Math.max(...careCounts) : 0;
  const sortedCare = [...careCounts].sort((a, b) => a - b);
  const median = careCounts.length > 0 ? sortedCare[Math.floor(careCounts.length / 2)] : 0;

  const with10plus = careCounts.filter(c => c >= 10).length;
  const with20plus = careCounts.filter(c => c >= 20).length;
  const with50plus = careCounts.filter(c => c >= 50).length;
  const with100plus = careCounts.filter(c => c >= 100).length;

  console.log(`  Plants with care logs:               ${totalPlantsWithCare}`);
  console.log(`  Plants without care logs:             ${plantsWithoutCare}`);
  console.log(`  Average care logs/plant:              ${avgCare}`);
  console.log(`  Median care logs/plant:               ${median}`);
  console.log(`  Min / Max:                            ${minCare} / ${maxCare}`);
  console.log(`  Plants with 10+ care logs:            ${with10plus}`);
  console.log(`  Plants with 20+ care logs:            ${with20plus}`);
  console.log(`  Plants with 50+ care logs:            ${with50plus}`);
  console.log(`  Plants with 100+ care logs:           ${with100plus}`);

  // Care log action distribution
  const actionGroups = await prisma.careLog.groupBy({
    by: ['action'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log('\n  Care Log Action Distribution:');
  for (const ag of actionGroups) {
    const pct = ((ag._count.id / careLogCount) * 100).toFixed(1);
    console.log(`    ${ag.action.padEnd(20)} ${String(ag._count.id).padStart(6)}  (${pct}%)`);
  }

  // --- 3. PHOTO DEPTH ---
  console.log('\n' + '-'.repeat(80));
  console.log('  3. PHOTO DEPTH PER PLANT');
  console.log('-'.repeat(80));

  const photosPerPlant = await prisma.photo.groupBy({
    by: ['plantId'],
    _count: { id: true },
    where: { plantId: { not: null } },
  });

  const photoCounts = photosPerPlant.map(p => p._count.id);
  const plantsWithPhotos = photoCounts.length;
  const plantsWithoutPhotos = plantCount - plantsWithPhotos;
  const avgPhotos = photoCounts.length > 0 ? (photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length).toFixed(1) : '0';
  const maxPhotos = photoCounts.length > 0 ? Math.max(...photoCounts) : 0;

  const with1to5 = photoCounts.filter(c => c >= 1 && c <= 5).length;
  const with5to10 = photoCounts.filter(c => c > 5 && c <= 10).length;
  const with10plusPhotos = photoCounts.filter(c => c > 10).length;
  const with20plusPhotos = photoCounts.filter(c => c > 20).length;

  const orphanPhotos = await prisma.photo.count({ where: { plantId: null } });

  const photoTypeGroups = await prisma.photo.groupBy({
    by: ['photoType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log(`  Plants with photos:                   ${plantsWithPhotos}`);
  console.log(`  Plants without photos:                ${plantsWithoutPhotos}`);
  console.log(`  Average photos/plant:                 ${avgPhotos}`);
  console.log(`  Max photos for one plant:             ${maxPhotos}`);
  console.log(`  Plants with 1-5 photos:               ${with1to5}`);
  console.log(`  Plants with 6-10 photos:              ${with5to10}`);
  console.log(`  Plants with 11+ photos:               ${with10plusPhotos}`);
  console.log(`  Plants with 20+ photos:               ${with20plusPhotos}`);
  console.log(`  Orphan photos (no plantId):           ${orphanPhotos}`);

  console.log('\n  Photo Type Distribution:');
  for (const pt of photoTypeGroups) {
    const pct = ((pt._count.id / photoCount) * 100).toFixed(1);
    console.log(`    ${(pt.photoType || 'null').padEnd(20)} ${String(pt._count.id).padStart(6)}  (${pct}%)`);
  }

  // --- 4. CHAT LOG QUALITY ---
  console.log('\n' + '-'.repeat(80));
  console.log('  4. CHAT LOG QUALITY & EMBEDDING STATUS');
  console.log('-'.repeat(80));

  const qualityGroups = await prisma.chatLog.groupBy({
    by: ['qualityScore'],
    _count: { id: true },
    orderBy: { qualityScore: 'asc' },
  });

  const unscored = await prisma.chatLog.count({ where: { qualityScore: null } });

  const embeddingResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "ChatLog" WHERE embedding IS NOT NULL
  `;
  const chatLogsWithEmbeddings = Number(embeddingResult[0].count);

  const chunkEmbeddingResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "ChatLogChunk" WHERE embedding IS NOT NULL
  `;
  const chunksWithEmbeddings = Number(chunkEmbeddingResult[0].count);

  const confidenceGroups = await prisma.chatLog.groupBy({
    by: ['confidence'],
    _count: { id: true },
  });

  console.log(`  Total Chat Logs:                      ${chatLogCount}`);
  console.log(`  Unscored (null quality):              ${unscored}`);
  console.log('\n  Quality Score Distribution:');
  const qualityLabels: Record<number, string> = {
    0: 'marginal',
    1: 'acceptable',
    2: 'good',
    3: 'excellent',
    4: 'reference',
  };
  for (const qg of qualityGroups) {
    const label = qg.qualityScore !== null ? `${qg.qualityScore} (${qualityLabels[qg.qualityScore] || '?'})` : 'null';
    console.log(`    Score ${label.padEnd(24)} ${String(qg._count.id).padStart(4)}`);
  }

  console.log(`\n  Embedding Coverage:`);
  console.log(`    ChatLogs with embeddings:           ${chatLogsWithEmbeddings} / ${chatLogCount}`);
  console.log(`    ChatLogChunks total:                ${chatLogChunkCount}`);
  console.log(`    ChatLogChunks with embeddings:      ${chunksWithEmbeddings} / ${chatLogChunkCount}`);
  console.log(`    Negative Examples (RLHF):           ${negativeExampleCount}`);

  console.log('\n  Confidence Distribution:');
  for (const cg of confidenceGroups) {
    console.log(`    ${cg.confidence.padEnd(24)} ${String(cg._count.id).padStart(4)}`);
  }

  // --- 5. EC/pH DATA COVERAGE ---
  console.log('\n' + '-'.repeat(80));
  console.log('  5. EC/pH DATA COVERAGE');
  console.log('-'.repeat(80));

  const [inputEC, inputPH, outputEC, outputPH, anyEC, anyPH, fullSubstrate] = await Promise.all([
    prisma.careLog.count({ where: { inputEC: { not: null } } }),
    prisma.careLog.count({ where: { inputPH: { not: null } } }),
    prisma.careLog.count({ where: { outputEC: { not: null } } }),
    prisma.careLog.count({ where: { outputPH: { not: null } } }),
    prisma.careLog.count({ where: { OR: [{ inputEC: { not: null } }, { outputEC: { not: null } }] } }),
    prisma.careLog.count({ where: { OR: [{ inputPH: { not: null } }, { outputPH: { not: null } }] } }),
    prisma.careLog.count({
      where: {
        AND: [
          { inputEC: { not: null } },
          { inputPH: { not: null } },
          { outputEC: { not: null } },
          { outputPH: { not: null } },
        ]
      }
    }),
  ]);

  const pctOf = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%';

  console.log(`  Total care logs:                      ${careLogCount}`);
  console.log(`  With inputEC:                         ${inputEC}  (${pctOf(inputEC, careLogCount)})`);
  console.log(`  With inputPH:                         ${inputPH}  (${pctOf(inputPH, careLogCount)})`);
  console.log(`  With outputEC:                        ${outputEC}  (${pctOf(outputEC, careLogCount)})`);
  console.log(`  With outputPH:                        ${outputPH}  (${pctOf(outputPH, careLogCount)})`);
  console.log(`  With any EC data:                     ${anyEC}  (${pctOf(anyEC, careLogCount)})`);
  console.log(`  With any pH data:                     ${anyPH}  (${pctOf(anyPH, careLogCount)})`);
  console.log(`  Full substrate profile (all 4):       ${fullSubstrate}  (${pctOf(fullSubstrate, careLogCount)})`);

  const plantsWithECpH = await prisma.careLog.groupBy({
    by: ['plantId'],
    where: {
      plantId: { not: null },
      OR: [
        { inputEC: { not: null } },
        { outputEC: { not: null } },
      ]
    },
  });
  console.log(`  Plants with any EC/pH data:           ${plantsWithECpH.length} / ${plantCount}`);

  // --- 6. TEMPORAL COVERAGE ---
  console.log('\n' + '-'.repeat(80));
  console.log('  6. TEMPORAL COVERAGE');
  console.log('-'.repeat(80));

  const dateRange = await prisma.careLog.aggregate({
    _min: { date: true },
    _max: { date: true },
  });

  const earliest = dateRange._min.date;
  const latest = dateRange._max.date;
  const spanDays = earliest && latest ? Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  console.log(`  Earliest care log:                    ${earliest?.toISOString().split('T')[0] || 'N/A'}`);
  console.log(`  Latest care log:                      ${latest?.toISOString().split('T')[0] || 'N/A'}`);
  console.log(`  Total span:                           ${spanDays} days`);

  // Average days between care events per plant
  const allCareLogs = await prisma.careLog.findMany({
    where: { plantId: { not: null } },
    select: { plantId: true, date: true },
    orderBy: [{ plantId: 'asc' }, { date: 'asc' }],
  });

  const plantIntervals: Map<string, number[]> = new Map();
  let prevPlantId: string | null = null;
  let prevDate: Date | null = null;

  for (const log of allCareLogs) {
    if (log.plantId === prevPlantId && prevDate) {
      const interval = (log.date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (interval > 0) {
        const arr = plantIntervals.get(log.plantId!) || [];
        arr.push(interval);
        plantIntervals.set(log.plantId!, arr);
      }
    }
    prevPlantId = log.plantId;
    prevDate = log.date;
  }

  const avgIntervalsPerPlant: number[] = [];
  for (const [, intervals] of plantIntervals) {
    if (intervals.length > 0) {
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      avgIntervalsPerPlant.push(avg);
    }
  }

  const overallAvgInterval = avgIntervalsPerPlant.length > 0
    ? (avgIntervalsPerPlant.reduce((a, b) => a + b, 0) / avgIntervalsPerPlant.length).toFixed(1)
    : 'N/A';
  const minInterval = avgIntervalsPerPlant.length > 0 ? Math.min(...avgIntervalsPerPlant).toFixed(1) : 'N/A';
  const maxInterval = avgIntervalsPerPlant.length > 0 ? Math.max(...avgIntervalsPerPlant).toFixed(1) : 'N/A';

  console.log(`  Avg days between care events/plant:   ${overallAvgInterval}`);
  console.log(`  Min avg interval (most frequent):     ${minInterval} days`);
  console.log(`  Max avg interval (least frequent):    ${maxInterval} days`);

  const photoDateRange = await prisma.photo.aggregate({
    _min: { dateTaken: true },
    _max: { dateTaken: true },
  });
  console.log(`  Earliest photo:                       ${photoDateRange._min.dateTaken?.toISOString().split('T')[0] || 'N/A'}`);
  console.log(`  Latest photo:                         ${photoDateRange._max.dateTaken?.toISOString().split('T')[0] || 'N/A'}`);

  // --- 7. TAXA EMBEDDINGS ---
  console.log('\n' + '-'.repeat(80));
  console.log('  7. TAXA REFERENCE & EMBEDDINGS');
  console.log('-'.repeat(80));

  const taxaEmbeddingResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "TaxonReference" WHERE embedding IS NOT NULL
  `;
  const taxaWithEmbeddings = Number(taxaEmbeddingResult[0].count);

  const taxaSections = await prisma.taxonReference.groupBy({
    by: ['section'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const taxaSources = await prisma.$queryRaw<Array<{ source: string | null; count: bigint }>>`
    SELECT source, COUNT(*) as count FROM "TaxonReference" GROUP BY source ORDER BY count DESC
  `;

  console.log(`  Total TaxonReference records:         ${taxaCount}`);
  console.log(`  With embeddings:                      ${taxaWithEmbeddings} / ${taxaCount}`);
  console.log(`  Embedding coverage:                   ${pctOf(taxaWithEmbeddings, taxaCount)}`);

  console.log('\n  Taxa by Section:');
  for (const ts of taxaSections) {
    console.log(`    ${(ts.section || 'null').padEnd(28)} ${String(ts._count.id).padStart(4)}`);
  }

  console.log('\n  Taxa by Source:');
  for (const ts of taxaSources) {
    console.log(`    ${(ts.source || 'null').padEnd(28)} ${String(Number(ts.count)).padStart(4)}`);
  }

  // --- 8. BREEDING PIPELINE ---
  console.log('\n' + '-'.repeat(80));
  console.log('  8. BREEDING PIPELINE');
  console.log('-'.repeat(80));

  const crossesWithHarvests = await prisma.breedingRecord.count({
    where: { harvests: { some: {} } },
  });

  const crossesWithSeedBatches = await prisma.harvest.findMany({
    where: { seedBatches: { some: {} } },
    select: { breedingRecordId: true },
    distinct: ['breedingRecordId'],
  });

  const crossesWithSeedlings = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT br.id) as count
    FROM "BreedingRecord" br
    JOIN "Harvest" h ON h."breedingRecordId" = br.id
    JOIN "SeedBatch" sb ON sb."harvestId" = h.id
    JOIN "Seedling" s ON s."seedBatchId" = sb.id
  `;

  const graduatedSeedlings = await prisma.seedling.count({
    where: { graduatedToPlantId: { not: null } },
  });

  const crossTypes = await prisma.breedingRecord.groupBy({
    by: ['crossCategory'],
    _count: { id: true },
  });

  console.log(`  Breeding Records (crosses):           ${breedingCount}`);
  console.log(`  Crosses with harvests:                ${crossesWithHarvests}`);
  console.log(`  Crosses with seed batches:            ${crossesWithSeedBatches.length}`);
  console.log(`  Crosses reaching seedling stage:      ${Number(crossesWithSeedlings[0].count)}`);
  console.log(`  Total harvests:                       ${harvestCount}`);
  console.log(`  Total seed batches:                   ${seedBatchCount}`);
  console.log(`  Total seedlings:                      ${seedlingCount}`);
  console.log(`  Graduated seedlings (-> Plant):       ${graduatedSeedlings}`);
  console.log(`  Clone batches:                        ${cloneBatchCount}`);

  console.log('\n  Cross Category Distribution:');
  for (const ct of crossTypes) {
    console.log(`    ${(ct.crossCategory || 'null').padEnd(24)} ${String(ct._count.id).padStart(4)}`);
  }

  // --- 9. DATA FRESHNESS ---
  console.log('\n' + '-'.repeat(80));
  console.log('  9. DATA FRESHNESS');
  console.log('-'.repeat(80));

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [care7, care30, care90] = await Promise.all([
    prisma.careLog.count({ where: { date: { gte: d7 } } }),
    prisma.careLog.count({ where: { date: { gte: d30 } } }),
    prisma.careLog.count({ where: { date: { gte: d90 } } }),
  ]);

  const [photos7, photos30, photos90] = await Promise.all([
    prisma.photo.count({ where: { dateTaken: { gte: d7 } } }),
    prisma.photo.count({ where: { dateTaken: { gte: d30 } } }),
    prisma.photo.count({ where: { dateTaken: { gte: d90 } } }),
  ]);

  const [chat7, chat30, chat90] = await Promise.all([
    prisma.chatLog.count({ where: { conversationDate: { gte: d7 } } }),
    prisma.chatLog.count({ where: { conversationDate: { gte: d30 } } }),
    prisma.chatLog.count({ where: { conversationDate: { gte: d90 } } }),
  ]);

  const [journal7, journal30, journal90] = await Promise.all([
    prisma.plantJournal.count({ where: { timestamp: { gte: d7 } } }),
    prisma.plantJournal.count({ where: { timestamp: { gte: d30 } } }),
    prisma.plantJournal.count({ where: { timestamp: { gte: d90 } } }),
  ]);

  console.log(`  ${''.padEnd(30)} ${'7d'.padStart(6)}  ${'30d'.padStart(6)}  ${'90d'.padStart(6)}`);
  console.log(`  ${'Care Logs'.padEnd(30)} ${String(care7).padStart(6)}  ${String(care30).padStart(6)}  ${String(care90).padStart(6)}`);
  console.log(`  ${'Photos'.padEnd(30)} ${String(photos7).padStart(6)}  ${String(photos30).padStart(6)}  ${String(photos90).padStart(6)}`);
  console.log(`  ${'Chat Logs'.padEnd(30)} ${String(chat7).padStart(6)}  ${String(chat30).padStart(6)}  ${String(chat90).padStart(6)}`);
  console.log(`  ${'Journal Entries'.padEnd(30)} ${String(journal7).padStart(6)}  ${String(journal30).padStart(6)}  ${String(journal90).padStart(6)}`);

  const lastCare = await prisma.careLog.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
  const lastPhoto = await prisma.photo.findFirst({ orderBy: { dateTaken: 'desc' }, select: { dateTaken: true } });
  const lastChat = await prisma.chatLog.findFirst({ orderBy: { conversationDate: 'desc' }, select: { conversationDate: true } });
  const lastJournal = await prisma.plantJournal.findFirst({ orderBy: { timestamp: 'desc' }, select: { timestamp: true } });

  console.log('\n  Most Recent Activity:');
  console.log(`    Last care log:                      ${lastCare?.date.toISOString().split('T')[0] || 'N/A'}`);
  console.log(`    Last photo:                         ${lastPhoto?.dateTaken.toISOString().split('T')[0] || 'N/A'}`);
  console.log(`    Last chat log:                      ${lastChat?.conversationDate.toISOString().split('T')[0] || 'N/A'}`);
  console.log(`    Last journal entry:                 ${lastJournal?.timestamp.toISOString().split('T')[0] || 'N/A'}`);

  // --- 10. ML READINESS SUMMARY ---
  console.log('\n' + '-'.repeat(80));
  console.log('  10. ML TRAINING READINESS ASSESSMENT');
  console.log('-'.repeat(80));

  const richPlantIds = new Set(
    carePerPlant.filter(c => c._count.id >= 10).map(c => c.plantId).filter(Boolean)
  );
  const richPhotoPlantIds = new Set(
    photosPerPlant.filter(p => p._count.id >= 5).map(p => p.plantId).filter(Boolean)
  );
  const fullyRichPlants = [...richPlantIds].filter(id => id && richPhotoPlantIds.has(id)).length;

  const plantsWithTemporalDepth = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM (
      SELECT "plantId",
             EXTRACT(DAY FROM (MAX(date) - MIN(date))) as span_days
      FROM "CareLog"
      WHERE "plantId" IS NOT NULL
      GROUP BY "plantId"
      HAVING EXTRACT(DAY FROM (MAX(date) - MIN(date))) >= 60
    ) sub
  `;

  const journalTypes = await prisma.plantJournal.groupBy({
    by: ['entryType'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log('  ML-Ready Data Assets:');
  console.log(`    Plants with 10+ care logs AND 5+ photos:  ${fullyRichPlants}`);
  console.log(`    Plants with 60+ days of care data:        ${Number(plantsWithTemporalDepth[0].count)}`);
  console.log(`    Chat logs scored >= 3 (training quality):  ${qualityGroups.filter(q => q.qualityScore !== null && q.qualityScore >= 3).reduce((sum, q) => sum + q._count.id, 0)}`);
  console.log(`    Negative examples for DPO/RLHF:          ${negativeExampleCount}`);
  console.log(`    Full EC/pH substrate profiles:            ${fullSubstrate}`);
  console.log(`    Taxa with embeddings (semantic search):   ${taxaWithEmbeddings}`);
  console.log(`    ChatLog chunks with embeddings:           ${chunksWithEmbeddings}`);

  console.log('\n  Journal Entry Type Distribution:');
  for (const jt of journalTypes) {
    console.log(`    ${(jt.entryType || 'null').padEnd(24)} ${String(jt._count.id).padStart(6)}`);
  }

  // --- 11. TOP PLANTS BY DATA RICHNESS ---
  console.log('\n' + '-'.repeat(80));
  console.log('  11. TOP 10 PLANTS BY DATA RICHNESS');
  console.log('-'.repeat(80));

  const plantDataMap: Map<string, { plantId: string; care: number; photos: number; chats: number; measurements: number; traits: number }> = new Map();

  const allPlants = await prisma.plant.findMany({
    select: { id: true, plantId: true, species: true, hybridName: true },
  });

  for (const p of allPlants) {
    plantDataMap.set(p.id, { plantId: p.plantId, care: 0, photos: 0, chats: 0, measurements: 0, traits: 0 });
  }

  for (const c of carePerPlant) {
    if (c.plantId && plantDataMap.has(c.plantId)) {
      plantDataMap.get(c.plantId)!.care = c._count.id;
    }
  }

  for (const p of photosPerPlant) {
    if (p.plantId && plantDataMap.has(p.plantId)) {
      plantDataMap.get(p.plantId)!.photos = p._count.id;
    }
  }

  const chatsPerPlant = await prisma.chatLog.groupBy({
    by: ['plantId'],
    _count: { id: true },
  });
  for (const c of chatsPerPlant) {
    if (plantDataMap.has(c.plantId)) {
      plantDataMap.get(c.plantId)!.chats = c._count.id;
    }
  }

  const measurementsPerPlant = await prisma.measurement.groupBy({
    by: ['plantId'],
    _count: { id: true },
  });
  for (const m of measurementsPerPlant) {
    if (plantDataMap.has(m.plantId)) {
      plantDataMap.get(m.plantId)!.measurements = m._count.id;
    }
  }

  const traitsPerPlant = await prisma.trait.groupBy({
    by: ['plantId'],
    _count: { id: true },
  });
  for (const t of traitsPerPlant) {
    if (plantDataMap.has(t.plantId)) {
      plantDataMap.get(t.plantId)!.traits = t._count.id;
    }
  }

  // Richness score: weighted sum
  const ranked = [...plantDataMap.entries()].map(([id, d]) => ({
    id,
    ...d,
    score: d.care * 1 + d.photos * 2 + d.chats * 5 + d.measurements * 3 + d.traits * 2,
  })).sort((a, b) => b.score - a.score).slice(0, 10);

  const topPlantDetails = await prisma.plant.findMany({
    where: { id: { in: ranked.map(r => r.id) } },
    select: { id: true, plantId: true, species: true, hybridName: true },
  });
  const nameMap = new Map(topPlantDetails.map(p => [p.id, p]));

  console.log(`  ${'Plant ID'.padEnd(18)} ${'Name'.padEnd(24)} ${'Care'.padStart(5)} ${'Photo'.padStart(6)} ${'Chat'.padStart(5)} ${'Meas'.padStart(5)} ${'Trait'.padStart(6)} ${'Score'.padStart(6)}`);
  for (const r of ranked) {
    const p = nameMap.get(r.id);
    const name = (p?.hybridName || p?.species || '').slice(0, 22);
    console.log(`  ${(p?.plantId || '?').padEnd(18)} ${name.padEnd(24)} ${String(r.care).padStart(5)} ${String(r.photos).padStart(6)} ${String(r.chats).padStart(5)} ${String(r.measurements).padStart(5)} ${String(r.traits).padStart(6)} ${String(r.score).padStart(6)}`);
  }

  // --- DONE ---
  console.log('\n' + '='.repeat(80));
  console.log('  AUDIT COMPLETE');
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Audit failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
