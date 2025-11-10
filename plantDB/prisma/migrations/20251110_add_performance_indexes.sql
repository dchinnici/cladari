-- Performance indexes for Cladari Plant Management System
-- These indexes optimize the most common queries in the application

-- Plant queries optimization
CREATE INDEX IF NOT EXISTS idx_plant_health_updated
  ON Plant(healthStatus, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_plant_location_updated
  ON Plant(locationId, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_plant_archived_updated
  ON Plant(isArchived, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_plant_elite
  ON Plant(isEliteGenetics, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_plant_breeder_code
  ON Plant(breederCode);

-- Care log queries optimization
CREATE INDEX IF NOT EXISTS idx_carelog_plant_date
  ON CareLog(plantId, date DESC);

CREATE INDEX IF NOT EXISTS idx_carelog_action_date
  ON CareLog(action, date DESC);

CREATE INDEX IF NOT EXISTS idx_carelog_date_only
  ON CareLog(date DESC);

-- Measurement queries optimization
CREATE INDEX IF NOT EXISTS idx_measurement_plant_date
  ON Measurement(plantId, measurementDate DESC);

-- Flowering cycle queries optimization
CREATE INDEX IF NOT EXISTS idx_flowering_female_start
  ON FloweringCycle(femaleStart DESC) WHERE femaleStart IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_flowering_male_start
  ON FloweringCycle(maleStart DESC) WHERE maleStart IS NOT NULL;

-- Trait queries optimization
CREATE INDEX IF NOT EXISTS idx_trait_plant_category
  ON Trait(plantId, category);

CREATE INDEX IF NOT EXISTS idx_trait_observation_date
  ON Trait(observationDate DESC);

-- Photo queries optimization
CREATE INDEX IF NOT EXISTS idx_photo_plant_taken
  ON Photo(plantId, dateTaken DESC);

-- Location queries optimization
CREATE INDEX IF NOT EXISTS idx_location_name
  ON Location(name);

-- Vendor queries optimization
CREATE INDEX IF NOT EXISTS idx_vendor_name
  ON Vendor(name);

-- Compound indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_plant_location_health
  ON Plant(locationId, healthStatus, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_carelog_plant_action_date
  ON CareLog(plantId, action, date DESC);

-- Stats for query optimizer
ANALYZE;