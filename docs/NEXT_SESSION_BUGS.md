# Next Session Bug List & Context

**Created:** 2025-12-21
**Context from session:** Security audit fixes, photo upload fixes, ML architecture decisions

---

## What Was Fixed This Session

### Security (Commit `15fadda`)
- Added userId ownership checks to 5 API routes (plants/lookup, plants/export, locations/[id], print/location-tag, photos)
- Added 10s timeout to SensorPush and Weather API calls
- Fixed CareQueue dynamic Tailwind classes
- Created `/src/lib/constants.ts` for centralized thresholds

### Photo Upload (Commits `d53a6be`, `333642c`, `87b3f31`)
- Fixed Vercel serverless issues (use `/tmp`, fallback when exiftool unavailable)
- Added client-side image compression (Canvas API, max 4MB for Vercel Hobby limit)
- Added `Photo.originalFilename` field for ML training data mapping to high-res originals

---

## Bug List (Chronological Order)

### 1. Migrate Plants to Seedlings
**Plants:** ANT-2025-0012, ANT-2025-0062 (CONFIRM IDs)
**Task:** Move these from Plant table to Seedling table, then allow individual graduation back to Plant
**Context:** These were likely accessioned prematurely before proper seedling tracking existed

### 2. Stale Status Thresholds
**Current:** All plants use hardcoded 7-day threshold for green/yellow/red status
**Needed:** Calculate thresholds from care history averages when sufficient data exists (e.g., if plant averages 4-day watering, yellow at 5 days, red at 7 days)
**Fallback:** 7 days for plants without enough data
**Files:** `src/components/care/CareQueue.tsx`, `src/lib/constants.ts` (thresholds already centralized)

### 3. Photos for Crosses and Batches
**Current:** Only Plant model has Photo relation
**Needed:** Add photo upload capability to:
- BreedingRecord (crosses)
- SeedBatch
- CloneBatch
**Schema change:** Add `breedingRecordId`, `seedBatchId`, `cloneBatchId` to Photo model (nullable)

### 4. Batch Care Log Formatting
**Issue:** Care logging UI in batches looks different than plant care log module
**Files:** Compare `/batches/[id]/page.tsx` care logging vs `/plants/[id]/page.tsx`
**Fix:** Unify the UI components

### 5. Multi-Tenant Printing
**Current:** Zebra printing uses `lp` command on Dave's local Mac
**Problem:** Won't work for other users on cladari.ai
**Options:**
- QZ Tray (browser plugin, requires user install)
- PDF generation for user to print locally
- "Copy ZPL" button for users with their own Zebra
**Decision needed:** What's acceptable UX for other users?

### 6. Tag Label Redesign
**Issues:**
a. Long names don't wrap (CSS fix)
b. Want different designs for different use cases:

**Pot Stickers (current 57x32mm size):**
- QR code prominent
- Common name
- Species/cross notation
- Substrate ID (e.g., "4.0 PON", "4.5 Pon")
- Repot date

**Plant Tags (2-3" x 0.75-1"):**
- QR code
- Common name
- Cross annotation
- "Birthdate" (accession date)

**Files:** `src/lib/zpl.ts` (ZPL templates)

### 7. Batch Care Shows UID Not Name
**Issue:** Batch care selection shows CUIDs like `cmgsezkjd003tgw74hosd87vo`
**Needed:** Show `hybridName || species || plantId` instead
**User context:** "I know plant names by heart, but I don't know the UID"
**Files:** Batch care components, likely in `/batch-care/` or QuickCare.tsx

### 8. Flowering Tracking Refactor (MAJOR)
**Current problems:**
- `femaleStart`/`femaleEnd`/`maleStart`/`maleEnd` don't match reality
- Female and male phases overlap in practice
- Residual pollen ≠ male stage (could be spent flower with leftover pollen)
- `spatheClose` is wrong - spathe doesn't "close" on Anthurium
- Exact day tracking is impractical

**Proposed new approach (NEEDS USER INPUT):**
- Simpler stages: `spathe_emerging`, `receptive`, `pollen_shedding`, `spent`?
- Duration estimates vs exact dates?
- What data is actually actionable for breeding decisions?

**Schema:** `FloweringCycle` model in prisma/schema.prisma

