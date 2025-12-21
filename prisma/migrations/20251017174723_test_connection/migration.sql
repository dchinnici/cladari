-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "accessionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genus" TEXT NOT NULL DEFAULT 'Anthurium',
    "speciesComplex" TEXT,
    "species" TEXT,
    "hybridName" TEXT,
    "crossNotation" TEXT,
    "femaleParentId" TEXT,
    "maleParentId" TEXT,
    "generation" TEXT,
    "breeder" TEXT,
    "breederCode" TEXT,
    "vendorId" TEXT,
    "acquisitionCost" REAL,
    "propagationType" TEXT,
    "locationId" TEXT,
    "healthStatus" TEXT NOT NULL DEFAULT 'healthy',
    "conservationStatus" TEXT,
    "marketValue" REAL,
    "isForSale" BOOLEAN NOT NULL DEFAULT false,
    "isMother" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plant_femaleParentId_fkey" FOREIGN KEY ("femaleParentId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Plant_maleParentId_fkey" FOREIGN KEY ("maleParentId") REFERENCES "Plant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Plant_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Plant_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BreedingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crossId" TEXT NOT NULL,
    "crossDate" DATETIME NOT NULL,
    "femalePlantId" TEXT NOT NULL,
    "malePlantId" TEXT NOT NULL,
    "crossType" TEXT NOT NULL,
    "pollinationMethod" TEXT,
    "seedsProduced" INTEGER,
    "germinationRate" REAL,
    "seedlingCount" INTEGER,
    "f1PlantsRaised" INTEGER,
    "selectionCriteria" TEXT NOT NULL DEFAULT '[]',
    "selectedPlants" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BreedingRecord_femalePlantId_fkey" FOREIGN KEY ("femalePlantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BreedingRecord_malePlantId_fkey" FOREIGN KEY ("malePlantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Genetics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "raNumber" TEXT,
    "ogNumber" TEXT,
    "provenance" TEXT,
    "ploidy" TEXT,
    "dnaBarcode" TEXT,
    "sequenceData" TEXT,
    "variegationType" TEXT,
    "breedingValue" REAL,
    "inbreedingCoeff" REAL,
    "traitPredictions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Genetics_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "traitName" TEXT NOT NULL,
    "value" TEXT,
    "expressionLevel" REAL,
    "inheritancePattern" TEXT,
    "observationDate" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trait_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "dateTaken" DATETIME NOT NULL,
    "growthStage" TEXT,
    "photoType" TEXT NOT NULL,
    "metadata" TEXT,
    "aiAnalysis" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "action" TEXT NOT NULL,
    "treatmentId" TEXT,
    "dosage" REAL,
    "unit" TEXT,
    "details" TEXT,
    "nextActionDue" DATETIME,
    "performedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CareLog_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "composition" TEXT,
    "applicationRate" TEXT,
    "frequency" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plantId" TEXT NOT NULL,
    "measurementDate" DATETIME NOT NULL,
    "measurementType" TEXT DEFAULT 'routine',
    "leafLength" REAL,
    "leafWidth" REAL,
    "petioleLength" REAL,
    "internodeLength" REAL,
    "primaryVeinColor" TEXT,
    "flushColor" TEXT,
    "petioleColor" TEXT,
    "texture" TEXT,
    "vigorScore" INTEGER,
    "leafCount" INTEGER,
    "height" REAL,
    "ecValue" REAL,
    "phValue" REAL,
    "tdsValue" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Measurement_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "country" TEXT,
    "reputationScore" REAL,
    "specialties" TEXT NOT NULL DEFAULT '[]',
    "contactInfo" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "totalCost" REAL NOT NULL,
    "plantCount" INTEGER NOT NULL,
    "invoiceNumber" TEXT,
    "trackingNumber" TEXT,
    "plantIds" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "zone" TEXT,
    "shelf" TEXT,
    "position" TEXT,
    "lightLevel" TEXT,
    "humidity" REAL,
    "temperature" REAL,
    "capacity" INTEGER,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "genus" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "section" TEXT,
    "commonNames" TEXT NOT NULL DEFAULT '[]',
    "nativeRange" TEXT,
    "conservationStatus" TEXT,
    "citesListing" TEXT,
    "keyTraits" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Plant_plantId_key" ON "Plant"("plantId");

-- CreateIndex
CREATE INDEX "Plant_plantId_idx" ON "Plant"("plantId");

-- CreateIndex
CREATE INDEX "Plant_vendorId_idx" ON "Plant"("vendorId");

-- CreateIndex
CREATE INDEX "Plant_locationId_idx" ON "Plant"("locationId");

-- CreateIndex
CREATE INDEX "Plant_speciesComplex_idx" ON "Plant"("speciesComplex");

-- CreateIndex
CREATE UNIQUE INDEX "BreedingRecord_crossId_key" ON "BreedingRecord"("crossId");

-- CreateIndex
CREATE INDEX "BreedingRecord_femalePlantId_idx" ON "BreedingRecord"("femalePlantId");

-- CreateIndex
CREATE INDEX "BreedingRecord_malePlantId_idx" ON "BreedingRecord"("malePlantId");

-- CreateIndex
CREATE INDEX "BreedingRecord_crossDate_idx" ON "BreedingRecord"("crossDate");

-- CreateIndex
CREATE UNIQUE INDEX "Genetics_plantId_key" ON "Genetics"("plantId");

-- CreateIndex
CREATE INDEX "Trait_plantId_idx" ON "Trait"("plantId");

-- CreateIndex
CREATE INDEX "Trait_category_idx" ON "Trait"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Trait_plantId_category_traitName_key" ON "Trait"("plantId", "category", "traitName");

-- CreateIndex
CREATE INDEX "Photo_plantId_idx" ON "Photo"("plantId");

-- CreateIndex
CREATE INDEX "Photo_dateTaken_idx" ON "Photo"("dateTaken");

-- CreateIndex
CREATE INDEX "CareLog_plantId_idx" ON "CareLog"("plantId");

-- CreateIndex
CREATE INDEX "CareLog_date_idx" ON "CareLog"("date");

-- CreateIndex
CREATE INDEX "CareLog_action_idx" ON "CareLog"("action");

-- CreateIndex
CREATE INDEX "Measurement_plantId_idx" ON "Measurement"("plantId");

-- CreateIndex
CREATE INDEX "Measurement_measurementDate_idx" ON "Measurement"("measurementDate");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Purchase_vendorId_idx" ON "Purchase"("vendorId");

-- CreateIndex
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Location_name_idx" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Species_section_idx" ON "Species"("section");

-- CreateIndex
CREATE UNIQUE INDEX "Species_genus_species_key" ON "Species"("genus", "species");
