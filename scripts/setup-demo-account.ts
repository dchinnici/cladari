/**
 * Setup Demo Account for Cladari
 *
 * This script:
 * 1. Sets the demo account password
 * 2. Clones Dave's data to the demo account
 * 3. Creates ID mappings for related entities
 *
 * Run with: npx tsx scripts/setup-demo-account.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import prisma from '../src/lib/prisma';
import { randomUUID } from 'crypto';

const DAVE_USER_ID = '01b9f666-3b6f-4a7f-8028-5ca833c4b02e';
const DEMO_USER_ID = '8073760b-13dd-4019-b4a2-3506cd222e7e';
const DEMO_PASSWORD = 'CladariDemo2026';

// Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setDemoPassword() {
  console.log('Setting demo account password...');

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    DEMO_USER_ID,
    { password: DEMO_PASSWORD }
  );

  if (error) {
    console.error('Failed to set password:', error.message);
    return false;
  }

  console.log('✓ Password set for demo@cladari.ai');
  return true;
}

async function clearDemoData() {
  console.log('\nClearing existing demo data...');

  // Delete in order of dependencies (children first)
  // Use raw queries to avoid model dependency issues
  const deleteQueries = [
    // ChatLogChunk via join
    `DELETE FROM "ChatLogChunk" WHERE "chatLogId" IN (SELECT id FROM "ChatLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1))`,
    `DELETE FROM "ChatLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "NegativeExample" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "JournalEntry" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "GrowthMetric" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Measurement" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "FloweringCycle" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "CareLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Photo" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Plant" WHERE "userId" = $1`,
    `DELETE FROM "CloneBatch" WHERE "userId" = $1`,
    `DELETE FROM "Seedling" WHERE "seedBatchId" IN (SELECT id FROM "SeedBatch" WHERE "userId" = $1)`,
    `DELETE FROM "SeedBatch" WHERE "userId" = $1`,
    `DELETE FROM "Harvest" WHERE "breedingRecordId" IN (SELECT id FROM "BreedingRecord" WHERE "userId" = $1)`,
    `DELETE FROM "BreedingRecord" WHERE "userId" = $1`,
    `DELETE FROM "Location" WHERE "userId" = $1`,
  ];

  for (const query of deleteQueries) {
    try {
      await prisma.$executeRawUnsafe(query, DEMO_USER_ID);
    } catch (e) {
      // Ignore errors from non-existent tables or data
    }
  }

  console.log('✓ Demo data cleared');
}

async function cloneLocations(): Promise<Map<string, string>> {
  console.log('\nCloning locations...');
  const idMap = new Map<string, string>();

  const locations = await prisma.location.findMany({
    where: { userId: DAVE_USER_ID }
  });

  for (const loc of locations) {
    const newId = randomUUID();
    idMap.set(loc.id, newId);

    await prisma.location.create({
      data: {
        id: newId,
        userId: DEMO_USER_ID,
        name: `Demo - ${loc.name}`, // Prefix to avoid unique constraint
        type: loc.type,
        description: loc.description,
        lightLevel: loc.lightLevel,
        humidity: loc.humidity,
        temperature: loc.temperature,
        isOutdoor: loc.isOutdoor,
        zone: loc.zone,
        shelf: loc.shelf,
        position: loc.position,
        dli: loc.dli,
        vpd: loc.vpd,
        // Skip sensorPushId - demo doesn't need live sensors
        sensorPushId: null,
      }
    });
  }

  console.log(`✓ Cloned ${locations.length} locations`);
  return idMap;
}

async function clonePlants(locationMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\nCloning plants...');
  const idMap = new Map<string, string>();

  const plants = await prisma.plant.findMany({
    where: { userId: DAVE_USER_ID }
  });

  for (const plant of plants) {
    const newId = randomUUID();
    idMap.set(plant.id, newId);

    await prisma.plant.create({
      data: {
        id: newId,
        userId: DEMO_USER_ID,
        plantId: plant.plantId.replace('ANT-', 'DEM-'), // Demo prefix
        accessionDate: plant.accessionDate,
        genus: plant.genus,
        species: plant.species,
        hybridName: plant.hybridName,
        section: plant.section,
        crossNotation: plant.crossNotation,
        generation: plant.generation,
        breeder: plant.breeder,
        breederCode: plant.breederCode,
        acquisitionCost: plant.acquisitionCost,
        propagationType: plant.propagationType,
        locationId: plant.locationId ? locationMap.get(plant.locationId) : null,
        healthStatus: plant.healthStatus,
        conservationStatus: plant.conservationStatus,
        currentPotSize: plant.currentPotSize,
        currentPotType: plant.currentPotType,
        lastRepotDate: plant.lastRepotDate,
        marketValue: plant.marketValue,
        isForSale: plant.isForSale,
        isMother: plant.isMother,
        isEliteGenetics: plant.isEliteGenetics,
        isArchived: plant.isArchived,
        notes: plant.notes,
        tags: plant.tags,
        identifier: plant.identifier,
        // Skip parent relationships for simplicity (can add later if needed)
        femaleParentId: null,
        maleParentId: null,
        cloneSourceId: null,
        breedingRecordId: null,
        cloneBatchId: null,
      }
    });
  }

  console.log(`✓ Cloned ${plants.length} plants`);
  return idMap;
}

async function clonePhotos(plantMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\nCloning photos...');
  const idMap = new Map<string, string>();

  const photos = await prisma.photo.findMany({
    where: { plant: { userId: DAVE_USER_ID } }
  });

  let count = 0;
  for (const photo of photos) {
    if (!photo.plantId || !plantMap.has(photo.plantId)) continue;

    const newId = randomUUID();
    idMap.set(photo.id, newId);

    await prisma.photo.create({
      data: {
        id: newId,
        plantId: plantMap.get(photo.plantId)!,
        url: photo.url,
        // Copy storagePath - demo will use same Supabase Storage files (bucket is public)
        storagePath: photo.storagePath,
        thumbnailPath: photo.thumbnailPath,
        originalFilename: photo.originalFilename,
        photoType: photo.photoType,
        dateTaken: photo.dateTaken,
        notes: photo.notes,
        isCover: photo.isCover,
      }
    });
    count++;
  }

  console.log(`✓ Cloned ${count} photos`);
  return idMap;
}

async function cloneCareLogs(plantMap: Map<string, string>) {
  console.log('\nCloning care logs...');

  const careLogs = await prisma.careLog.findMany({
    where: { plant: { userId: DAVE_USER_ID } }
  });

  let count = 0;
  for (const log of careLogs) {
    if (!plantMap.has(log.plantId)) continue;

    await prisma.careLog.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(log.plantId)!,
        date: log.date,
        action: log.action,
        inputEC: log.inputEC,
        outputEC: log.outputEC,
        inputPH: log.inputPH,
        outputPH: log.outputPH,
        details: log.details,
      }
    });
    count++;
  }

  console.log(`✓ Cloned ${count} care logs`);
}

async function cloneJournalEntries(plantMap: Map<string, string>) {
  console.log('\nCloning journal entries...');

  const entries = await prisma.journalEntry.findMany({
    where: { plant: { userId: DAVE_USER_ID } }
  });

  let count = 0;
  for (const entry of entries) {
    if (!plantMap.has(entry.plantId)) continue;

    await prisma.journalEntry.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(entry.plantId)!,
        timestamp: entry.timestamp,
        entryType: entry.entryType,
        context: entry.context,
        entry: entry.entry,
        referenceType: entry.referenceType,
        author: entry.author,
        tags: entry.tags,
        summary: entry.summary,
        // Skip referenceId as it would need mapping
      }
    });
    count++;
  }

  console.log(`✓ Cloned ${count} journal entries`);
}

async function updateCoverPhotos(plantMap: Map<string, string>, photoMap: Map<string, string>) {
  console.log('\nUpdating cover photo references...');

  const plantsWithCover = await prisma.plant.findMany({
    where: {
      userId: DAVE_USER_ID,
      coverPhotoId: { not: null }
    },
    select: { id: true, coverPhotoId: true }
  });

  let count = 0;
  for (const plant of plantsWithCover) {
    const newPlantId = plantMap.get(plant.id);
    const newPhotoId = plant.coverPhotoId ? photoMap.get(plant.coverPhotoId) : null;

    if (newPlantId && newPhotoId) {
      await prisma.plant.update({
        where: { id: newPlantId },
        data: { coverPhotoId: newPhotoId }
      });
      count++;
    }
  }

  console.log(`✓ Updated ${count} cover photo references`);
}

async function main() {
  console.log('=== CLADARI DEMO ACCOUNT SETUP ===\n');
  console.log('Source user:', DAVE_USER_ID);
  console.log('Demo user:', DEMO_USER_ID);
  console.log('Demo password:', DEMO_PASSWORD);
  console.log('');

  // Step 1: Set password
  const passwordSet = await setDemoPassword();
  if (!passwordSet) {
    console.log('\n⚠️  Password setting failed, but continuing with data clone...');
  }

  // Step 2: Clear existing demo data
  await clearDemoData();

  // Step 3: Clone data in order of dependencies
  const locationMap = await cloneLocations();
  const plantMap = await clonePlants(locationMap);
  const photoMap = await clonePhotos(plantMap);
  await cloneCareLogs(plantMap);
  await cloneJournalEntries(plantMap);
  await updateCoverPhotos(plantMap, photoMap);

  // Summary
  console.log('\n=== DEMO ACCOUNT READY ===');
  console.log('URL: https://www.cladari.ai');
  console.log('Email: demo@cladari.ai');
  console.log('Password: CladariDemo2026');
  console.log('\nNote: Chat logs and embeddings are NOT cloned (keeps demo clean for ML)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