### 9. SWP vs Top Watering Care Tracking
**Question:** What is SWP? (Semi-Water Pot? Sub-irrigated?)
**Need:**
- Track care method per plant/location
- Different recommendations based on method
- Analytics on outcomes by care method

### 10. Clone Batch Individual Graduation
**Current:** No visible way to graduate individual clones from batch to Plant
**Needed:**
- UI in clone batch detail to select and graduate individuals
- Similar to seedling graduation workflow
- Must work on mobile PWA

### 11. Autocomplete/Search for Misspellings
**Problem:** Free-text entry leads to typos (species names, hybrid names)
**Solution options:**
- Autocomplete from existing values
- Dropdown with search
- Fuzzy matching suggestions
- "Did you mean...?" validation

**Affects:** Species, hybridName, breeder, vendor fields

### 12. Future Event Alerts/Reminders
**Use cases:**
- "Repot on 11/15"
- "Pest treatment follow-up in 7 days"
- "Document flower stage tomorrow"

**Implementation options:**
- New `Reminder` model with date, message, plantId
- Push notifications (requires service worker enhancement)
- Email notifications (requires email service)
- Dashboard "upcoming" section

### 13. SensorPush API Missing Extreme Readings (CRITICAL for AI Analysis)
**Discovered:** 2025-12-22
**Context:** During leaf damage analysis on ANT-2025-0024 (FTG Crystallinum)

**Problem:**
The SensorPush API `/samples` endpoint returns **sampled data points**, not true min/max values. This causes the AI to miss critical stress events:

| Metric | SensorPush App (Truth) | API Data (3500 samples) |
|--------|------------------------|------------------------|
| RH Minimum | **49.5%** | 57.2% |
| VPD Maximum | **1.35 kPa** | 1.24 kPa |

The app calculates true min/max from ALL readings (~1440/day at 1-min intervals). The API with 500 samples/window only captures ~17% of readings, missing the valleys.

**Impact:**
- AI incorrectly reports "No stress events detected" when plant experienced 49.5% RH dips
- AI says "environment was excellent" when VPD spiked to 1.35 kPa
- Leads to wrong diagnoses (attributed damage to guttation instead of desiccation)

**Current workaround (v1.7.7):**
- Windowed queries (2-day chunks, 7 parallel requests)
- Gets 3500 samples instead of 500
- Still misses extremes due to sampling

**Potential fixes (investigate):**
1. Check if SensorPush has a stats/summary endpoint that returns min/max per period
2. Dramatically increase sample density (more windows, higher limits)
3. Calculate and cache daily min/max via scheduled job
4. Use SensorPush webhook for real-time extreme detection

**Files:**
- `src/app/api/chat/route.ts` - `getEnvironmentalHistory()` function
- `src/lib/sensorpush.ts` - API client

**Priority:** HIGH - This causes fundamental diagnostic errors in AI analysis

---

## Architectural Decisions Made This Session

### ML Training Architecture
- Cladari = annotation layer (compressed previews, rich metadata)
- NAS/Lightroom = high-res originals (full resolution for training)
- Join key = `Photo.originalFilename` + EXIF DateTimeOriginal
- Enables training on full-res data for "4-pixel mite detection" while using compressed for web display

### Photo Compression Strategy
- Client-side Canvas API compression before upload
- Target: under 4MB (Vercel Hobby limit is 4.5MB)
- 85% JPEG quality, step down to 50% if needed
- Max 2000px dimension
- Trade-off accepted: compressed web previews, map to full-res for ML

---

## Files Changed This Session
- `src/app/api/photos/route.ts` - Serverless fixes, originalFilename storage
- `src/app/api/plants/lookup/route.ts` - Auth fix
- `src/app/api/plants/[id]/export/route.ts` - Auth fix
- `src/app/api/locations/[id]/route.ts` - Auth fix (GET/PATCH/DELETE)
- `src/app/api/print/location-tag/[name]/route.ts` - Auth fix
- `src/app/plants/[id]/page.tsx` - Client-side image compression
- `src/lib/sensorpush.ts` - 10s timeout
- `src/lib/weather.ts` - 10s timeout
- `src/lib/constants.ts` - NEW: centralized thresholds
- `src/components/care/CareQueue.tsx` - Tailwind fix, constants
- `src/components/QuickCare.tsx` - Constants
- `prisma/schema.prisma` - Photo.originalFilename field
- `vercel.json` - maxDuration for photos API
