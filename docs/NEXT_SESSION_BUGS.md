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

### 2. ~~Stale Status Thresholds~~ ✅ FIXED (Dec 24, 2025)
**Solution:** Dynamic threshold logic already existed in `src/lib/care-thresholds.ts`. Fixed plant cards in `src/app/plants/page.tsx` to use `getCareStatus()` instead of hardcoded 5/7 day thresholds.
- Uses 1.3x average interval for yellow/warning
- Uses 1.7x average interval for red/overdue
- Falls back to static 5/7 days if plant has < 3 care events
- Now shows dynamic interval hint: "(~4.2d avg)" for plants with enough data

### 3. ~~Photos for Crosses and Batches~~ ✅ FIXED (Feb 16, 2026)
**Solution:** Photo model already had polymorphic relations (`breedingRecordId`, `seedBatchId`, `cloneBatchId`). Added:
- Camera upload button + thumbnail grid on breeding page cross cards
- Clone batch photo upload already existed in `batches/[id]/page.tsx`
- Breeding API now includes photos + `_count.photos` in response
- Clone batch graduation now copies photos to graduated plants

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

### 7. ~~Batch Care Shows UID Not Name~~ ✅ ALREADY FIXED
**Verified:** Dec 24, 2025 - `src/app/batch-care/page.tsx:561-569` shows `hybridName || species || plantId` with plantId as secondary mono text.

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

### 10. ~~Clone Batch Individual Graduation~~ ✅ ALREADY FIXED
**Verified:** Dec 24, 2025 - Full graduation UI exists in `src/app/batches/[id]/page.tsx:284-350, 1074-1222`
- "Graduate to Plant" button with count selector
- Form for hybridName, species, potSize, substrate, location
- Multi-plant graduation support with proper validation

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

### 13. ~~SensorPush Test Data Pollution~~ ✅ FIXED (Feb 16, 2026)
**Discovered:** 2025-12-22 (fridge/freezer sensor ID tests)
**Fixed:** 2026-02-16 (automatic anomaly filtering + manual exclusion periods)

**Original Problem:**
Fridge/freezer sensor identification tests (30°F readings) polluted environmental history, causing AI to misdiagnose plant stress as "critical cold exposure" instead of actual issues like desiccation.

**Solution Implemented:**
Two-tier filtering in `src/app/api/chat/route.ts`:
1. **Automatic outlier rejection:** Filters temps <45°F or >110°F (clearly not plant environment)
2. **Manual exclusion periods:** Configurable date range blacklist per sensor

**Safe Sensor Renaming:**
PlantDB uses stable sensor IDs (not names), so renaming in SensorPush app won't break historical data. See `docs/SENSORPUSH_MANAGEMENT.md` for full guide.

**Files Changed:**
- `src/app/api/chat/route.ts` - Anomaly filtering in getEnvironmentalHistory()
- `docs/SENSORPUSH_MANAGEMENT.md` - NEW: Complete renaming and filtering guide

---

### 13b. SensorPush API Missing Extreme Readings (STILL INVESTIGATING)
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

### 14. Supabase Image Transformations (DEFERRED)
**Discovered:** 2025-12-22
**Status:** Disabled - using original images for now

**Background:**
Upgraded to Supabase Pro to fix egress overages (10GB on 5GB limit). Attempted to implement image transformations via the `/render/` endpoint to serve optimized thumbnails.

**What went wrong:**
1. **Bucket was private** - render endpoint requires public bucket (fixed by toggling public in dashboard)
2. **Invalid `format=webp` parameter** - Supabase auto-optimizes format, doesn't accept explicit format param
3. **Display issues** - Even after fixing the above, thumbnails appeared either:
   - Cropped/zoomed when using `object-cover`
   - Tiny slivers with letterboxing when using `object-contain`
   - The transformation seemed to affect aspect ratio unexpectedly

**Current state:**
- Transformations disabled in `/src/lib/photo-url.ts`
- Using object endpoint (original images) which works correctly
- Bucket is now public

**To revisit:**
1. Test transformations in isolation (curl requests) to understand exact behavior
2. Check if `resize` parameter (cover/contain/fill) affects output
3. Consider if original images are acceptable (bandwidth vs complexity trade-off)
4. May need to generate actual thumbnails server-side during upload instead of on-the-fly

**Files:**
- `src/lib/photo-url.ts` - Photo URL utility with disabled transformation code
- Supabase dashboard: Storage → cladari-photos bucket settings

**Priority:** LOW - Original images work fine, bandwidth optimization can wait

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

## Summary of Fixed Bugs
- #2 ✅ Stale Status Thresholds (Dec 24, 2025)
- #3 ✅ Photos for Crosses/Batches (Feb 16, 2026)
- #7 ✅ Batch Care Shows UID Not Name (verified Dec 24, 2025)
- #10 ✅ Clone Batch Individual Graduation (verified Dec 24, 2025)
- #13 ✅ SensorPush Test Data Pollution (Feb 16, 2026)
