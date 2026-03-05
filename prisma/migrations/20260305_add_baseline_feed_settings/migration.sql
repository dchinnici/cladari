-- AlterTable: Add per-user baseline feed settings
-- These are nullable so existing users get NULL (falls back to app defaults)
ALTER TABLE "Profile" ADD COLUMN "baselineEC" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN "baselinePH" DOUBLE PRECISION;
ALTER TABLE "Profile" ADD COLUMN "baselineNotes" TEXT;
