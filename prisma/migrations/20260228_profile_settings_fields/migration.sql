-- Add user-configurable settings to Profile
-- These enable multi-tenant weather, timezone, and location features

ALTER TABLE "Profile" ADD COLUMN "timezone" TEXT;
ALTER TABLE "Profile" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN "city" TEXT;

-- Backfill Dave's profile with Boca Raton coordinates
UPDATE "Profile"
SET timezone = 'America/New_York',
    latitude = 26.3683,
    longitude = -80.1289,
    city = 'Boca Raton, FL'
WHERE id = '01b9f666-3b6f-4a7f-8028-5ca833c4b02e';
