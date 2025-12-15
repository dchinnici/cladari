-- ═══════════════════════════════════════════════════════════════════════════
-- CLADARI ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor after schema push
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all primary tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Plant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BreedingRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CloneBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Photo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CareLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatLogChunk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NegativeExample" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Measurement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trait" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlantJournal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FloweringCycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GrowthMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Genetics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Harvest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeedBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Seedling" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Purchase" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILE POLICIES (linked to auth.users.id)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own profile" ON "Profile"
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON "Profile"
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON "Profile"
  FOR INSERT WITH CHECK (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- PRIMARY ENTITY POLICIES (have direct userId)
-- ═══════════════════════════════════════════════════════════════════════════

-- Plant
CREATE POLICY "Users can view own plants" ON "Plant"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "Users can insert own plants" ON "Plant"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Users can update own plants" ON "Plant"
  FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "Users can delete own plants" ON "Plant"
  FOR DELETE USING ("userId" = auth.uid());

-- Location
CREATE POLICY "Users can view own locations" ON "Location"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "Users can insert own locations" ON "Location"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Users can update own locations" ON "Location"
  FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "Users can delete own locations" ON "Location"
  FOR DELETE USING ("userId" = auth.uid());

-- Vendor
CREATE POLICY "Users can view own vendors" ON "Vendor"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "Users can insert own vendors" ON "Vendor"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Users can update own vendors" ON "Vendor"
  FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "Users can delete own vendors" ON "Vendor"
  FOR DELETE USING ("userId" = auth.uid());

-- BreedingRecord
CREATE POLICY "Users can view own breeding records" ON "BreedingRecord"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "Users can insert own breeding records" ON "BreedingRecord"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Users can update own breeding records" ON "BreedingRecord"
  FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "Users can delete own breeding records" ON "BreedingRecord"
  FOR DELETE USING ("userId" = auth.uid());

-- CloneBatch
CREATE POLICY "Users can view own clone batches" ON "CloneBatch"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "Users can insert own clone batches" ON "CloneBatch"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Users can update own clone batches" ON "CloneBatch"
  FOR UPDATE USING ("userId" = auth.uid());
CREATE POLICY "Users can delete own clone batches" ON "CloneBatch"
  FOR DELETE USING ("userId" = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD ENTITY POLICIES (join through parent Plant)
-- ═══════════════════════════════════════════════════════════════════════════

-- Photo (has optional userId, but mainly joins through Plant)
CREATE POLICY "Users can view own photos" ON "Photo"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Photo"."plantId" AND "Plant"."userId" = auth.uid())
    OR "userId" = auth.uid()
  );
CREATE POLICY "Users can insert own photos" ON "Photo"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Photo"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can delete own photos" ON "Photo"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Photo"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- CareLog (can be for Plant OR CloneBatch)
CREATE POLICY "Users can view own care logs" ON "CareLog"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "CareLog"."plantId" AND "Plant"."userId" = auth.uid())
    OR EXISTS (SELECT 1 FROM "CloneBatch" WHERE "CloneBatch".id = "CareLog"."cloneBatchId" AND "CloneBatch"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own care logs" ON "CareLog"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "CareLog"."plantId" AND "Plant"."userId" = auth.uid())
    OR EXISTS (SELECT 1 FROM "CloneBatch" WHERE "CloneBatch".id = "CareLog"."cloneBatchId" AND "CloneBatch"."userId" = auth.uid())
  );
CREATE POLICY "Users can delete own care logs" ON "CareLog"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "CareLog"."plantId" AND "Plant"."userId" = auth.uid())
    OR EXISTS (SELECT 1 FROM "CloneBatch" WHERE "CloneBatch".id = "CareLog"."cloneBatchId" AND "CloneBatch"."userId" = auth.uid())
  );

-- ChatLog
CREATE POLICY "Users can view own chat logs" ON "ChatLog"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "ChatLog"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own chat logs" ON "ChatLog"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "ChatLog"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can update own chat logs" ON "ChatLog"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "ChatLog"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can delete own chat logs" ON "ChatLog"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "ChatLog"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- ChatLogChunk (joins through ChatLog)
CREATE POLICY "Users can view own chat log chunks" ON "ChatLogChunk"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ChatLog" cl
      JOIN "Plant" p ON p.id = cl."plantId"
      WHERE cl.id = "ChatLogChunk"."chatLogId" AND p."userId" = auth.uid()
    )
  );
CREATE POLICY "Users can insert own chat log chunks" ON "ChatLogChunk"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatLog" cl
      JOIN "Plant" p ON p.id = cl."plantId"
      WHERE cl.id = "ChatLogChunk"."chatLogId" AND p."userId" = auth.uid()
    )
  );

