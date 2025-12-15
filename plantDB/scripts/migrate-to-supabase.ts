/**
 * SQLite → Supabase Data Migration Script
 *
 * Migrates all data from SQLite (dev.db) to Supabase Postgres
 * Run: npx tsx scripts/migrate-to-supabase.ts
 *
 * IMPORTANT: Before running:
 * 1. Create a user in Supabase Auth dashboard (Authentication → Users → Add user)
 * 2. Copy the user's UUID and set MIGRATION_USER_ID below
 * 3. Make sure RLS policies are applied
 */

import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Set this before running!
// ═══════════════════════════════════════════════════════════════════════════

// You must create a user in Supabase Auth first, then paste the UUID here
const MIGRATION_USER_ID = process.env.MIGRATION_USER_ID || ''
const MIGRATION_USER_EMAIL = process.env.MIGRATION_USER_EMAIL || 'dchinnici@gmail.com'

if (!MIGRATION_USER_ID) {
  console.error('❌ ERROR: MIGRATION_USER_ID not set!')
  console.error('   1. Go to Supabase Dashboard → Authentication → Users')
  console.error('   2. Create a user with email: dave@cladari.ai')
  console.error('   3. Copy the user UUID')
  console.error('   4. Run: MIGRATION_USER_ID=<uuid> npx tsx scripts/migrate-to-supabase.ts')
  process.exit(1)
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════

const sqlite = new Database('./prisma/dev.db', { readonly: true })
const prisma = new PrismaClient()

// Helper to parse JSON safely (SQLite stores as strings)
function parseJson(value: string | null): any {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

// Helper to convert SQLite datetime to JS Date
function toDate(value: string | number | null): Date | null {
  if (!value) return null
  if (typeof value === 'number') {
    // Unix timestamp
    return new Date(value)
  }
  return new Date(value)
}

// Helper to convert SQLite int (0/1) to boolean
function toBool(value: number | boolean | null | undefined, defaultVal = false): boolean {
  if (value === null || value === undefined) return defaultVal
  if (typeof value === 'boolean') return value
  return value === 1
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function createProfile() {
  console.log('\n📋 Creating Profile...')

  // Check if profile already exists
  const existing = await prisma.profile.findUnique({
    where: { id: MIGRATION_USER_ID }
  })

  if (existing) {
    console.log('   Profile already exists, skipping')
    return
  }

  await prisma.profile.create({
    data: {
      id: MIGRATION_USER_ID,
      email: MIGRATION_USER_EMAIL,
      displayName: 'Dave',
      tier: 'pro',
      maxPlants: 500
    }
  })
  console.log('   ✓ Profile created')
}

async function migrateVendors() {
  console.log('\n🏪 Migrating Vendors...')
  const vendors = sqlite.prepare('SELECT * FROM Vendor').all() as any[]

  for (const v of vendors) {
    await prisma.vendor.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        name: v.name,
        type: v.type,
        userId: MIGRATION_USER_ID,
        location: v.location,
        country: v.country,
        reputationScore: v.reputationScore,
        specialties: parseJson(v.specialties) || [],
        contactInfo: v.contactInfo,
        website: v.website,
        instagram: v.instagram,
        notes: v.notes,
        createdAt: toDate(v.createdAt) || new Date(),
        updatedAt: toDate(v.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${vendors.length} vendors migrated`)
}

async function migrateLocations() {
  console.log('\n📍 Migrating Locations...')
  const locations = sqlite.prepare('SELECT * FROM Location').all() as any[]

  for (const l of locations) {
    await prisma.location.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        name: l.name,
        type: l.type,
        userId: MIGRATION_USER_ID,
        zone: l.zone,
        shelf: l.shelf,
        position: l.position,
        sensorPushId: l.sensorPushId,
        lastSensorSync: toDate(l.lastSensorSync),
        lightLevel: l.lightLevel,
        humidity: l.humidity,
        temperature: l.temperature,
        dli: l.dli,
        vpd: l.vpd,
        pressure: l.pressure,
        co2: l.co2,
        growLights: parseJson(l.growLights),
        photoperiod: l.photoperiod,
        airflow: l.airflow,
        fanSpeed: l.fanSpeed,
        capacity: l.capacity,
        currentOccupancy: l.currentOccupancy || 0,
        notes: l.notes,
        createdAt: toDate(l.createdAt) || new Date(),
        updatedAt: toDate(l.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${locations.length} locations migrated`)
}

async function migrateSpecies() {
  console.log('\n🌿 Migrating Species...')
  const species = sqlite.prepare('SELECT * FROM Species').all() as any[]

  for (const s of species) {
    await prisma.species.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        genus: s.genus,
        species: s.species,
        section: s.section,
        commonNames: parseJson(s.commonNames) || [],
        nativeRange: s.nativeRange,
        conservationStatus: s.conservationStatus,
        citesListing: s.citesListing,
        keyTraits: parseJson(s.keyTraits) || [],
        description: s.description,
        createdAt: toDate(s.createdAt) || new Date(),
        updatedAt: toDate(s.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${species.length} species migrated`)
}

async function migrateTreatments() {
  console.log('\n💊 Migrating Treatments...')
  const treatments = sqlite.prepare('SELECT * FROM Treatment').all() as any[]

  for (const t of treatments) {
    await prisma.treatment.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        type: t.type,
        brand: t.brand,
        composition: parseJson(t.composition),
        applicationRate: t.applicationRate,
        frequency: t.frequency,
        notes: t.notes,
        createdAt: toDate(t.createdAt) || new Date(),
        updatedAt: toDate(t.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${treatments.length} treatments migrated`)
}

async function migrateFeedProducts() {
  console.log('\n🧪 Migrating Feed Products...')
  const products = sqlite.prepare('SELECT * FROM FeedProduct').all() as any[]

  for (const p of products) {
    await prisma.feedProduct.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        ecContribution: p.ecContribution,
        phEffect: p.phEffect,
        phEffectType: p.phEffectType,
        nitrogenN: p.nitrogenN,
        phosphorusP: p.phosphorusP,
        potassiumK: p.potassiumK,
        calcium: p.calcium,
        magnesium: p.magnesium,
        sulfur: p.sulfur,
        iron: p.iron,
        silica: p.silica,
        defaultDose: p.defaultDose,
        maxDose: p.maxDose,
        applicationNotes: p.applicationNotes,
        isActive: toBool(p.isActive, true),
        isInBaseline: toBool(p.isInBaseline, false),
        createdAt: toDate(p.createdAt) || new Date(),
        updatedAt: toDate(p.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${products.length} feed products migrated`)
}

async function migratePlants() {
  console.log('\n🌱 Migrating Plants...')
  const plants = sqlite.prepare('SELECT * FROM Plant').all() as any[]

  // First pass: Create all plants without parent references
  for (const p of plants) {
    await prisma.plant.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        plantId: p.plantId,
        accessionDate: toDate(p.accessionDate) || new Date(),
        userId: MIGRATION_USER_ID,
        genus: p.genus || 'Anthurium',
        section: p.section,
        species: p.species,
        hybridName: p.hybridName,
        crossNotation: p.crossNotation,
        // Parent references set in second pass
        generation: p.generation,
        breeder: p.breeder,
        breederCode: p.breederCode,
        vendorId: p.vendorId,
        acquisitionCost: p.acquisitionCost,
        propagationType: p.propagationType,
        locationId: p.locationId,
        healthStatus: p.healthStatus || 'healthy',
        conservationStatus: p.conservationStatus,
        currentPotSize: p.currentPotSize,
        currentPotType: p.currentPotType,
        lastRepotDate: toDate(p.lastRepotDate),
        coverPhotoId: p.coverPhotoId,
        marketValue: p.marketValue,
        isForSale: toBool(p.isForSale, false),
        isMother: toBool(p.isMother, false),
        isEliteGenetics: toBool(p.isEliteGenetics, false),
        isArchived: toBool(p.isArchived, false),
        archivedAt: toDate(p.archivedAt),
        archiveReason: p.archiveReason,
        notes: p.notes,
        tags: parseJson(p.tags) || [],
        identifier: p.identifier,
        createdAt: toDate(p.createdAt) || new Date(),
        updatedAt: toDate(p.updatedAt) || new Date()
      }
    })
  }

  // Second pass: Update parent references
  console.log('   Updating parent references...')
  for (const p of plants) {
    if (p.femaleParentId || p.maleParentId || p.cloneSourceId) {
      await prisma.plant.update({
        where: { id: p.id },
        data: {
          femaleParentId: p.femaleParentId,
          maleParentId: p.maleParentId,
          cloneSourceId: p.cloneSourceId
        }
      })
    }
  }

  console.log(`   ✓ ${plants.length} plants migrated`)
}

async function migrateBreedingRecords() {
  console.log('\n🧬 Migrating Breeding Records...')
  const records = sqlite.prepare('SELECT * FROM BreedingRecord').all() as any[]

  for (const r of records) {
    await prisma.breedingRecord.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        crossId: r.crossId,
        crossDate: toDate(r.crossDate) || new Date(),
        userId: MIGRATION_USER_ID,
        femalePlantId: r.femalePlantId,
        malePlantId: r.malePlantId,
        crossType: r.crossType,
        crossCategory: r.crossCategory,
        pollinationMethod: r.pollinationMethod,
        targetTraits: parseJson(r.targetTraits),
        seedsProduced: r.seedsProduced,
        germinationRate: r.germinationRate,
        seedlingCount: r.seedlingCount,
        f1PlantsRaised: r.f1PlantsRaised,
        selectionCriteria: parseJson(r.selectionCriteria) || [],
        selectedPlants: parseJson(r.selectedPlants) || [],
        notes: r.notes,
        photos: parseJson(r.photos) || [],
        createdAt: toDate(r.createdAt) || new Date(),
        updatedAt: toDate(r.updatedAt) || new Date()
      }
    })
  }

  // Update plants with breedingRecordId
  const plantsWithBreeding = sqlite.prepare('SELECT id, breedingRecordId FROM Plant WHERE breedingRecordId IS NOT NULL').all() as any[]
  for (const p of plantsWithBreeding) {
    await prisma.plant.update({
      where: { id: p.id },
      data: { breedingRecordId: p.breedingRecordId }
    })
  }

  console.log(`   ✓ ${records.length} breeding records migrated`)
}

async function migrateCloneBatches() {
  console.log('\n🧫 Migrating Clone Batches...')
  const batches = sqlite.prepare('SELECT * FROM CloneBatch').all() as any[]

  for (const b of batches) {
    await prisma.cloneBatch.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        batchId: b.batchId,
        userId: MIGRATION_USER_ID,
        propagationType: b.propagationType,
        sourcePlantId: b.sourcePlantId,
        externalSource: b.externalSource,
        species: b.species,
        cultivarName: b.cultivarName,
        acquiredDate: toDate(b.acquiredDate) || new Date(),
        acquiredCount: b.acquiredCount,
        currentCount: b.currentCount,
        containerCount: b.containerCount || 1,
        containerType: b.containerType,
        status: b.status || 'GROWING',
        locationId: b.locationId,
        identifier: b.identifier,
        notes: b.notes,
        photos: parseJson(b.photos) || [],
        createdAt: toDate(b.createdAt) || new Date(),
        updatedAt: toDate(b.updatedAt) || new Date()
      }
    })
  }

  // Update plants with cloneBatchId
  const plantsWithClone = sqlite.prepare('SELECT id, cloneBatchId FROM Plant WHERE cloneBatchId IS NOT NULL').all() as any[]
  for (const p of plantsWithClone) {
    await prisma.plant.update({
      where: { id: p.id },
      data: { cloneBatchId: p.cloneBatchId }
    })
  }

  console.log(`   ✓ ${batches.length} clone batches migrated`)
}

async function migrateHarvests() {
  console.log('\n🍇 Migrating Harvests...')
  const harvests = sqlite.prepare('SELECT * FROM Harvest').all() as any[]

  for (const h of harvests) {
    await prisma.harvest.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id,
        breedingRecordId: h.breedingRecordId,
        harvestNumber: h.harvestNumber,
        harvestDate: toDate(h.harvestDate) || new Date(),
        berryCount: h.berryCount,
        seedCount: h.seedCount,
        seedViability: h.seedViability,
        notes: h.notes,
        photos: parseJson(h.photos) || [],
        createdAt: toDate(h.createdAt) || new Date(),
        updatedAt: toDate(h.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${harvests.length} harvests migrated`)
}

async function migrateSeedBatches() {
  console.log('\n🌰 Migrating Seed Batches...')
  const batches = sqlite.prepare('SELECT * FROM SeedBatch').all() as any[]

  for (const b of batches) {
    await prisma.seedBatch.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        batchId: b.batchId,
        harvestId: b.harvestId,
        sowDate: toDate(b.sowDate) || new Date(),
        seedCount: b.seedCount,
        substrate: b.substrate,
        container: b.container,
        temperature: b.temperature,
        humidity: b.humidity,
        heatMat: toBool(b.heatMat, false),
        domed: toBool(b.domed, true),
        lightLevel: b.lightLevel,
        germinatedCount: b.germinatedCount,
        germinationRate: b.germinationRate,
        firstEmergence: toDate(b.firstEmergence),
        lastEmergence: toDate(b.lastEmergence),
        status: b.status || 'SOWN',
        notes: b.notes,
        photos: parseJson(b.photos) || [],
        identifier: b.identifier,
        createdAt: toDate(b.createdAt) || new Date(),
        updatedAt: toDate(b.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${batches.length} seed batches migrated`)
}

async function migrateSeedlings() {
  console.log('\n🌿 Migrating Seedlings...')
  const seedlings = sqlite.prepare('SELECT * FROM Seedling').all() as any[]

  for (const s of seedlings) {
    await prisma.seedling.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        seedlingId: s.seedlingId,
        seedBatchId: s.seedBatchId,
        positionLabel: s.positionLabel,
        emergenceDate: toDate(s.emergenceDate) || new Date(),
        firstTrueLeaf: toDate(s.firstTrueLeaf),
        prickOutDate: toDate(s.prickOutDate),
        potSize: s.potSize,
        leafCount: s.leafCount,
        largestLeafCm: s.largestLeafCm,
        healthStatus: s.healthStatus || 'HEALTHY',
        selectionStatus: s.selectionStatus || 'GROWING',
        selectionDate: toDate(s.selectionDate),
        selectionNotes: s.selectionNotes,
        graduatedToPlantId: s.graduatedToPlantId,
        graduationDate: toDate(s.graduationDate),
        locationId: s.locationId,
        notes: s.notes,
        photos: parseJson(s.photos) || [],
        createdAt: toDate(s.createdAt) || new Date(),
        updatedAt: toDate(s.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${seedlings.length} seedlings migrated`)
}

async function migratePhotos() {
  console.log('\n📸 Migrating Photos...')
  const photos = sqlite.prepare('SELECT * FROM Photo').all() as any[]

  for (const p of photos) {
    await prisma.photo.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        plantId: p.plantId,
        userId: MIGRATION_USER_ID,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        // storagePath/thumbnailPath will be set during photo migration
        dateTaken: toDate(p.dateTaken) || new Date(),
        growthStage: p.growthStage,
        photoType: p.photoType,
        metadata: parseJson(p.metadata),
        aiAnalysis: parseJson(p.aiAnalysis),
        notes: p.notes,
        createdAt: toDate(p.createdAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${photos.length} photos migrated`)
}

async function migrateCareLogs() {
  console.log('\n📝 Migrating Care Logs...')
  const logs = sqlite.prepare('SELECT * FROM CareLog').all() as any[]

  for (const l of logs) {
    await prisma.careLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        plantId: l.plantId,
        cloneBatchId: l.cloneBatchId,
        date: toDate(l.date) || new Date(),
        action: l.action,
        inputEC: l.inputEC,
        inputPH: l.inputPH,
        outputEC: l.outputEC,
        outputPH: l.outputPH,
        isBaselineFeed: toBool(l.isBaselineFeed, false),
        feedComponents: parseJson(l.feedComponents),
        treatmentId: l.treatmentId,
        dosage: l.dosage,
        unit: l.unit,
        details: l.details,
        nextActionDue: toDate(l.nextActionDue),
        performedBy: l.performedBy,
        createdAt: toDate(l.createdAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${logs.length} care logs migrated`)
}

async function migrateMeasurements() {
  console.log('\n📏 Migrating Measurements...')
  const measurements = sqlite.prepare('SELECT * FROM Measurement').all() as any[]

  for (const m of measurements) {
    await prisma.measurement.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        plantId: m.plantId,
        measurementDate: toDate(m.measurementDate) || new Date(),
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
        createdAt: toDate(m.createdAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${measurements.length} measurements migrated`)
}

async function migrateTraits() {
  console.log('\n🎨 Migrating Traits...')
  const traits = sqlite.prepare('SELECT * FROM Trait').all() as any[]

  for (const t of traits) {
    await prisma.trait.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        plantId: t.plantId,
        category: t.category,
        traitName: t.traitName,
        value: t.value,
        expressionLevel: t.expressionLevel,
        inheritancePattern: t.inheritancePattern,
        observationDate: toDate(t.observationDate) || new Date(),
        notes: t.notes,
        createdAt: toDate(t.createdAt) || new Date(),
        updatedAt: toDate(t.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${traits.length} traits migrated`)
}

async function migrateGenetics() {
  console.log('\n🧬 Migrating Genetics...')
  const genetics = sqlite.prepare('SELECT * FROM Genetics').all() as any[]

  for (const g of genetics) {
    await prisma.genetics.upsert({
      where: { id: g.id },
      update: {},
      create: {
        id: g.id,
        plantId: g.plantId,
        raNumber: g.raNumber,
        ogNumber: g.ogNumber,
        provenance: g.provenance,
        ploidy: g.ploidy,
        dnaBarcode: g.dnaBarcode,
        sequenceData: parseJson(g.sequenceData),
        breedingValue: g.breedingValue,
        inbreedingCoeff: g.inbreedingCoeff,
        traitPredictions: parseJson(g.traitPredictions),
        createdAt: toDate(g.createdAt) || new Date(),
        updatedAt: toDate(g.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${genetics.length} genetics records migrated`)
}

async function migrateFloweringCycles() {
  console.log('\n🌸 Migrating Flowering Cycles...')
  const cycles = sqlite.prepare('SELECT * FROM FloweringCycle').all() as any[]

  for (const c of cycles) {
    await prisma.floweringCycle.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        plantId: c.plantId,
        spatheEmergence: toDate(c.spatheEmergence),
        femaleStart: toDate(c.femaleStart),
        femaleEnd: toDate(c.femaleEnd),
        maleStart: toDate(c.maleStart),
        maleEnd: toDate(c.maleEnd),
        spatheClose: toDate(c.spatheClose),
        pollenCollected: toBool(c.pollenCollected, false),
        pollenQuality: c.pollenQuality,
        pollenStored: toBool(c.pollenStored, false),
        pollenStorageDate: toDate(c.pollenStorageDate),
        crossesAttempted: parseJson(c.crossesAttempted) || [],
        seedsProduced: c.seedsProduced,
        temperature: c.temperature,
        humidity: c.humidity,
        notes: c.notes,
        createdAt: toDate(c.createdAt) || new Date(),
        updatedAt: toDate(c.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${cycles.length} flowering cycles migrated`)
}

async function migrateGrowthMetrics() {
  console.log('\n📈 Migrating Growth Metrics...')
  const metrics = sqlite.prepare('SELECT * FROM GrowthMetric').all() as any[]

  for (const m of metrics) {
    await prisma.growthMetric.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        plantId: m.plantId,
        date: toDate(m.date) || new Date(),
        leafCount: m.leafCount,
        largestLeafLength: m.largestLeafLength,
        largestLeafWidth: m.largestLeafWidth,
        averageLeafSize: m.averageLeafSize,
        newGrowthRate: m.newGrowthRate,
        hasStuntedGrowth: toBool(m.hasStuntedGrowth, false),
        hasCurledLeaves: toBool(m.hasCurledLeaves, false),
        hasYellowing: toBool(m.hasYellowing, false),
        hasEdgeBurn: toBool(m.hasEdgeBurn, false),
        hasSpiderMites: toBool(m.hasSpiderMites, false),
        potSize: m.potSize,
        daysSinceRepot: m.daysSinceRepot,
        notes: m.notes,
        createdAt: toDate(m.createdAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${metrics.length} growth metrics migrated`)
}

async function migratePlantJournals() {
  console.log('\n📓 Migrating Plant Journals...')
  const journals = sqlite.prepare('SELECT * FROM PlantJournal').all() as any[]

  for (const j of journals) {
    await prisma.plantJournal.upsert({
      where: { id: j.id },
      update: {},
      create: {
        id: j.id,
        plantId: j.plantId,
        timestamp: toDate(j.timestamp) || new Date(),
        entryType: j.entryType,
        context: j.context,
        entry: j.entry,
        referenceId: j.referenceId,
        referenceType: j.referenceType,
        author: j.author,
        tags: parseJson(j.tags) || [],
        // embedding skipped (Bytes → vector conversion needs separate process)
        summary: j.summary,
        createdAt: toDate(j.createdAt) || new Date(),
        updatedAt: toDate(j.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${journals.length} journal entries migrated`)
}

async function migrateChatLogs() {
  console.log('\n💬 Migrating Chat Logs...')
  const logs = sqlite.prepare('SELECT * FROM ChatLog').all() as any[]

  for (const l of logs) {
    await prisma.chatLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        plantId: l.plantId,
        title: l.title,
        messages: parseJson(l.messages) || [],
        originalContent: l.originalContent,
        displayContent: l.displayContent,
        wasEdited: toBool(l.wasEdited, false),
        qualityScore: l.qualityScore,
        retrievalWeight: l.retrievalWeight,
        weightVersion: l.weightVersion || 1,
        confidence: l.confidence || 'unverified',
        conversationDate: toDate(l.conversationDate) || new Date(),
        savedAt: toDate(l.savedAt) || new Date(),
        scoredAt: toDate(l.scoredAt),
        templateId: l.templateId,
        modelUsed: l.modelUsed,
        tokensUsed: l.tokensUsed,
        // embedding skipped (needs separate pgvector process)
        createdAt: toDate(l.createdAt) || new Date(),
        updatedAt: toDate(l.updatedAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${logs.length} chat logs migrated`)
}

async function migrateNegativeExamples() {
  console.log('\n❌ Migrating Negative Examples...')
  const examples = sqlite.prepare('SELECT * FROM NegativeExample').all() as any[]

  for (const e of examples) {
    await prisma.negativeExample.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        plantId: e.plantId,
        messages: parseJson(e.messages) || [],
        originalContent: e.originalContent,
        failureType: e.failureType,
        failureNotes: e.failureNotes,
        correctedResponse: e.correctedResponse,
        templateId: e.templateId,
        modelUsed: e.modelUsed,
        userPrompt: e.userPrompt,
        createdAt: toDate(e.createdAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${examples.length} negative examples migrated`)
}

async function migratePurchases() {
  console.log('\n🛒 Migrating Purchases...')
  const purchases = sqlite.prepare('SELECT * FROM Purchase').all() as any[]

  for (const p of purchases) {
    await prisma.purchase.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        vendorId: p.vendorId,
        purchaseDate: toDate(p.purchaseDate) || new Date(),
        totalCost: p.totalCost,
        plantCount: p.plantCount,
        invoiceNumber: p.invoiceNumber,
        trackingNumber: p.trackingNumber,
        plantIds: parseJson(p.plantIds) || [],
        notes: p.notes,
        createdAt: toDate(p.createdAt) || new Date()
      }
    })
  }
  console.log(`   ✓ ${purchases.length} purchases migrated`)
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

async function verifyCounts() {
  console.log('\n\n═══════════════════════════════════════════════════════════════')
  console.log('📊 VERIFICATION - Record Counts')
  console.log('═══════════════════════════════════════════════════════════════')

  const tables = [
    'Profile', 'Plant', 'Vendor', 'Location', 'Species', 'Treatment',
    'FeedProduct', 'Photo', 'CareLog', 'Measurement', 'Trait', 'Genetics',
    'FloweringCycle', 'GrowthMetric', 'PlantJournal', 'BreedingRecord',
    'Harvest', 'SeedBatch', 'Seedling', 'CloneBatch', 'ChatLog',
    'NegativeExample', 'Purchase'
  ]

  let allMatch = true

  for (const table of tables) {
    const sqliteCount = table === 'Profile' ? 0 :
      (sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any)?.count || 0

    // Get Postgres count
    let pgCount = 0
    try {
      pgCount = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count()
    } catch (e) {
      // Table might not exist in Postgres
    }

    const match = table === 'Profile' ? pgCount === 1 : sqliteCount === pgCount
    const status = match ? '✓' : '✗'

    if (!match) allMatch = false

    console.log(`   ${status} ${table.padEnd(20)} SQLite: ${String(sqliteCount).padStart(5)} | Postgres: ${String(pgCount).padStart(5)}`)
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  if (allMatch) {
    console.log('✅ All counts match! Migration verified.')
  } else {
    console.log('⚠️  Some counts do not match. Review above.')
  }
  console.log('═══════════════════════════════════════════════════════════════')
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('🚀 CLADARI SQLite → Supabase Migration')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   User ID: ${MIGRATION_USER_ID}`)
  console.log(`   Email: ${MIGRATION_USER_EMAIL}`)
  console.log('═══════════════════════════════════════════════════════════════')

  try {
    // Create profile first (required for foreign keys)
    await createProfile()

    // Reference data (no dependencies)
    await migrateSpecies()
    await migrateTreatments()
    await migrateFeedProducts()

    // Primary entities with userId
    await migrateVendors()
    await migrateLocations()

    // Plants (depends on vendors, locations)
    await migratePlants()

    // Breeding pipeline
    await migrateBreedingRecords()
    await migrateCloneBatches()
    await migrateHarvests()
    await migrateSeedBatches()
    await migrateSeedlings()

    // Plant children
    await migratePhotos()
    await migrateCareLogs()
    await migrateMeasurements()
    await migrateTraits()
    await migrateGenetics()
    await migrateFloweringCycles()
    await migrateGrowthMetrics()
    await migratePlantJournals()
    await migrateChatLogs()
    await migrateNegativeExamples()

    // Vendor children
    await migratePurchases()

    // Verify
    await verifyCounts()

    console.log('\n🎉 Migration complete!')
    console.log('\nNext steps:')
    console.log('   1. Run photo migration: npx tsx scripts/migrate-photos-to-supabase.ts')
    console.log('   2. Test API endpoints')
    console.log('   3. Verify UI functionality')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

main()
