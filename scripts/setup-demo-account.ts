/**
 * Setup Rich Demo Account for Cladari
 *
 * Strategy: Full clone of Dave's account → manual cull → synthetic breeding data
 *
 * Phase 1: Cleanup + Auth/Profile setup
 * Phase 2: Full clone of Dave's account (all plants, all data, -D suffixed IDs)
 * Phase 3: Synthetic breeding pipeline (8 plants, 3 crosses layered on top)
 * Phase 4: Wire synthetic lineage
 *
 * Idempotent: safe to re-run (clears all demo data first).
 * After running, Dave can manually delete plants that aren't demo-worthy.
 *
 * Run with: npx tsx scripts/setup-demo-account.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import prisma from '../src/lib/prisma';
import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DAVE_USER_ID = '01b9f666-3b6f-4a7f-8028-5ca833c4b02e';
const DEMO_USER_ID = '8073760b-13dd-4019-b4a2-3506cd222e7e';
const DEMO_EMAIL = 'demo@cladari.co';
const DEMO_PASSWORD = 'CladariDemo2026';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ID mappings (old → new) shared across phases
const locationMap = new Map<string, string>();
const plantMap = new Map<string, string>();
const photoMap = new Map<string, string>();
const breedingRecordMap = new Map<string, string>();
const harvestMap = new Map<string, string>();
const seedBatchMap = new Map<string, string>();
const cloneBatchMap = new Map<string, string>();

// Track synthetic plant IDs by plantId for lineage wiring
const syntheticPlantDbIds = new Map<string, string>();

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: CLEANUP + AUTH/PROFILE
// ═══════════════════════════════════════════════════════════════════════════

async function setupAuth() {
  console.log('Setting up demo auth...');

  // Try update first; if user doesn't exist, create them
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    DEMO_USER_ID,
    { password: DEMO_PASSWORD, email: DEMO_EMAIL, email_confirm: true }
  );

  if (updateError) {
    console.log(`  Update failed (${updateError.message}), creating user...`);

    // Delete any existing user with this email first
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);
    if (existing) {
      console.log(`  Deleting existing auth user ${existing.id} with email ${DEMO_EMAIL}...`);
      await supabaseAdmin.auth.admin.deleteUser(existing.id);
    }

    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (createError) {
      console.error('Failed to create auth user:', createError.message);
      return false;
    }
    console.log(`✓ Auth user created: ${DEMO_EMAIL}`);
    return true;
  }

  console.log(`✓ Auth updated: ${DEMO_EMAIL}`);
  return true;
}

async function clearDemoData() {
  console.log('\nClearing ALL existing demo data...');

  const deleteQueries = [
    // AI/ML tables
    `DELETE FROM "ChatLogChunk" WHERE "chatLogId" IN (SELECT id FROM "ChatLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1))`,
    `DELETE FROM "ChatLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "NegativeExample" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,

    // Plant child tables
    `DELETE FROM "PlantJournal" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "GrowthMetric" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Measurement" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "FloweringCycle" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Trait" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Genetics" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "CareLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,

    // Photos (polymorphic)
    `DELETE FROM "Photo" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "userId" = $1)`,
    `DELETE FROM "Photo" WHERE "breedingRecordId" IN (SELECT id FROM "BreedingRecord" WHERE "userId" = $1)`,
    `DELETE FROM "Photo" WHERE "seedBatchId" IN (SELECT sb.id FROM "SeedBatch" sb JOIN "Harvest" h ON sb."harvestId" = h.id JOIN "BreedingRecord" br ON h."breedingRecordId" = br.id WHERE br."userId" = $1)`,
    `DELETE FROM "Photo" WHERE "cloneBatchId" IN (SELECT id FROM "CloneBatch" WHERE "userId" = $1)`,

    // Breeding pipeline (bottom-up)
    `DELETE FROM "Seedling" WHERE "seedBatchId" IN (SELECT sb.id FROM "SeedBatch" sb JOIN "Harvest" h ON sb."harvestId" = h.id JOIN "BreedingRecord" br ON h."breedingRecordId" = br.id WHERE br."userId" = $1)`,
    `DELETE FROM "SeedBatch" WHERE "harvestId" IN (SELECT h.id FROM "Harvest" h JOIN "BreedingRecord" br ON h."breedingRecordId" = br.id WHERE br."userId" = $1)`,
    `DELETE FROM "Harvest" WHERE "breedingRecordId" IN (SELECT id FROM "BreedingRecord" WHERE "userId" = $1)`,

    // Clear plant FK refs before deleting breeding records and plants
    `UPDATE "Plant" SET "femaleParentId" = NULL, "maleParentId" = NULL, "cloneSourceId" = NULL, "breedingRecordId" = NULL, "cloneBatchId" = NULL WHERE "userId" = $1`,

    `DELETE FROM "BreedingRecord" WHERE "userId" = $1`,

    // Clone batches
    `DELETE FROM "CareLog" WHERE "cloneBatchId" IN (SELECT id FROM "CloneBatch" WHERE "userId" = $1)`,
    `DELETE FROM "CloneBatch" WHERE "userId" = $1`,

    // Plants, vendors, locations
    `DELETE FROM "Plant" WHERE "userId" = $1`,
    `DELETE FROM "Purchase" WHERE "vendorId" IN (SELECT id FROM "Vendor" WHERE "userId" = $1)`,
    `DELETE FROM "Vendor" WHERE "userId" = $1`,
    `DELETE FROM "Location" WHERE "userId" = $1`,

    // Clean orphaned demo data from prior runs (old DEM- prefix scheme, old location names)
    `DELETE FROM "CareLog" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "Photo" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "PlantJournal" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "FloweringCycle" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "Trait" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "Genetics" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "Measurement" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `DELETE FROM "GrowthMetric" WHERE "plantId" IN (SELECT id FROM "Plant" WHERE "plantId" LIKE 'DEM-%')`,
    `UPDATE "Plant" SET "femaleParentId" = NULL, "maleParentId" = NULL, "cloneSourceId" = NULL, "breedingRecordId" = NULL, "cloneBatchId" = NULL WHERE "plantId" LIKE 'DEM-%'`,
    `DELETE FROM "Plant" WHERE "plantId" LIKE 'DEM-%'`,
    `DELETE FROM "Location" WHERE "name" LIKE 'Demo:%' OR "name" LIKE 'Demo -%' OR "name" LIKE '%(Demo)'`,
  ];

  for (const query of deleteQueries) {
    try {
      await prisma.$executeRawUnsafe(query, DEMO_USER_ID);
    } catch (e: any) {
      if (!e.message?.includes('does not exist')) {
        console.warn(`  ⚠ ${e.message?.slice(0, 100)}`);
      }
    }
  }

  console.log('✓ Demo data cleared');
}

async function ensureProfile() {
  console.log('\nEnsuring demo profile...');
  const existing = await prisma.profile.findUnique({ where: { id: DEMO_USER_ID } });
  if (existing) {
    await prisma.profile.update({
      where: { id: DEMO_USER_ID },
      data: { email: DEMO_EMAIL, displayName: 'Ashley (Demo)' },
    });
  } else {
    await prisma.profile.create({
      data: {
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        displayName: 'Ashley (Demo)',
        tier: 'pro',
        maxPlants: 200,
      },
    });
  }
  console.log('✓ Profile ready');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: FULL CLONE OF DAVE'S ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════

async function cloneAllLocations() {
  console.log('\nCloning all locations...');

  const locations = await prisma.location.findMany({
    where: { userId: DAVE_USER_ID },
  });

  for (const loc of locations) {
    const newId = randomUUID();
    locationMap.set(loc.id, newId);

    await prisma.location.create({
      data: {
        id: newId,
        userId: DEMO_USER_ID,
        name: `Demo: ${loc.name}`,
        type: loc.type,
        lightLevel: loc.lightLevel,
        humidity: loc.humidity,
        temperature: loc.temperature,
        isOutdoor: loc.isOutdoor,
        zone: loc.zone,
        shelf: loc.shelf,
        position: loc.position,
        dli: loc.dli,
        vpd: loc.vpd,
        sensorPushId: null, // Demo doesn't need live sensors
        notes: loc.notes,
      },
    });
  }

  console.log(`✓ Cloned ${locations.length} locations`);
}

async function cloneAllVendors() {
  console.log('\nCloning vendors...');
  const vendorMap = new Map<string, string>();

  const vendors = await prisma.vendor.findMany({
    where: { userId: DAVE_USER_ID },
  });

  for (const v of vendors) {
    const newId = randomUUID();
    vendorMap.set(v.id, newId);

    await prisma.vendor.create({
      data: {
        id: newId,
        userId: DEMO_USER_ID,
        name: `${v.name} (Demo)`,
        type: v.type,
        location: v.location,
        country: v.country,
        reputationScore: v.reputationScore,
        specialties: v.specialties,
        contactInfo: v.contactInfo,
        website: v.website,
        instagram: v.instagram,
        notes: v.notes,
      },
    });
  }

  console.log(`✓ Cloned ${vendors.length} vendors`);
  return vendorMap;
}

async function cloneAllPlants(vendorMap: Map<string, string>) {
  console.log('\nCloning ALL plants...');

  const plants = await prisma.plant.findMany({
    where: { userId: DAVE_USER_ID },
  });

  // First pass: create all plants without lineage refs
  for (const plant of plants) {
    const newId = randomUUID();
    plantMap.set(plant.id, newId);

    await prisma.plant.create({
      data: {
        id: newId,
        userId: DEMO_USER_ID,
        plantId: `${plant.plantId}-D`,
        accessionDate: plant.accessionDate,
        genus: plant.genus,
        section: plant.section,
        species: plant.species,
        hybridName: plant.hybridName,
        crossNotation: plant.crossNotation,
        generation: plant.generation,
        breeder: plant.breeder,
        breederCode: plant.breederCode,
        vendorId: plant.vendorId ? vendorMap.get(plant.vendorId) ?? null : null,
        acquisitionCost: plant.acquisitionCost,
        propagationType: plant.propagationType,
        locationId: plant.locationId ? locationMap.get(plant.locationId) ?? null : null,
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
        archivedAt: plant.archivedAt,
        archiveReason: plant.archiveReason,
        notes: plant.notes,
        tags: plant.tags,
        // Lineage wired in second pass
        femaleParentId: null,
        maleParentId: null,
        cloneSourceId: null,
        breedingRecordId: null,
        cloneBatchId: null,
      },
    });
  }

  // Second pass: wire lineage within the cloned set
  let lineageCount = 0;
  for (const plant of plants) {
    const newId = plantMap.get(plant.id)!;
    const updates: Record<string, string> = {};

    if (plant.femaleParentId && plantMap.has(plant.femaleParentId)) {
      updates.femaleParentId = plantMap.get(plant.femaleParentId)!;
    }
    if (plant.maleParentId && plantMap.has(plant.maleParentId)) {
      updates.maleParentId = plantMap.get(plant.maleParentId)!;
    }
    if (plant.cloneSourceId && plantMap.has(plant.cloneSourceId)) {
      updates.cloneSourceId = plantMap.get(plant.cloneSourceId)!;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.plant.update({ where: { id: newId }, data: updates });
      lineageCount++;
    }
  }

  console.log(`✓ Cloned ${plants.length} plants (${lineageCount} with internal lineage)`);
}

async function cloneAllPhotos() {
  console.log('\nCloning photos...');

  const photos = await prisma.photo.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const photo of photos) {
    if (!photo.plantId || !plantMap.has(photo.plantId)) continue;

    const newId = randomUUID();
    photoMap.set(photo.id, newId);

    await prisma.photo.create({
      data: {
        id: newId,
        plantId: plantMap.get(photo.plantId)!,
        url: photo.url,
        storagePath: photo.storagePath,
        thumbnailPath: photo.thumbnailPath,
        originalFilename: photo.originalFilename,
        photoType: photo.photoType,
        photoContext: photo.photoContext,
        dateTaken: photo.dateTaken,
        notes: photo.notes,
      },
    });
    count++;
  }

  // Restore cover photo references
  const plantsWithCover = await prisma.plant.findMany({
    where: { userId: DAVE_USER_ID, coverPhotoId: { not: null } },
    select: { id: true, coverPhotoId: true },
  });

  let coverCount = 0;
  for (const plant of plantsWithCover) {
    const newPlantId = plantMap.get(plant.id);
    const newPhotoId = plant.coverPhotoId ? photoMap.get(plant.coverPhotoId) : null;
    if (newPlantId && newPhotoId) {
      await prisma.plant.update({
        where: { id: newPlantId },
        data: { coverPhotoId: newPhotoId },
      });
      coverCount++;
    }
  }

  console.log(`✓ Cloned ${count} photos, restored ${coverCount} cover photos`);
}

async function cloneAllCareLogs() {
  console.log('\nCloning care logs...');

  const careLogs = await prisma.careLog.findMany({
    where: { plant: { userId: DAVE_USER_ID }, plantId: { not: null } },
  });

  let count = 0;
  for (const log of careLogs) {
    if (!log.plantId || !plantMap.has(log.plantId)) continue;

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
        isBaselineFeed: log.isBaselineFeed,
        feedComponents: log.feedComponents,
        details: log.details,
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} care logs`);
}

async function cloneAllJournalEntries() {
  console.log('\nCloning journal entries...');

  const entries = await prisma.plantJournal.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const entry of entries) {
    if (!plantMap.has(entry.plantId)) continue;

    await prisma.plantJournal.create({
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
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} journal entries`);
}

async function cloneAllMeasurements() {
  console.log('\nCloning measurements...');

  const measurements = await prisma.measurement.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const m of measurements) {
    if (!plantMap.has(m.plantId)) continue;

    await prisma.measurement.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(m.plantId)!,
        measurementDate: m.measurementDate,
        leafLength: m.leafLength,
        leafWidth: m.leafWidth,
        petioleLength: m.petioleLength,
        internodeLength: m.internodeLength,
        primaryVeinColor: m.primaryVeinColor,
        flushColor: m.flushColor,
        petioleColor: m.petioleColor,
        texture: m.texture,
        vigorScore: m.vigorScore,
        leafCount: m.leafCount,
        height: m.height,
        notes: m.notes,
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} measurements`);
}

async function cloneAllFloweringCycles() {
  console.log('\nCloning flowering cycles...');

  const cycles = await prisma.floweringCycle.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const c of cycles) {
    if (!plantMap.has(c.plantId)) continue;

    await prisma.floweringCycle.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(c.plantId)!,
        spatheEmergence: c.spatheEmergence,
        femaleStart: c.femaleStart,
        femaleEnd: c.femaleEnd,
        maleStart: c.maleStart,
        maleEnd: c.maleEnd,
        spatheClose: c.spatheClose,
        pollenCollected: c.pollenCollected,
        pollenQuality: c.pollenQuality,
        pollenStored: c.pollenStored,
        pollenStorageDate: c.pollenStorageDate,
        crossesAttempted: c.crossesAttempted,
        seedsProduced: c.seedsProduced,
        temperature: c.temperature,
        humidity: c.humidity,
        notes: c.notes,
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} flowering cycles`);
}

async function cloneAllGrowthMetrics() {
  console.log('\nCloning growth metrics...');

  const metrics = await prisma.growthMetric.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const m of metrics) {
    if (!plantMap.has(m.plantId)) continue;

    await prisma.growthMetric.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(m.plantId)!,
        date: m.date,
        leafCount: m.leafCount,
        largestLeafLength: m.largestLeafLength,
        largestLeafWidth: m.largestLeafWidth,
        averageLeafSize: m.averageLeafSize,
        newGrowthRate: m.newGrowthRate,
        hasStuntedGrowth: m.hasStuntedGrowth,
        hasCurledLeaves: m.hasCurledLeaves,
        hasYellowing: m.hasYellowing,
        hasEdgeBurn: m.hasEdgeBurn,
        hasSpiderMites: m.hasSpiderMites,
        potSize: m.potSize,
        daysSinceRepot: m.daysSinceRepot,
        notes: m.notes,
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} growth metrics`);
}

async function cloneAllTraits() {
  console.log('\nCloning traits...');

  const traits = await prisma.trait.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const t of traits) {
    if (!plantMap.has(t.plantId)) continue;

    await prisma.trait.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(t.plantId)!,
        category: t.category,
        traitName: t.traitName,
        value: t.value,
        expressionLevel: t.expressionLevel,
        inheritancePattern: t.inheritancePattern,
        observationDate: t.observationDate,
        notes: t.notes,
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} traits`);
}

async function cloneAllGenetics() {
  console.log('\nCloning genetics...');

  const genetics = await prisma.genetics.findMany({
    where: { plant: { userId: DAVE_USER_ID } },
  });

  let count = 0;
  for (const g of genetics) {
    if (!plantMap.has(g.plantId)) continue;

    await prisma.genetics.create({
      data: {
        id: randomUUID(),
        plantId: plantMap.get(g.plantId)!,
        raNumber: g.raNumber,
        ogNumber: g.ogNumber,
        provenance: g.provenance,
        ploidy: g.ploidy,
        dnaBarcode: g.dnaBarcode,
        sequenceData: g.sequenceData,
        breedingValue: g.breedingValue,
        inbreedingCoeff: g.inbreedingCoeff,
        traitPredictions: g.traitPredictions,
      },
    });
    count++;
  }

  console.log(`✓ Cloned ${count} genetics records`);
}

async function cloneAllBreedingRecords() {
  console.log('\nCloning breeding records + pipeline...');

  const records = await prisma.breedingRecord.findMany({
    where: { userId: DAVE_USER_ID },
    include: {
      harvests: {
        include: {
          seedBatches: {
            include: { seedlings: true },
          },
        },
      },
      photos: true,
    },
  });

  let brCount = 0, hvCount = 0, sbCount = 0, slCount = 0;

  for (const br of records) {
    // Both parents must be in the cloned set
    if (!plantMap.has(br.femalePlantId) || !plantMap.has(br.malePlantId)) {
      console.log(`  Skipping ${br.crossId} - parent(s) not in cloned set`);
      continue;
    }

    const newBrId = randomUUID();
    breedingRecordMap.set(br.id, newBrId);

    await prisma.breedingRecord.create({
      data: {
        id: newBrId,
        crossId: `${br.crossId}-D`,
        crossDate: br.crossDate,
        userId: DEMO_USER_ID,
        femalePlantId: plantMap.get(br.femalePlantId)!,
        malePlantId: plantMap.get(br.malePlantId)!,
        crossType: br.crossType,
        crossCategory: br.crossCategory,
        pollinationMethod: br.pollinationMethod,
        targetTraits: br.targetTraits,
        seedsProduced: br.seedsProduced,
        germinationRate: br.germinationRate,
        seedlingCount: br.seedlingCount,
        f1PlantsRaised: br.f1PlantsRaised,
        selectionCriteria: br.selectionCriteria,
        selectedPlants: br.selectedPlants,
        notes: br.notes,
      },
    });
    brCount++;

    // Wire breedingRecordId on offspring plants
    // (plants that came from this cross)
    const offspring = await prisma.plant.findMany({
      where: { breedingRecordId: br.id, userId: DAVE_USER_ID },
      select: { id: true },
    });
    for (const o of offspring) {
      const newPlantId = plantMap.get(o.id);
      if (newPlantId) {
        await prisma.plant.update({
          where: { id: newPlantId },
          data: { breedingRecordId: newBrId },
        });
      }
    }

    // Clone breeding record photos
    for (const photo of br.photos) {
      await prisma.photo.create({
        data: {
          id: randomUUID(),
          breedingRecordId: newBrId,
          url: photo.url,
          storagePath: photo.storagePath,
          thumbnailPath: photo.thumbnailPath,
          originalFilename: photo.originalFilename,
          photoType: photo.photoType,
          photoContext: photo.photoContext,
          dateTaken: photo.dateTaken,
          notes: photo.notes,
        },
      });
    }

    // Clone harvests → seed batches → seedlings
    for (const hv of br.harvests) {
      const newHvId = randomUUID();
      harvestMap.set(hv.id, newHvId);

      await prisma.harvest.create({
        data: {
          id: newHvId,
          breedingRecordId: newBrId,
          harvestNumber: hv.harvestNumber,
          harvestDate: hv.harvestDate,
          berryCount: hv.berryCount,
          seedCount: hv.seedCount,
          seedViability: hv.seedViability,
          notes: hv.notes,
          photos: hv.photos,
        },
      });
      hvCount++;

      for (const sb of hv.seedBatches) {
        const newSbId = randomUUID();
        seedBatchMap.set(sb.id, newSbId);

        await prisma.seedBatch.create({
          data: {
            id: newSbId,
            batchId: `${sb.batchId}-D`,
            harvestId: newHvId,
            sowDate: sb.sowDate,
            seedCount: sb.seedCount,
            substrate: sb.substrate,
            container: sb.container,
            temperature: sb.temperature,
            humidity: sb.humidity,
            heatMat: sb.heatMat,
            domed: sb.domed,
            lightLevel: sb.lightLevel,
            germinatedCount: sb.germinatedCount,
            germinationRate: sb.germinationRate,
            firstEmergence: sb.firstEmergence,
            lastEmergence: sb.lastEmergence,
            status: sb.status,
            notes: sb.notes,
          },
        });
        sbCount++;

        for (const sl of sb.seedlings) {
          await prisma.seedling.create({
            data: {
              id: randomUUID(),
              seedlingId: `${sl.seedlingId}-D`,
              seedBatchId: newSbId,
              positionLabel: sl.positionLabel,
              emergenceDate: sl.emergenceDate,
              firstTrueLeaf: sl.firstTrueLeaf,
              prickOutDate: sl.prickOutDate,
              potSize: sl.potSize,
              leafCount: sl.leafCount,
              largestLeafCm: sl.largestLeafCm,
              healthStatus: sl.healthStatus,
              selectionStatus: sl.selectionStatus,
              selectionDate: sl.selectionDate,
              selectionNotes: sl.selectionNotes,
              graduatedToPlantId: sl.graduatedToPlantId ? plantMap.get(sl.graduatedToPlantId) ?? null : null,
              graduationDate: sl.graduationDate,
              locationId: sl.locationId ? locationMap.get(sl.locationId) ?? null : null,
              notes: sl.notes,
              photos: sl.photos,
            },
          });
          slCount++;
        }
      }
    }
  }

  console.log(`✓ Cloned ${brCount} breeding records, ${hvCount} harvests, ${sbCount} seed batches, ${slCount} seedlings`);
}

async function cloneAllCloneBatches() {
  console.log('\nCloning clone batches...');

  const batches = await prisma.cloneBatch.findMany({
    where: { userId: DAVE_USER_ID },
    include: { careLogs: true, photos: true },
  });

  let batchCount = 0, careCount = 0;

  for (const cb of batches) {
    const newId = randomUUID();
    cloneBatchMap.set(cb.id, newId);

    await prisma.cloneBatch.create({
      data: {
        id: newId,
        batchId: `${cb.batchId}-D`,
        userId: DEMO_USER_ID,
        propagationType: cb.propagationType,
        sourcePlantId: cb.sourcePlantId ? plantMap.get(cb.sourcePlantId) ?? null : null,
        externalSource: cb.externalSource,
        species: cb.species,
        cultivarName: cb.cultivarName,
        acquiredDate: cb.acquiredDate,
        acquiredCount: cb.acquiredCount,
        currentCount: cb.currentCount,
        containerCount: cb.containerCount,
        containerType: cb.containerType,
        status: cb.status,
        locationId: cb.locationId ? locationMap.get(cb.locationId) ?? null : null,
        notes: cb.notes,
      },
    });
    batchCount++;

    // Wire cloneBatchId on plants from this batch
    const batchPlants = await prisma.plant.findMany({
      where: { cloneBatchId: cb.id, userId: DAVE_USER_ID },
      select: { id: true },
    });
    for (const p of batchPlants) {
      const newPlantId = plantMap.get(p.id);
      if (newPlantId) {
        await prisma.plant.update({
          where: { id: newPlantId },
          data: { cloneBatchId: newId },
        });
      }
    }

    // Clone batch care logs
    for (const cl of cb.careLogs) {
      await prisma.careLog.create({
        data: {
          id: randomUUID(),
          cloneBatchId: newId,
          date: cl.date,
          action: cl.action,
          inputEC: cl.inputEC,
          outputEC: cl.outputEC,
          inputPH: cl.inputPH,
          outputPH: cl.outputPH,
          isBaselineFeed: cl.isBaselineFeed,
          feedComponents: cl.feedComponents,
          details: cl.details,
        },
      });
      careCount++;
    }

    // Clone batch photos
    for (const photo of cb.photos) {
      await prisma.photo.create({
        data: {
          id: randomUUID(),
          cloneBatchId: newId,
          url: photo.url,
          storagePath: photo.storagePath,
          thumbnailPath: photo.thumbnailPath,
          originalFilename: photo.originalFilename,
          photoType: photo.photoType,
          photoContext: photo.photoContext,
          dateTaken: photo.dateTaken,
          notes: photo.notes,
        },
      });
    }
  }

  console.log(`✓ Cloned ${batchCount} clone batches, ${careCount} batch care logs`);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: SYNTHETIC BREEDING PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function dateFromStr(str: string): Date {
  return new Date(str + 'T12:00:00Z');
}

function generateCareLogs(plantId: string, count: number, startDaysAgo: number) {
  const logs: Array<{
    id: string; plantId: string; date: Date; action: string;
    inputEC: number; inputPH: number; outputEC: number; outputPH: number;
    isBaselineFeed: boolean; details: string | null;
  }> = [];
  let dayOffset = startDaysAgo;

  for (let i = 0; i < count; i++) {
    const action = i % 3 !== 0 ? 'water' : 'fertilize';
    const baseEC = 1.1 + Math.random() * 0.3;
    const basePH = 5.8 + Math.random() * 0.4;

    logs.push({
      id: randomUUID(),
      plantId,
      date: daysAgo(dayOffset),
      action,
      inputEC: Math.round(baseEC * 100) / 100,
      inputPH: Math.round(basePH * 100) / 100,
      outputEC: Math.round((baseEC + 0.2 + Math.random() * 0.5) * 100) / 100,
      outputPH: Math.round((basePH + 0.1 + Math.random() * 0.3) * 100) / 100,
      isBaselineFeed: action === 'fertilize',
      details: action === 'fertilize' ? 'CalMag + TPS One' : null,
    });

    dayOffset -= 3 + Math.floor(Math.random() * 3);
    if (dayOffset < 0) break;
  }

  return logs;
}

async function createSyntheticBreedingData() {
  console.log('\nCreating synthetic breeding pipeline...');

  // Use first two cloned locations for synthetic plants
  const locationIds = Array.from(locationMap.values());
  const loc1 = locationIds[0] ?? null;
  const loc2 = locationIds[1] ?? loc1;

  // Load placeholder photo paths from cloned data
  const placeholderPhotos = await prisma.photo.findMany({
    where: { plant: { userId: DAVE_USER_ID }, storagePath: { not: null } },
    select: { storagePath: true, thumbnailPath: true },
    take: 20,
  });
  const getPhoto = (i: number) => placeholderPhotos[i % placeholderPhotos.length] ?? { storagePath: null, thumbnailPath: null };

  // ─── 8 Synthetic Plants ───
  const plantDefs = [
    { plantId: 'ANT-2024-0101-D', species: 'crystallinum', section: 'Cardiolonchium', hybridName: null, crossNotation: null, generation: null, breeder: 'Tezula Plants', breederCode: 'TZ', isMother: true, locationId: loc1, cost: 250, notes: 'Pristine crystallinum. Dark velvety leaves with bright crystalline venation.' },
    { plantId: 'ANT-2024-0102-D', species: 'warocqueanum', section: 'Cardiolonchium', hybridName: null, crossNotation: null, generation: null, breeder: 'NSE Tropicals', breederCode: 'NSE', isMother: false, locationId: loc1, cost: 400, notes: 'Queen Anthurium. Elongated dark velvet leaves, 24" mature blade length.' },
    { plantId: 'ANT-2024-0103-D', species: 'regale', section: 'Cardiolonchium', hybridName: null, crossNotation: null, generation: null, breeder: 'Eddie Pronto', breederCode: 'EPP', isMother: true, locationId: loc2, cost: 300, notes: 'Regale with deep red flush coloring. Outstanding petiole veining.' },
    { plantId: 'ANT-2024-0104-D', species: 'magnificum', section: 'Cardiolonchium', hybridName: null, crossNotation: null, generation: null, breeder: 'Scott Cohen', breederCode: 'SC', isMother: false, locationId: loc2, cost: 200, notes: 'Colombian magnificum with broad heart-shaped leaves and silver venation.' },
    { plantId: 'ANT-2025-0201-D', species: null, section: 'Cardiolonchium', hybridName: 'crystallinum × warocqueanum', crossNotation: 'crystallinum × warocqueanum', generation: 'F1', breeder: null, breederCode: null, isMother: true, locationId: loc1, cost: null, notes: 'F1 keeper from CLX-2024-001. Inherits velvet texture with elongated form.' },
    { plantId: 'ANT-2025-0202-D', species: null, section: 'Cardiolonchium', hybridName: 'crystallinum × warocqueanum', crossNotation: 'crystallinum × warocqueanum', generation: 'F1', breeder: null, breederCode: null, isMother: false, locationId: loc1, cost: null, notes: 'F1 keeper from CLX-2024-001. Excellent crystalline expression with elongated blade.' },
    { plantId: 'ANT-2025-0203-D', species: null, section: 'Cardiolonchium', hybridName: 'regale × magnificum', crossNotation: 'regale × magnificum', generation: 'F1', breeder: null, breederCode: null, isMother: false, locationId: loc2, cost: null, notes: 'F1 keeper from CLX-2024-002. Combines red flush with silver veining.' },
    { plantId: 'ANT-2024-0105-D', species: 'forgetii', section: 'Porphyrochitonium', hybridName: null, crossNotation: null, generation: null, breeder: 'Silver Krome Gardens', breederCode: 'SKG', isMother: false, locationId: loc2, cost: 150, notes: 'Forgetii with characteristic rounded leaves. Male parent for intersectional cross.' },
  ];

  for (const def of plantDefs) {
    const dbId = randomUUID();
    syntheticPlantDbIds.set(def.plantId, dbId);
    const isF1 = def.generation === 'F1';

    await prisma.plant.create({
      data: {
        id: dbId,
        userId: DEMO_USER_ID,
        plantId: def.plantId,
        accessionDate: isF1 ? dateFromStr('2025-03-15') : dateFromStr('2024-03-01'),
        genus: 'Anthurium',
        section: def.section,
        species: def.species,
        hybridName: def.hybridName,
        crossNotation: def.crossNotation,
        generation: def.generation,
        breeder: def.breeder,
        breederCode: def.breederCode,
        acquisitionCost: def.cost,
        propagationType: isF1 ? 'seed' : 'purchase',
        locationId: def.locationId,
        healthStatus: 'healthy',
        currentPotSize: isF1 ? 3.0 : 5.0,
        currentPotType: 'plastic',
        lastRepotDate: daysAgo(isF1 ? 60 : 120),
        isMother: def.isMother,
        isEliteGenetics: !isF1,
        notes: def.notes,
        tags: JSON.stringify([]),
      },
    });

    // Care logs
    const logs = generateCareLogs(dbId, 8 + Math.floor(Math.random() * 8), isF1 ? 90 : 180);
    for (const log of logs) {
      await prisma.careLog.create({ data: log });
    }

    // Photos (3-5 per plant)
    const numPhotos = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numPhotos; j++) {
      const ph = getPhoto(plantDefs.indexOf(def) * 5 + j);
      const photoId = randomUUID();
      await prisma.photo.create({
        data: {
          id: photoId,
          plantId: dbId,
          storagePath: ph.storagePath,
          thumbnailPath: ph.thumbnailPath,
          photoType: j === 0 ? 'whole_plant' : 'leaf',
          dateTaken: daysAgo(30 + j * 15),
          notes: j === 0 ? 'Accession photo' : null,
        },
      });
      if (j === 0) {
        await prisma.plant.update({ where: { id: dbId }, data: { coverPhotoId: photoId } });
      }
    }
  }
  console.log(`✓ Created ${plantDefs.length} synthetic plants with care logs + photos`);

  // ─── Traits ───
  const traitDefs: Array<{ pid: string; traits: Array<{ cat: string; name: string; val: string; expr: number }> }> = [
    { pid: 'ANT-2024-0101-D', traits: [{ cat: 'leaf', name: 'velvety', val: 'high', expr: 0.9 }, { cat: 'leaf', name: 'crystalline', val: 'bright silver', expr: 0.85 }] },
    { pid: 'ANT-2024-0102-D', traits: [{ cat: 'leaf', name: 'velvety', val: 'extreme', expr: 0.95 }, { cat: 'growth', name: 'blade_length', val: '24+ inches', expr: 0.9 }] },
    { pid: 'ANT-2024-0103-D', traits: [{ cat: 'leaf', name: 'flush_color', val: 'deep red', expr: 0.9 }, { cat: 'leaf', name: 'venation', val: 'pronounced', expr: 0.8 }] },
    { pid: 'ANT-2024-0104-D', traits: [{ cat: 'leaf', name: 'venation', val: 'silver', expr: 0.85 }, { cat: 'leaf', name: 'shape', val: 'broad cordate', expr: 0.9 }] },
    { pid: 'ANT-2024-0105-D', traits: [{ cat: 'leaf', name: 'shape', val: 'round orbicular', expr: 0.9 }] },
    { pid: 'ANT-2025-0201-D', traits: [{ cat: 'leaf', name: 'velvety', val: 'moderate-high', expr: 0.75 }, { cat: 'leaf', name: 'crystalline', val: 'moderate silver', expr: 0.65 }] },
  ];
  for (const td of traitDefs) {
    const dbId = syntheticPlantDbIds.get(td.pid)!;
    for (const t of td.traits) {
      await prisma.trait.create({
        data: { id: randomUUID(), plantId: dbId, category: t.cat, traitName: t.name, value: t.val, expressionLevel: t.expr, observationDate: daysAgo(30) },
      });
    }
  }
  console.log('  ✓ Traits created');

  // ─── Measurements (parent plants only) ───
  for (const pid of ['ANT-2024-0101-D', 'ANT-2024-0102-D', 'ANT-2024-0103-D', 'ANT-2024-0104-D', 'ANT-2024-0105-D']) {
    const dbId = syntheticPlantDbIds.get(pid)!;
    for (let m = 0; m < 2; m++) {
      await prisma.measurement.create({
        data: {
          id: randomUUID(), plantId: dbId, measurementDate: daysAgo(60 + m * 60),
          leafLength: 15 + Math.random() * 20, leafWidth: 10 + Math.random() * 12,
          petioleLength: 12 + Math.random() * 15,
          texture: pid.includes('0105') ? 'glossy' : 'velvety',
          vigorScore: 3 + Math.floor(Math.random() * 2),
          leafCount: 5 + Math.floor(Math.random() * 4),
          height: 20 + Math.random() * 15,
        },
      });
    }
  }
  console.log('  ✓ Measurements created');

  // ─── Genetics ───
  const genDefs = [
    { pid: 'ANT-2024-0101-D', ra: 'RA5', prov: 'Eastern Panama', bv: 0.82 },
    { pid: 'ANT-2024-0102-D', ra: 'RA8', prov: 'Colombia', bv: 0.78 },
    { pid: 'ANT-2024-0103-D', ra: null, prov: 'Peru', bv: 0.75 },
    { pid: 'ANT-2024-0104-D', ra: null, prov: 'Colombia', bv: 0.72 },
    { pid: 'ANT-2024-0105-D', ra: null, prov: 'Colombia', bv: 0.68 },
    { pid: 'ANT-2025-0201-D', ra: 'RA5×RA8', prov: 'Cultivated F1', bv: 0.85 },
    { pid: 'ANT-2025-0202-D', ra: 'RA5×RA8', prov: 'Cultivated F1', bv: 0.80 },
  ];
  for (const g of genDefs) {
    await prisma.genetics.create({
      data: { id: randomUUID(), plantId: syntheticPlantDbIds.get(g.pid)!, raNumber: g.ra, provenance: g.prov, breedingValue: g.bv, ploidy: '2n' },
    });
  }
  console.log('  ✓ Genetics created');

  // ─── Flowering Cycles (parent plants) ───
  const flowerDefs: Array<{ pid: string; cycles: Array<any> }> = [
    { pid: 'ANT-2024-0101-D', cycles: [
      { spatheEmergence: '2024-05-20', femaleStart: '2024-06-01', femaleEnd: '2024-06-10', maleStart: '2024-06-15', maleEnd: '2024-06-25', spatheClose: '2024-07-01', pollenCollected: false, pollenStored: false },
      { spatheEmergence: '2024-11-10', femaleStart: '2024-11-20', femaleEnd: '2024-11-28', maleStart: '2024-12-05', maleEnd: '2024-12-15', spatheClose: '2024-12-22', pollenCollected: true, pollenQuality: 'abundant', pollenStored: true, pollenStorageDate: '2024-12-06' },
    ]},
    { pid: 'ANT-2024-0102-D', cycles: [
      { spatheEmergence: '2024-05-25', femaleStart: '2024-06-05', femaleEnd: '2024-06-14', maleStart: '2024-06-12', maleEnd: '2024-06-22', spatheClose: '2024-06-28', pollenCollected: true, pollenQuality: 'abundant', pollenStored: true, pollenStorageDate: '2024-06-13' },
    ]},
    { pid: 'ANT-2024-0103-D', cycles: [
      { spatheEmergence: '2024-09-01', femaleStart: '2024-09-12', femaleEnd: '2024-09-20', maleStart: '2024-09-25', maleEnd: '2024-10-05', spatheClose: '2024-10-12', pollenCollected: false, pollenStored: false },
    ]},
    { pid: 'ANT-2024-0104-D', cycles: [
      { spatheEmergence: '2024-09-05', femaleStart: '2024-09-15', femaleEnd: '2024-09-22', maleStart: '2024-09-18', maleEnd: '2024-09-28', spatheClose: '2024-10-04', pollenCollected: true, pollenQuality: 'abundant', pollenStored: true, pollenStorageDate: '2024-09-19' },
    ]},
  ];
  for (const fd of flowerDefs) {
    const dbId = syntheticPlantDbIds.get(fd.pid)!;
    for (const c of fd.cycles) {
      await prisma.floweringCycle.create({
        data: {
          id: randomUUID(), plantId: dbId,
          spatheEmergence: dateFromStr(c.spatheEmergence), femaleStart: dateFromStr(c.femaleStart),
          femaleEnd: dateFromStr(c.femaleEnd), maleStart: dateFromStr(c.maleStart),
          maleEnd: dateFromStr(c.maleEnd), spatheClose: dateFromStr(c.spatheClose),
          pollenCollected: c.pollenCollected, pollenQuality: c.pollenQuality ?? null,
          pollenStored: c.pollenStored, pollenStorageDate: c.pollenStorageDate ? dateFromStr(c.pollenStorageDate) : null,
          crossesAttempted: JSON.stringify([]),
          temperature: 78 + Math.random() * 4, humidity: 70 + Math.random() * 10,
        },
      });
    }
  }
  console.log('  ✓ Flowering cycles created');

  // ─── 3 Breeding Records ───

  // Cross 1: CLX-2024-001-D — crystallinum × warocqueanum
  const cross1Id = randomUUID();
  await prisma.breedingRecord.create({
    data: {
      id: cross1Id, crossId: 'CLX-2024-S01-D', crossDate: dateFromStr('2024-06-15'),
      userId: DEMO_USER_ID,
      femalePlantId: syntheticPlantDbIds.get('ANT-2024-0101-D')!,
      malePlantId: syntheticPlantDbIds.get('ANT-2024-0102-D')!,
      crossType: 'CONTROLLED', crossCategory: 'INTRASPECIFIC', pollinationMethod: 'fresh',
      targetTraits: JSON.stringify(['velvet texture', 'elongated blade', 'crystalline venation']),
      seedsProduced: 30, germinationRate: 0.67, seedlingCount: 11, f1PlantsRaised: 2,
      selectionCriteria: JSON.stringify(['velvet expression', 'leaf elongation', 'vigor']),
      notes: 'Flagship cross combining crystallinum clarity with warocqueanum size.',
    },
  });

  const hv1aId = randomUUID();
  await prisma.harvest.create({
    data: { id: hv1aId, breedingRecordId: cross1Id, harvestNumber: 1, harvestDate: dateFromStr('2024-12-20'), berryCount: 6, seedCount: 18, seedViability: 'GOOD', notes: 'Primary harvest. Berries ripened evenly.' },
  });

  const sb1Id = randomUUID();
  await prisma.seedBatch.create({
    data: {
      id: sb1Id, batchId: 'SDB-2024-S01-D', harvestId: hv1aId,
      sowDate: dateFromStr('2024-12-22'), seedCount: 18,
      substrate: 'TFF + chopped sphagnum + Fluval Stratum', container: 'domed takeout container',
      temperature: 80, humidity: 90, heatMat: true, domed: true, lightLevel: 'LOW',
      germinatedCount: 14, germinationRate: 77.8,
      firstEmergence: dateFromStr('2025-01-08'), lastEmergence: dateFromStr('2025-01-22'),
      status: 'SELECTING', notes: '14 of 18 germinated. Strong germination.',
    },
  });

  // 8 seedlings
  const s1Defs = [
    { sid: 'SDL-2025-S001-D', status: 'GRADUATED', sel: 'KEEPER', eDays: 395, grad: 'ANT-2025-0201-D' },
    { sid: 'SDL-2025-S002-D', status: 'HEALTHY', sel: 'KEEPER', eDays: 397, grad: 'ANT-2025-0202-D' },
    { sid: 'SDL-2025-S003-D', status: 'HEALTHY', sel: 'HOLDBACK', eDays: 399, grad: null },
    { sid: 'SDL-2025-S004-D', status: 'HEALTHY', sel: 'GROWING', eDays: 400, grad: null },
    { sid: 'SDL-2025-S005-D', status: 'HEALTHY', sel: 'GROWING', eDays: 402, grad: null },
    { sid: 'SDL-2025-S006-D', status: 'HEALTHY', sel: 'GROWING', eDays: 405, grad: null },
    { sid: 'SDL-2025-S007-D', status: 'WEAK', sel: 'CULLED', eDays: 410, grad: null },
    { sid: 'SDL-2025-S008-D', status: 'HEALTHY', sel: 'GROWING', eDays: 412, grad: null },
  ];
  for (let i = 0; i < s1Defs.length; i++) {
    const s = s1Defs[i];
    const gradId = s.grad ? syntheticPlantDbIds.get(s.grad) ?? null : null;
    await prisma.seedling.create({
      data: {
        id: randomUUID(), seedlingId: s.sid, seedBatchId: sb1Id,
        positionLabel: `Row 1 #${i + 1}`, emergenceDate: daysAgo(s.eDays),
        firstTrueLeaf: daysAgo(s.eDays - 14),
        prickOutDate: s.sel !== 'GROWING' ? daysAgo(s.eDays - 45) : null,
        potSize: s.sel === 'KEEPER' ? 2.0 : 1.5,
        leafCount: 3 + Math.floor(Math.random() * 3), largestLeafCm: 2 + Math.random() * 4,
        healthStatus: s.status, selectionStatus: s.grad ? 'GRADUATED' : s.sel,
        selectionDate: s.sel !== 'GROWING' ? daysAgo(s.eDays - 60) : null,
        selectionNotes: s.sel === 'KEEPER' ? 'Strong velvet expression, good vigor' : s.sel === 'CULLED' ? 'Stunted growth, weak root system' : null,
        graduatedToPlantId: gradId, graduationDate: gradId ? dateFromStr('2025-03-15') : null,
      },
    });
  }

  // Harvest 2 for cross 1
  const hv1bId = randomUUID();
  await prisma.harvest.create({
    data: { id: hv1bId, breedingRecordId: cross1Id, harvestNumber: 2, harvestDate: dateFromStr('2025-01-05'), berryCount: 4, seedCount: 12, seedViability: 'MIXED', notes: 'Secondary harvest. Later berries, some immature.' },
  });
  const sb2Id = randomUUID();
  await prisma.seedBatch.create({
    data: {
      id: sb2Id, batchId: 'SDB-2024-S02-D', harvestId: hv1bId,
      sowDate: dateFromStr('2025-01-07'), seedCount: 12,
      substrate: 'TFF + chopped sphagnum + Fluval Stratum', container: '6-cell tray',
      temperature: 78, humidity: 88, heatMat: true, domed: true, lightLevel: 'LOW',
      germinatedCount: 6, germinationRate: 50.0,
      firstEmergence: dateFromStr('2025-01-25'), lastEmergence: dateFromStr('2025-02-10'),
      status: 'GERMINATING', notes: '6 of 12 germinated so far.',
    },
  });
  for (let i = 0; i < 3; i++) {
    await prisma.seedling.create({
      data: {
        id: randomUUID(), seedlingId: `SDL-2025-S${String(9 + i).padStart(3, '0')}-D`, seedBatchId: sb2Id,
        positionLabel: `Cell ${i + 1}`, emergenceDate: daysAgo(365 + i * 3),
        healthStatus: 'HEALTHY', selectionStatus: 'GROWING', leafCount: 2, largestLeafCm: 1 + Math.random() * 2,
      },
    });
  }

  // Cross 2: CLX-2024-002-D — regale × magnificum
  const cross2Id = randomUUID();
  await prisma.breedingRecord.create({
    data: {
      id: cross2Id, crossId: 'CLX-2024-S02-D', crossDate: dateFromStr('2024-09-20'),
      userId: DEMO_USER_ID,
      femalePlantId: syntheticPlantDbIds.get('ANT-2024-0103-D')!,
      malePlantId: syntheticPlantDbIds.get('ANT-2024-0104-D')!,
      crossType: 'CONTROLLED', crossCategory: 'INTRASPECIFIC', pollinationMethod: 'stored',
      targetTraits: JSON.stringify(['red flush', 'silver venation', 'broad leaf']),
      seedsProduced: 15, germinationRate: 0.53, seedlingCount: 6, f1PlantsRaised: 1,
      selectionCriteria: JSON.stringify(['flush color intensity', 'venation clarity', 'growth rate']),
      notes: 'Regale × magnificum for complementary aesthetic traits.',
    },
  });
  const hv2Id = randomUUID();
  await prisma.harvest.create({
    data: { id: hv2Id, breedingRecordId: cross2Id, harvestNumber: 1, harvestDate: dateFromStr('2025-03-25'), berryCount: 5, seedCount: 15, seedViability: 'GOOD' },
  });
  const sb3Id = randomUUID();
  await prisma.seedBatch.create({
    data: {
      id: sb3Id, batchId: 'SDB-2024-S03-D', harvestId: hv2Id,
      sowDate: dateFromStr('2025-03-28'), seedCount: 15,
      substrate: 'TFF + chopped sphagnum + Fluval Stratum', container: 'domed takeout container',
      temperature: 79, humidity: 90, heatMat: true, domed: true, lightLevel: 'LOW',
      germinatedCount: 8, germinationRate: 53.3,
      firstEmergence: dateFromStr('2025-04-12'), lastEmergence: dateFromStr('2025-04-28'),
      status: 'PRICKING_OUT', notes: '8 of 15 germinated.',
    },
  });
  const s2Defs = [
    { status: 'HEALTHY', sel: 'GRADUATED', grad: 'ANT-2025-0203-D' },
    { status: 'HEALTHY', sel: 'HOLDBACK', grad: null },
    { status: 'HEALTHY', sel: 'HOLDBACK', grad: null },
    { status: 'HEALTHY', sel: 'GROWING', grad: null },
    { status: 'HEALTHY', sel: 'GROWING', grad: null },
    { status: 'DEAD', sel: 'DIED', grad: null },
  ];
  for (let i = 0; i < s2Defs.length; i++) {
    const s = s2Defs[i];
    const gradId = s.grad ? syntheticPlantDbIds.get(s.grad) ?? null : null;
    await prisma.seedling.create({
      data: {
        id: randomUUID(), seedlingId: `SDL-2025-S${String(12 + i).padStart(3, '0')}-D`, seedBatchId: sb3Id,
        positionLabel: `Row 2 #${i + 1}`, emergenceDate: daysAgo(300 + i * 3),
        firstTrueLeaf: daysAgo(286 + i * 3), prickOutDate: daysAgo(255),
        potSize: s.sel === 'GRADUATED' ? 2.0 : 1.5,
        leafCount: s.status === 'DEAD' ? 0 : 3 + Math.floor(Math.random() * 2),
        largestLeafCm: s.status === 'DEAD' ? 0 : 2 + Math.random() * 3,
        healthStatus: s.status, selectionStatus: s.grad ? 'GRADUATED' : s.sel,
        selectionDate: s.sel !== 'GROWING' ? daysAgo(200) : null,
        selectionNotes: s.grad ? 'Outstanding flush color and vigor' : s.sel === 'DIED' ? 'Root rot' : null,
        graduatedToPlantId: gradId, graduationDate: gradId ? dateFromStr('2025-08-01') : null,
      },
    });
  }

  // Cross 3: CLX-2025-003-D — F1 × forgetii (INTERSECTIONAL)
  const cross3Id = randomUUID();
  await prisma.breedingRecord.create({
    data: {
      id: cross3Id, crossId: 'CLX-2025-S03-D', crossDate: dateFromStr('2025-01-10'),
      userId: DEMO_USER_ID,
      femalePlantId: syntheticPlantDbIds.get('ANT-2025-0201-D')!,
      malePlantId: syntheticPlantDbIds.get('ANT-2024-0105-D')!,
      crossType: 'CONTROLLED', crossCategory: 'INTERSECTIONAL', pollinationMethod: 'fresh',
      targetTraits: JSON.stringify(['intersectional vigor', 'velvet + round leaf', 'novel venation']),
      seedsProduced: 8, seedlingCount: 0,
      selectionCriteria: JSON.stringify(['intersectional viability', 'leaf morphology']),
      notes: 'Ambitious intersectional: Cardiolonchium F1 × Porphyrochitonium. Very early stage.',
    },
  });
  const hv3Id = randomUUID();
  await prisma.harvest.create({
    data: { id: hv3Id, breedingRecordId: cross3Id, harvestNumber: 1, harvestDate: dateFromStr('2025-07-15'), berryCount: 3, seedCount: 8, seedViability: 'MIXED', notes: 'Small yield for intersectional.' },
  });
  await prisma.seedBatch.create({
    data: {
      id: randomUUID(), batchId: 'SDB-2025-S04-D', harvestId: hv3Id,
      sowDate: dateFromStr('2025-07-18'), seedCount: 8,
      substrate: 'TFF + chopped sphagnum + Fluval Stratum', container: '4-cell tray',
      temperature: 80, humidity: 92, heatMat: true, domed: true, lightLevel: 'DARK',
      status: 'SOWN', notes: 'Sown immediately. Monitoring closely.',
    },
  });

  // Store for lineage wiring
  breedingRecordMap.set('CLX-2024-001', cross1Id);
  breedingRecordMap.set('CLX-2024-002', cross2Id);
  breedingRecordMap.set('CLX-2025-003', cross3Id);

  console.log('✓ Created 3 synthetic crosses with full pipeline');
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: WIRE SYNTHETIC LINEAGE
// ═══════════════════════════════════════════════════════════════════════════

async function wireSyntheticLineage() {
  console.log('\nWiring synthetic lineage...');

  const cross1Id = breedingRecordMap.get('CLX-2024-001')!;
  const cryst = syntheticPlantDbIds.get('ANT-2024-0101-D')!;
  const waroc = syntheticPlantDbIds.get('ANT-2024-0102-D')!;

  for (const pid of ['ANT-2025-0201-D', 'ANT-2025-0202-D']) {
    await prisma.plant.update({
      where: { id: syntheticPlantDbIds.get(pid)! },
      data: { femaleParentId: cryst, maleParentId: waroc, breedingRecordId: cross1Id, generation: 'F1' },
    });
  }

  const cross2Id = breedingRecordMap.get('CLX-2024-002')!;
  await prisma.plant.update({
    where: { id: syntheticPlantDbIds.get('ANT-2025-0203-D')! },
    data: {
      femaleParentId: syntheticPlantDbIds.get('ANT-2024-0103-D')!,
      maleParentId: syntheticPlantDbIds.get('ANT-2024-0104-D')!,
      breedingRecordId: cross2Id, generation: 'F1',
    },
  });

  console.log('✓ Lineage wired: 3 F1 plants linked to parents and breeding records');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  CLADARI DEMO ACCOUNT — FULL CLONE + SYNTH  ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  console.log('Source (Dave):', DAVE_USER_ID);
  console.log('Demo user:   ', DEMO_USER_ID);
  console.log('');

  // Phase 1
  console.log('━━━ PHASE 1: CLEANUP + AUTH ━━━');
  await setupAuth();
  await clearDemoData();
  await ensureProfile();

  // Phase 2
  console.log('\n━━━ PHASE 2: FULL CLONE ━━━');
  await cloneAllLocations();
  const vendorMap = await cloneAllVendors();
  await cloneAllPlants(vendorMap);
  await cloneAllPhotos();
  await cloneAllCareLogs();
  await cloneAllJournalEntries();
  await cloneAllMeasurements();
  await cloneAllFloweringCycles();
  await cloneAllGrowthMetrics();
  await cloneAllTraits();
  await cloneAllGenetics();
  await cloneAllBreedingRecords();
  await cloneAllCloneBatches();

  // Phase 3
  console.log('\n━━━ PHASE 3: SYNTHETIC BREEDING ━━━');
  await createSyntheticBreedingData();

  // Phase 4
  console.log('\n━━━ PHASE 4: WIRE LINEAGE ━━━');
  await wireSyntheticLineage();

  // Summary
  const plantCount = plantMap.size + syntheticPlantDbIds.size;
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  DEMO ACCOUNT READY                          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  URL:      https://www.cladari.co             ║`);
  console.log(`║  Email:    ${DEMO_EMAIL.padEnd(34)}║`);
  console.log(`║  Password: ${DEMO_PASSWORD.padEnd(34)}║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Cloned from Dave: ${String(plantMap.size).padEnd(26)}║`);
  console.log(`║  Synthetic plants: 8                         ║`);
  console.log(`║  Synthetic crosses: 3                        ║`);
  console.log(`║  Total plants: ${String(plantCount).padEnd(30)}║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  NEXT: Log in, cull plants you don\'t want    ║');
  console.log('║  in the demo, then hand off to Ashley.       ║');
  console.log('╚══════════════════════════════════════════════╝');
}

main()
  .catch((e) => {
    console.error('\n❌ FATAL ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