-- NegativeExample
CREATE POLICY "Users can view own negative examples" ON "NegativeExample"
  FOR SELECT USING (
    "plantId" IS NULL OR EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "NegativeExample"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own negative examples" ON "NegativeExample"
  FOR INSERT WITH CHECK (
    "plantId" IS NULL OR EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "NegativeExample"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- Measurement
CREATE POLICY "Users can view own measurements" ON "Measurement"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Measurement"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own measurements" ON "Measurement"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Measurement"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can update own measurements" ON "Measurement"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Measurement"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can delete own measurements" ON "Measurement"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Measurement"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- Trait
CREATE POLICY "Users can view own traits" ON "Trait"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Trait"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own traits" ON "Trait"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Trait"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can update own traits" ON "Trait"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Trait"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can delete own traits" ON "Trait"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Trait"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- PlantJournal
CREATE POLICY "Users can view own journal entries" ON "PlantJournal"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "PlantJournal"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own journal entries" ON "PlantJournal"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "PlantJournal"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- FloweringCycle
CREATE POLICY "Users can view own flowering cycles" ON "FloweringCycle"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "FloweringCycle"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own flowering cycles" ON "FloweringCycle"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "FloweringCycle"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can update own flowering cycles" ON "FloweringCycle"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "FloweringCycle"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- GrowthMetric
CREATE POLICY "Users can view own growth metrics" ON "GrowthMetric"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "GrowthMetric"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own growth metrics" ON "GrowthMetric"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "GrowthMetric"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- Genetics
CREATE POLICY "Users can view own genetics" ON "Genetics"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Genetics"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own genetics" ON "Genetics"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Genetics"."plantId" AND "Plant"."userId" = auth.uid())
  );
CREATE POLICY "Users can update own genetics" ON "Genetics"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "Plant" WHERE "Plant".id = "Genetics"."plantId" AND "Plant"."userId" = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- BREEDING PIPELINE POLICIES (join through BreedingRecord)
-- ═══════════════════════════════════════════════════════════════════════════

-- Harvest
CREATE POLICY "Users can view own harvests" ON "Harvest"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "BreedingRecord" WHERE "BreedingRecord".id = "Harvest"."breedingRecordId" AND "BreedingRecord"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own harvests" ON "Harvest"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "BreedingRecord" WHERE "BreedingRecord".id = "Harvest"."breedingRecordId" AND "BreedingRecord"."userId" = auth.uid())
  );
CREATE POLICY "Users can update own harvests" ON "Harvest"
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "BreedingRecord" WHERE "BreedingRecord".id = "Harvest"."breedingRecordId" AND "BreedingRecord"."userId" = auth.uid())
  );
CREATE POLICY "Users can delete own harvests" ON "Harvest"
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM "BreedingRecord" WHERE "BreedingRecord".id = "Harvest"."breedingRecordId" AND "BreedingRecord"."userId" = auth.uid())
  );

-- SeedBatch (joins through Harvest -> BreedingRecord)
CREATE POLICY "Users can view own seed batches" ON "SeedBatch"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Harvest" h
      JOIN "BreedingRecord" br ON br.id = h."breedingRecordId"
      WHERE h.id = "SeedBatch"."harvestId" AND br."userId" = auth.uid()
    )
  );
CREATE POLICY "Users can insert own seed batches" ON "SeedBatch"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Harvest" h
      JOIN "BreedingRecord" br ON br.id = h."breedingRecordId"
      WHERE h.id = "SeedBatch"."harvestId" AND br."userId" = auth.uid()
    )
  );
CREATE POLICY "Users can update own seed batches" ON "SeedBatch"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "Harvest" h
      JOIN "BreedingRecord" br ON br.id = h."breedingRecordId"
      WHERE h.id = "SeedBatch"."harvestId" AND br."userId" = auth.uid()
    )
  );

-- Seedling (joins through SeedBatch -> Harvest -> BreedingRecord)
CREATE POLICY "Users can view own seedlings" ON "Seedling"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "SeedBatch" sb
      JOIN "Harvest" h ON h.id = sb."harvestId"
      JOIN "BreedingRecord" br ON br.id = h."breedingRecordId"
      WHERE sb.id = "Seedling"."seedBatchId" AND br."userId" = auth.uid()
    )
  );
CREATE POLICY "Users can insert own seedlings" ON "Seedling"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "SeedBatch" sb
      JOIN "Harvest" h ON h.id = sb."harvestId"
      JOIN "BreedingRecord" br ON br.id = h."breedingRecordId"
      WHERE sb.id = "Seedling"."seedBatchId" AND br."userId" = auth.uid()
    )
  );
CREATE POLICY "Users can update own seedlings" ON "Seedling"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "SeedBatch" sb
      JOIN "Harvest" h ON h.id = sb."harvestId"
      JOIN "BreedingRecord" br ON br.id = h."breedingRecordId"
      WHERE sb.id = "Seedling"."seedBatchId" AND br."userId" = auth.uid()
    )
  );

-- Purchase (joins through Vendor)
CREATE POLICY "Users can view own purchases" ON "Purchase"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Vendor" WHERE "Vendor".id = "Purchase"."vendorId" AND "Vendor"."userId" = auth.uid())
  );
CREATE POLICY "Users can insert own purchases" ON "Purchase"
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Vendor" WHERE "Vendor".id = "Purchase"."vendorId" AND "Vendor"."userId" = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- SHARED REFERENCE DATA (read-only for all authenticated users)
-- ═══════════════════════════════════════════════════════════════════════════

-- Species (shared reference data - anyone can read)
ALTER TABLE "Species" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view species" ON "Species"
  FOR SELECT USING (true);

-- Treatment (shared reference data)
ALTER TABLE "Treatment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view treatments" ON "Treatment"
  FOR SELECT USING (true);

-- FeedProduct (shared reference data)
ALTER TABLE "FeedProduct" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view feed products" ON "FeedProduct"
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE!
-- Note: Service role key (used by Next.js API) bypasses all RLS policies
-- ═══════════════════════════════════════════════════════════════════════════
