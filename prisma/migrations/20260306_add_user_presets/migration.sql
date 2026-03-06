-- Add user-defined presets for substrate mixes and IPM products
ALTER TABLE "Profile" ADD COLUMN "substrateMixes" JSONB;
ALTER TABLE "Profile" ADD COLUMN "ipmProducts" JSONB;
