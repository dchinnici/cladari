-- Multi-tenant fix: Location and Vendor names should be unique per-user, not globally
-- This prevents User B from being blocked when they create a location with the same
-- name as User A's location.

-- Drop global unique constraint on Location.name
DROP INDEX IF EXISTS "Location_name_key";

-- Add compound unique constraint: name unique per user
CREATE UNIQUE INDEX "Location_userId_name_key" ON "Location"("userId", "name");

-- Drop global unique constraint on Vendor.name
DROP INDEX IF EXISTS "Vendor_name_key";

-- Add compound unique constraint: name unique per user
CREATE UNIQUE INDEX "Vendor_userId_name_key" ON "Vendor"("userId", "name");
