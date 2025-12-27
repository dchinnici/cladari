# Cladari Plant Database - Engineering Manual
**Version:** 1.7.9
**Last Updated:** December 27, 2025
**Status:** PRODUCTION - Supabase Cloud + pgvector Semantic Search + AI Photo Analysis + Telegram Notifications
**Architecture:** PostgreSQL (Supabase) + Next.js 15 + Prisma ORM + Claude AI + pgvector + Telegram Bot

---

## 🌱 What Is This System?

The Cladari Plant Database is a comprehensive Anthurium breeding management system designed for serious collectors and breeders. It tracks:

- **Plant Collection**: 67+ plants, scalable to thousands
- **Breeding Records**: Parent/offspring relationships, cross tracking
- **Care Management**: Watering, fertilizing, health monitoring, EC/pH tracking
- **Morphological Traits**: Botanical-standard phenotype recording
- **Financial Tracking**: Acquisition costs, market values
- **Photos**: Growth progression documentation with cover photo selection
- **Vendor Management**: Source tracking and reputation
- **Environmental Monitoring**: EC/pH analysis, substrate health scoring

**Not just a spreadsheet:** This is a proper botanical database with:
- Relational data (plants link to vendors, locations, breeding records)
- Standardized taxonomy (dropdown fields prevent typos)
- Time-series tracking (measurements, care logs over time)
- Hot-reloading development environment
- API-first design (every feature has an endpoint)
- Photo management with EXIF extraction
- **AI Photo Analysis** - Claude Sonnet 4 vision for plant health assessment
- ML-ready infrastructure for future AI features

---

## 📊 Current System State (December 21, 2025)

### What's Working ✅
```
✅ PRODUCTION LIVE: www.cladari.ai on Vercel with Google OAuth
✅ SUPABASE CLOUD: PostgreSQL database, Auth, Photo Storage - PRODUCTION DEPLOYED
✅ PGVECTOR SEMANTIC SEARCH: Cross-collection AI memory with quality-weighted retrieval
✅ KNOWLEDGE SEARCH: Dashboard widget for exploring past AI consultations
✅ UNIFIED BREED UI: Combined Breeding + Batches under single "Breed" entry point
✅ FLOWERING EVENT PICKER: One-tap flowering events via Quick Actions
✅ CLONE BATCH GRADUATION: Multi-plant graduation with transaction safety
✅ Web UI (https://www.cladari.ai or localhost:3000): Plant browsing, detail pages, editing
✅ PostgreSQL Database: 70+ plants, relationships, vendor data
✅ Multi-user Auth: Supabase Auth with protected routes (Google OAuth + email/password)
✅ Cloud Photo Storage: ~700 photos on Supabase Storage
✅ API Endpoints: CRUD operations with auth + userId filtering
✅ Prisma ORM: Type-safe database access, migrations
✅ Hot Reload: Code changes appear immediately in browser
✅ Data Standardization: Section, Health Status, Propagation Type dropdowns
✅ Photo Management: Upload, display, cover photo selection
✅ EC/pH Tracking: Input/output monitoring with health scoring
✅ Pest Management: Discovery and treatment tracking
✅ Advanced Care Features: Batch care, quick care (Cmd+K), rain tracking
✅ Dashboard Analytics: Care queue, collection stats, critical alerts
✅ BREEDING PIPELINE: Full cross tracking from pollination to graduated plants
✅ AI PHOTO ANALYSIS: Claude Opus 4 vision + extended thinking for plant health
✅ QR CODE SYSTEM: Plant and location tags with quickcare flow (verified working)
✅ TIMEZONE HANDLING: America/New_York default, no more date bugs
✅ PLANT DETAIL REFACTOR: 9 tabs → 5 tabs (Overview, Journal, Photos, Flowering, Lineage)
✅ AI CHAT LOGGING: Save conversations with HITL confidence tracking
✅ HITL QUALITY SCORING: 0-4 quality scale, negative examples for RLHF
✅ SENSORPUSH INTEGRATION: Live environmental data with VPD, 10-min sync
✅ WEATHER INTEGRATION: Open-Meteo API, AI chat context
✅ JOURNAL EDIT/DELETE: Edit or remove any historical entry (traits, measurements)
✅ TELEGRAM DAILY DIGEST: Morning care notifications at 8am EST via Vercel cron
```

### Recent Improvements 🚀
```
Dec 27: TELEGRAM DAILY CARE NOTIFICATIONS (v1.7.9)
        - Telegram Bot Integration: CladariCareBot sends daily digest at 8am EST
        - Care Priority Alerting: Overdue plants with days-since-care counts
        - Due Today Warnings: Plants approaching watering threshold
        - Dynamic Thresholds: Uses same care-thresholds.ts logic as dashboard
        - Vercel Cron: Scheduled at 0 13 * * * (8am EST = 1pm UTC)
        - Manual test script: scripts/test-daily-digest.ts
        - Env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, NOTIFY_USER_ID

Dec 21: UNIFIED BREED UI + FLOWERING EVENTS (v1.7.5)
        - Unified "Breed" navigation: Breeding + Batches under single entry point
        - Tab-style navigation between Crosses and Batches pages
        - Mobile nav shows "Breed" with GitBranch icon
        - Flowering Event Picker: One-tap events via Quick Actions
        - Quick Actions reorganized: Care/Flower/Note/Photo
        - 5 flowering events: Bud Emerging, Spathe Opening, Female Receptive, Pollen Visible, Finished
        - Lineage Tab: Clone batch origin support ("Graduated From Batch")
        - Multi-plant graduation fix: Sequential ID generation, transaction wrapper
        - Fixed propagationType mapping: OFFSET→division, TC→tissue_culture
        - Clone batch photos: Photo upload UI on batch detail pages
        - Polymorphic photo support: Photos attach to breeding records and batches

Dec 20: PRODUCTION DEPLOYMENT + OAUTH (v1.7.4)
        - Vercel production: Live at https://www.cladari.ai
        - Google OAuth: Sign in with Google (account picker enabled)
        - Multi-tenant dashboard fix: Stats filtered by userId
        - Training data export: scripts/export-training-data.ts

Dec 16: MOBILE PWA FIXES + PHOTO UPLOAD TO SUPABASE (v1.7.2)
        - Photo uploads now go directly to Supabase Storage
        - PWA viewport locked (no zoom/scroll issues on mobile)
        - Bottom nav safe area padding for iPhone home indicator
        - Photo rotation fix via explicit EXIF orientation handling
        - Modal scroll containment (forms scrollable to submit button)
        - Modal accidental close protection during device rotation

Dec 15: PGVECTOR SEMANTIC SEARCH (v1.7.1)
        - Cross-collection AI memory via vector embeddings
        - BGE-base-en-v1.5 embeddings (768 dimensions)
        - Auto-chunking on ## headers with type classification
        - Quality-weighted retrieval (HITL scores influence search)
        - Knowledge Search component on dashboard
        - Fixed: Photo loading for AI (Supabase URLs)
        - Fixed: VPD sync from SensorPush
        - Fixed: AI response XML tag stripping

Dec 14: SUPABASE MIGRATION (v1.7.0)
        - Full migration to Supabase cloud
        - PostgreSQL database with pgvector extension
        - Supabase Auth with protected routes
        - ~600 photos migrated to Supabase Storage
        - Multi-user architecture (Profile model, userId filtering)
        - All API routes updated with auth checks

Dec 15: JOURNAL EDIT/DELETE + DOCUMENTATION (v1.6.3+)
        - Edit/delete for morphology traits in Journal timeline
        - Edit/delete for measurements in Journal timeline
        - New API: /api/plants/[id]/measurements/[measurementId] (PATCH/DELETE)
        - Expandable trait entries showing individual observations
        - CLAUDE.md updated with Stream Protocol thesis context

Dec 12: HITL QUALITY SCORING (v1.6.3)
        - 0-4 quality scale for AI consultation feedback
        - SaveChatModal: Score, edit, and save AI responses
        - NegativeExample model for bad responses (RLHF training data)
        - Failure types: hallucination, missed_context, factual_error, etc.
        - Journal shows quality badges (color-coded 0-4)
        - Cross-plant context isolation (AI chat resets between plants)

Dec 11: PLANT DETAIL UX REDESIGN (v1.6.2)
        - Orphan photo recovery tool
        - UI polish and navigation improvements

Dec 11: SENSORPUSH + WEATHER INTEGRATIONS (v1.6.1)
        - SensorPush OAuth API client (/lib/sensorpush.ts)
        - Live environmental monitoring with "Live" badge
        - 10-minute cron sync for all sensors
        - Weather integration via Open-Meteo API
        - AI chat receives weather + barometric pressure context
        - Fort Lauderdale coordinates hardcoded

Dec 10: PLANT DETAIL REFACTOR + AI CHAT LOGGING (v1.6.0)
        - Consolidated 9 tabs → 5 tabs: Overview, Journal, Photos, Flowering, Lineage
        - Overview now includes: Health Metrics, AI Assistant, Quick Actions, Plant Details
        - NEW Journal tab: Unified timeline (care, notes, morphology, measurements, AI)
        - AI Chat Logging with HITL: Save conversations with confidence tracking
        - ChatLog model: unverified/verified/partially_verified/disputed flags
        - New API: /api/chat-logs (CRUD operations)
        - New components: HealthMetrics, QuickActions, JournalTab, JournalEntryModal, LineageTab

Dec 10: QR CODE INFRASTRUCTURE (v1.5.1) - Plant and location tag system
        - Plant QR: /q/p/{plantId} → plant detail with quickcare modal
        - Location QR: /q/l/{location} → batch care with auto-selection
        - Print APIs: /api/print/plant-tag, /api/print/location-tag
        - Formats: HTML preview, ZPL for Zebra ZD421CN, PNG download
        - Tailscale IP encoding for mobile scanning
        - VERIFIED WORKING on phone over Tailscale network

Dec 10: TIMEZONE STANDARDIZATION (v1.5.1) - Fixed date off-by-one bugs
        - New utility: /lib/timezone.ts with America/New_York default
        - getTodayString() for consistent local dates
        - Fixed: Care at 10pm EST no longer shows as tomorrow
        - All 14 date initializations updated across codebase

Dec 10: AI MODEL UPGRADE (v1.5.1) - Claude Opus 4 with extended thinking
        - 16K token thinking budget for deeper analysis
        - Epistemic Rigor: observations vs hypotheses, confidence levels
        - EC/pH Delta Analysis: input composition context, trend analysis
        - maxDuration: 120s for complex diagnostic turns

Dec 10: AI PHOTO ANALYSIS (v1.5.0) - Claude Sonnet 4 vision integration
        - AIAssistant component on plant detail pages
        - Two modes: Recent (3 photos) and Comprehensive (20 photos)
        - Dynamic mode switching mid-conversation for token optimization
        - Cross-references photos with care logs, EC/pH data
        - Markdown rendering with smart scroll behavior
        - New API: /api/chat with streaming responses
        - Token cost: ~1.5K per photo, mitigated by mode switching

Dec 8: CLONE BATCH CARE (v1.4.0) - Batch care before graduation
        - CareLog support for CloneBatch model
        - Batch detail page with care history
        - EC/pH tracking per batch
        - Seed batch edit/delete functionality

Dec 4: COMPLETE BREEDING PIPELINE (v1.3.0) - Full provenance tracking
        - BreedingRecord: CLX-YYYY-### cross notation
        - Harvest: Multiple berry harvests per cross
        - SeedBatch: SDB-YYYY-### germination tracking
        - Seedling: SDL-YYYY-#### individual tracking
        - Graduation workflow: Seedlings → Plant (ANT-YYYY-####)
        - Cross categories: INTRASPECIFIC, INTERSPECIFIC, INTERSECTIONAL
        - Lineage tracking: femaleParentId, maleParentId, breedingRecordId
        - Asexual lineage: cloneSource/clones for offsets, TC, divisions
        - Selection workflow: GROWING → KEEPER/HOLDBACK/CULL/GRADUATED
        - Generation tracking: F1, F2, S1, BC1, etc.
        - New API endpoints: /api/breeding, /api/seed-batches, /api/seedlings
        - ID generation: src/lib/breeding-ids.ts

Nov 17: MCP SERVER INTEGRATION - Natural language AI interface
        - Implemented Model Context Protocol (MCP) server
        - 4 tools: search_plants, predict_care, diagnose_symptoms, get_plant_details
        - Enables natural language queries through Sovria AI
        - Full API integration with PlantDB backend
        - TypeScript implementation with Zod validation
        - Complete documentation and test suite

Nov 12: COVER PHOTO SELECTION - Optional photo selection for plant cards
        - Added coverPhotoId field to Plant model
        - UI to set/change cover photo with star icon
        - API logic to prioritize cover photo over most recent
        - Visual indicator for current cover photo
        - Supports both PUT and PATCH methods

Nov 12: BUG FIXES & UI IMPROVEMENTS
        - Fixed pest critical status (only active issues, not treated)
        - Fixed EC/pH averaging (3 logs instead of 10 for current values)
        - Fixed pH drift false warnings (ignore improvements)
        - Fixed dropdown z-index issues (appeared behind cards)
        - Fixed batch care timezone handling (EST vs UTC)
        - Removed redundant EC/pH tab
        - Fixed repotting "From" field editing
        - Removed activity type emojis per user preference

Nov 11: PHOTO MANAGEMENT SYSTEM - P2/P3 Features
        - Plant photos display on cards (3:2 aspect ratio)
        - Extended photo categories (8 types including Stem, Catophyl, Base)
        - Photo upload with EXIF extraction
        - Thumbnail generation for performance
        - PlantID badge overlay on photos
        - Edit/delete photo functionality

Nov 10: EC/pH ANALYSIS SYSTEM - Advanced substrate monitoring
        - EC variance detection and alerts
        - pH drift rate calculations
        - Substrate health scoring (0-100)
        - Critical alerts for EC buildup
        - Recommendations based on trends
        - Paired reading analysis (input vs output)

Nov 9: BATCH CARE & QUICK CARE - Workflow optimization
        - Batch care for multiple plants
        - Quick care modal (Cmd+K shortcut)
        - Rain tracking with amount/duration
        - Location-based batch operations
        - Care queue dashboard widget
        - Automatic baseline feed population

Nov 8: ML/AI FOUNDATION - Future-ready infrastructure
        - ML diagnosis routes prepared
        - Vector embedding support in schema
        - Journal system for NLP training data
        - Photo metadata extraction for vision models

Oct 18: AUTOMATED BACKUP SYSTEM - 3-2-1 backup strategy implemented
        - Automated daily backups to Synology NAS via rsync
        - Database snapshots (last 30 days retained)
        - launchd automation (runs daily at 10 PM)
        - SSH key authentication for passwordless backups
        - Time Machine + NAS = comprehensive data protection
        - Documentation: BACKUP_SETUP.md

Oct 18: LOCATION MANAGEMENT SYSTEM - Comprehensive environmental tracking
        - Added advanced environmental metrics (DLI, VPD, CO₂, pressure)
        - Lighting setup tracking (grow lights, photoperiod, airflow)
        - Locations navigation button in top nav
        - Full CRUD location management UI
        - Plant location dropdown with instant updates
        - Occupancy tracking and capacity planning
        - Documentation: LOCATION_MANAGEMENT.md
```

### Collection Statistics 📈
```
Total Plants: 70+
Collection Value: $15,000+
Vendors: Multiple tracked with reputation
Locations: Environmental monitoring active
Breeding Records: Full pipeline tracking (Cross → Harvest → Seedling → Plant)
Photos: 500+ with EXIF data
Care Logs: EC/pH tracking active
Active Crosses: 1+ with harvests and seed batches
```

---

## 🏗️ Database Architecture (December 2025 - Supabase)

### What is Supabase?
**A full backend-as-a-service built on PostgreSQL:**
- **PostgreSQL**: Enterprise-grade relational database
- **Auth**: Built-in user authentication (email/password, OAuth)
- **Storage**: S3-compatible file storage for photos
- **Realtime**: WebSocket subscriptions (future use)
- **pgvector**: Native vector similarity search for AI memory

**Connection:** Via Prisma to Supabase PostgreSQL (pooled + direct URLs)

### What is Prisma?
**Your translator between JavaScript and SQL:**
- Defines your database structure in `schema.prisma`
- Generates TypeScript types automatically
- Prevents SQL injection and common errors
- Makes database changes through migrations
- Supports pgvector via `Unsupported("vector(768)")` type

**Think of it as:** A type-safe layer that prevents you from breaking your database

### What is pgvector?
**PostgreSQL extension for AI/ML vector operations:**
- Stores embeddings (768-dimensional float arrays)
- Cosine similarity search via `<=>` operator
- Enables semantic search across AI consultations
- Quality-weighted retrieval using HITL scores

### Database Tables (Current)

**Core Tables:**
```
Plant            - Main plant records with coverPhotoId
├── Genetics     - Genetic data (ploidy, RA numbers, provenance)
├── Trait        - Morphological traits (leaf, spathe, growth patterns)
├── Photo        - Plant photos with metadata (8 types)
├── Measurement  - Growth measurements over time
├── CareLog      - Care activities with EC/pH data
├── PlantJournal - Unified activity log for ML training
├── FloweringCycle - Reproductive phenology tracking
├── femaleParentId → Parent plant (female)
├── maleParentId → Parent plant (male)
├── cloneSource → Parent plant (asexual propagation)
└── seedlingOrigin → Seedling record (if graduated)

BREEDING PIPELINE (NEW v1.3.0):
BreedingRecord   - CLX-YYYY-### cross tracking (female × male)
├── Harvest      - Berry collection (harvestNumber, berryCount, seedCount)
│   └── SeedBatch - SDB-YYYY-### germination tracking
│       └── Seedling - SDL-YYYY-#### individual seedling records
│           └── graduatedToPlant → Plant (when promoted)

Vendor           - Source vendors and reputation
Location         - Growing locations with environmental data
Treatment        - Fertilizers, pesticides, fungicides
Species          - Reference data for accepted names
```

### How Data Connects

**Example: A plant's complete record**
```
Plant "ANT-2025-0042" (NSE Dressleri)
├── vendor → "NSE Tropicals" (Vendor table)
├── currentLocation → "Greenhouse A1" (Location table)
├── coverPhotoId → "clx123..." (Selected display photo)
├── genetics → {ploidy: "2n", raNumber: "RA8"} (Genetics table)
├── traits → [
│     {category: "leaf", traitName: "texture", value: "velvety"},
│     {category: "leaf", traitName: "color", value: "dark green"}
│   ] (Trait table)
├── measurements → [
│     {date: "2025-01-15", leafLength: 25.5, leafWidth: 18.2}
│   ] (Measurement table)
├── careLogs → [
│     {date: "2025-11-12", action: "water", details: {inputEC: 0.72, outputEC: 1.1}}
│   ] (CareLog table)
├── photos → [
│     {id: "clx123...", photoType: "whole_plant", isCover: true},
│     {id: "clx124...", photoType: "leaf", dateTaken: "2025-11-10"}
│   ] (Photo table)
└── journal → [
      {entry: "Watering with baseline feed", timestamp: "2025-11-12"}
    ] (PlantJournal table)
```

---

## 🚀 How to Use This System

### Starting the Development Server

**Method 1: Using the script (Recommended)**
```bash
cd /Users/davidchinnici/cladari/plantDB
./scripts/dev --bg
```

**Method 2: Manual start**
```bash
cd /Users/davidchinnici/cladari/plantDB
DATABASE_URL="file:./prisma/dev.db" npm run dev -- --hostname 0.0.0.0
```

**Check it's running:**
- Open browser: http://localhost:3000
- View logs: `cat .next-dev.log`

### Stopping the Server

**Method 1: Using the script**
```bash
./scripts/stop
```

**Method 2: Manual kill**
```bash
pkill -f "next-server"
```

### Accessing the Database

**Option 1: Prisma Studio (Visual Interface)**
```bash
npx prisma studio
# Opens at http://localhost:5555
# Browse/edit data in a spreadsheet-like interface
```

**Option 2: SQLite Command Line**
```bash
sqlite3 /Users/davidchinnici/cladari/plantDB/prisma/dev.db

# Useful commands:
.tables              # List all tables
.schema Plant        # Show Plant table structure
SELECT COUNT(*) FROM Plant;  # Count plants
SELECT * FROM Plant WHERE coverPhotoId IS NOT NULL;  # Plants with cover photos
.quit                # Exit
```

**Option 3: API Endpoints (Programmatic)**
```bash
# Get all plants
curl http://localhost:3000/api/plants

# Get specific plant
curl http://localhost:3000/api/plants/cmgsezkin000xgw74jhgpsbkx

# Dashboard stats
curl http://localhost:3000/api/dashboard/stats

# Upload photo
curl -X POST http://localhost:3000/api/photos \
  -F "file=@photo.jpg" \
  -F "plantId=clx123..." \
  -F "photoType=whole_plant"
```

---

## 📁 File Structure (Where Everything Lives)

### Project Root
```
/Users/davidchinnici/cladari/plantDB/
├── .env                          # Database connection (IMPORTANT!)
├── .next-dev.log                 # Server logs
├── package.json                  # Dependencies
├── next.config.js                # Next.js configuration
├── README.md                     # Project overview
└── OPERATOR_MANUAL.md            # User guide
```

### Database Files
```
prisma/
├── schema.prisma                 # Database structure (THE SOURCE OF TRUTH) - PostgreSQL
├── schema.postgres.prisma        # Reference schema (synced with main)
├── schema.sqlite.backup          # Legacy SQLite schema (archived)
└── migrations/                   # Database change history
```

### Source Code
```
src/
├── app/
│   ├── page.tsx                  # Homepage/Dashboard
│   ├── plants/
│   │   ├── page.tsx              # Plant list page with photos
│   │   ├── [id]/page.tsx         # Plant detail page (MAIN UI)
│   │   └── CompactControls.tsx   # Search, filter, sort controls
│   ├── batch-care/
│   │   └── page.tsx              # Batch care operations
│   ├── locations/
│   │   └── page.tsx              # Location management
│   ├── q/
│   │   └── [...slug]/page.tsx    # QR redirect handler (/q/p/{id}, /q/l/{loc})
│   └── api/
│       ├── plants/
│       │   ├── route.ts          # GET /api/plants, POST /api/plants
│       │   ├── lookup/route.ts   # Plant lookup by ID (for QR)
│       │   └── [id]/
│       │       ├── route.ts      # GET/PUT/PATCH/DELETE
│       │       └── care-logs/    # Care log endpoints
│       ├── print/
│       │   ├── plant-tag/[id]/   # Plant tag print (html/zpl/png)
│       │   └── location-tag/[name]/ # Location tag print
│       ├── photos/
│       │   └── route.ts          # Photo upload/management
│       ├── chat/
│       │   └── route.ts          # AI chat endpoint (Claude Opus 4)
│       ├── batch-care/
│       │   └── route.ts          # Batch operations
│       └── dashboard/
│           └── stats/route.ts    # Analytics endpoints
├── components/
│   ├── modal.tsx                 # Reusable modal component
│   ├── toast.tsx                 # Toast notifications
│   ├── QuickCare.tsx             # Quick care modal (Cmd+K)
│   ├── AIAssistant.tsx           # AI photo analysis chat component
│   └── care/
│       ├── CareQueue.tsx         # Dashboard care queue
│       ├── UpcomingCare.tsx      # ML-powered recommendations
│       └── ECPHDashboard.tsx     # EC/pH analytics
└── lib/
    ├── prisma.ts                 # Prisma client singleton
    ├── timezone.ts               # Timezone utilities (America/New_York)
    ├── qr.ts                     # QR code generation (Tailscale URL)
    ├── zpl.ts                    # Zebra ZPL templates (2"x1" labels)
    ├── breeding-ids.ts           # ID generation (ANT-, CLX-, SDB-, SDL-)
    ├── sensorpush.ts             # SensorPush OAuth API client
    ├── weather.ts                # Open-Meteo weather API
    ├── supabase/
    │   ├── server.ts             # Server-side Supabase client (SSR)
    │   └── client.ts             # Browser-side Supabase client
    ├── care/
    │   ├── ecPhUtils.ts          # EC/pH calculations
    │   ├── recommendations.ts    # ML care predictions
    │   └── types.ts              # TypeScript definitions
    └── ml/
        ├── embeddings.ts         # Vector embedding generation (BGE-base-en-v1.5)
        ├── chunker.ts            # ChatLog chunking for semantic search
        ├── diagnosis.ts          # AI diagnostic functions
        └── index.ts              # ML module exports
```

### Documentation
```
docs/
├── CLADARI_ENGINEER_MANUAL.md   # This file
├── VISION_AND_PIPELINE.md        # Future roadmap
├── BACKUP_SETUP.md               # Backup configuration
├── LOCATION_MANAGEMENT.md        # Location features
├── REPRODUCTIVE_PHENOLOGY.md     # Flowering tracking
├── TEMPORAL_MORPHOLOGY.md        # Trait changes over time
├── ML_INTEGRATION_ROADMAP.md     # AI/ML plans
└── UNIFIED_JOURNAL_DESIGN.md     # Journal system architecture
```

### Scripts
```
scripts/
├── dev                           # Start development server
├── stop                          # Stop server
├── backup-to-nas.sh              # Manual backup trigger
├── automated-backup.sh           # Automated backup script
└── import-excel-data.js          # Import from Excel
```

### Public Assets
```
public/
└── uploads/
    ├── photos/                   # Full-size plant photos
    └── thumbnails/               # Generated thumbnails
```

---

## 🔧 Common Operations

### Making Database Changes

**1. Edit the Schema**
```bash
# Open schema file
code prisma/schema.prisma

# Example: Add a new field to Plant model
model Plant {
  # ... existing fields ...
  floweringDate DateTime? # Add this
}
```

**2. Create Migration**
```bash
npx prisma migrate dev --name add_flowering_date
# This creates SQL, updates database, regenerates Prisma client
```

**3. Regenerate Prisma Client (if schema changes without migration)**
```bash
npx prisma generate
# Restart server after this
```

### Working with Photos

**Upload Photos via UI:**
1. Navigate to plant detail page
2. Click "Photos" tab
3. Click "Upload Photos" button
4. Select multiple photos (JPEG, PNG, DNG supported)
5. Choose photo type (whole plant, leaf, spathe, etc.)
6. Photos automatically extract EXIF data

**Set Cover Photo:**
1. In Photos tab, hover over any photo
2. Click the star icon to set as cover
3. Cover photo appears on plant cards

**Photo Storage:**
- Original: `/public/uploads/photos/`
- Thumbnails: `/public/uploads/thumbnails/`
- Naming: `{plantId}_{timestamp}.{ext}`

### EC/pH Monitoring

**Recording EC/pH:**
```javascript
// In care log, add EC/pH values
{
  activityType: "watering",
  inputEC: 1.1,    // Fertilizer solution EC
  inputPH: 5.9,    // Fertilizer solution pH
  outputEC: 1.5,   // Runoff EC
  outputPH: 6.2    // Runoff pH
}
```

**Understanding Alerts:**
- **EC Variance > 0.3**: Salt buildup, needs flush
- **pH < 5.0 or > 7.0**: Critical pH issue
- **pH Drift > 0.2/week**: Substrate degrading
- **Substrate Score < 50**: Consider repotting

### Backing Up Your Data

**Automated Backups (ACTIVE) ✅**
```bash
# Backups run automatically every night at 10 PM to Synology NAS
# - Full project sync to NAS (500+ files)
# - Database snapshots (last 30 days retained)
# - Time Machine hourly backups (local)
# - Photo uploads included in backup

# Manual backup anytime:
cd /Users/davidchinnici/cladari/plantDB
./scripts/backup-to-nas.sh

# Check backup status:
launchctl list | grep cladari
tail -20 logs/backup.log

# View database snapshots on NAS:
ssh dchinnici@100.82.66.63 "ls -lh Backups/cladari/db-snapshots/"
```

**Manual Local Backup (Quick)**
```bash
# Copy entire database locally
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d)

# Backup photos
tar -czf photos-backup-$(date +%Y%m%d).tar.gz public/uploads/
```

**Export to SQL**
```bash
sqlite3 prisma/dev.db .dump > backup-$(date +%Y%m%d).sql
```

**Export to CSV**
```bash
sqlite3 -header -csv prisma/dev.db "SELECT * FROM Plant;" > plants.csv
```

**See full backup documentation:** `docs/BACKUP_SETUP.md`

### Inspecting Data

**Count records in each table:**
```bash
sqlite3 prisma/dev.db << 'EOF'
SELECT 'Plants:', COUNT(*) FROM Plant;
SELECT 'Photos:', COUNT(*) FROM Photo;
SELECT 'Care Logs:', COUNT(*) FROM CareLog;
SELECT 'Vendors:', COUNT(*) FROM Vendor;
SELECT 'Locations:', COUNT(*) FROM Location;
SELECT 'Journal Entries:', COUNT(*) FROM PlantJournal;
EOF
```

**Find plants by section:**
```bash
sqlite3 prisma/dev.db "SELECT plantId, hybridName, section FROM Plant WHERE section='Cardiolonchium';"
```

**Check EC/pH trends:**
```bash
sqlite3 prisma/dev.db "SELECT date, action, details FROM CareLog WHERE plantId='your-plant-id' AND details LIKE '%EC%' ORDER BY date DESC LIMIT 10;"
```

---

## 🎚️ Feature Flags (Current & Planned)

### Currently Active ✅
```javascript
// These features are LIVE in production
{
  // Core Features
  standardized_dropdowns: true,    // Section, Health Status, etc.
  alphabetical_sorting: true,      // Plants sorted by name
  full_breeding_pipeline: true,    // Cross → Harvest → SeedBatch → Seedling → Plant
  flowering_cycles: true,          // Reproductive phenology tracking
  temporal_morphology: true,       // Track phenotype changes over time
  lineage_tracking: true,          // Sexual and asexual parent relationships
  generation_tracking: true,       // F1, F2, S1, BC1, etc.

  // Care Management
  care_logging: true,              // Water, fertilize, repot tracking
  batch_care: true,                // Multiple plant operations
  quick_care: true,                // Cmd+K quick entry
  ec_ph_tracking: true,            // Input/output monitoring
  substrate_health: true,          // Health scoring algorithm
  pest_management: true,           // Discovery and treatment
  rain_tracking: true,             // Natural watering events

  // Data & Assets
  photo_management: true,          // Upload, display, EXIF
  cover_photo_selection: true,     // Choose display photo
  financial_tracking: true,        // Costs and market values
  vendor_management: true,         // Source tracking
  location_management: true,       // Advanced environmental tracking

  // Infrastructure
  automated_backups: true,         // Daily NAS backups
  journal_system: true,            // Unified activity log
  ml_foundation: true              // ML-ready data structures
}
```

### Planned Features 📋
```javascript
// Phase 2 (Next 2-8 weeks)
{
  zebra_printer_integration: false, // Connect Zebra ZD421CN for physical tags
  batch_print: false,              // Print all tags for a location at once
  mobile_pwa: false,               // Mobile-optimized plant pages
  sensor_integration: false,       // SensorPush, smart home data
  export_darwin_core: false,       // Botanical standard export
  advanced_search: false,          // Multi-field filtering
  care_scheduling: false           // Calendar integration
}

// Phase 3 (Months 3-6)
{
  vector_search: false,            // Semantic plant search
  postgresql_migration: false,     // Move to Postgres when >1000 plants
  mcp_server: false,               // LLM tool integration
  photo_embeddings: false,         // AI-powered photo analysis
  dna_database: false,             // MinION sequence storage
  pest_detection: false,           // AI pest/disease detection
  growth_prediction: false         // ML growth forecasting
}

// Phase 4 (Months 6-12)
{
  distributed_processing: false,   // F2 (RTX 4090) for heavy ML
  custom_ml_models: false,         // Trait prediction from photos
  breeding_ai: false,              // AI-suggested crosses
  multi_user: false,               // Collaboration features
  marketplace: false               // Plant trading platform
}
```

---

## 🔄 Migration Strategy (When to Scale Up)

### Stay with SQLite When:
- ✅ Plant count < 1,000
- ✅ Single user (you)
- ✅ Photos stored on filesystem (not in DB)
- ✅ Query speed feels instant (<100ms)
- ✅ Database file < 500MB

### Migrate to PostgreSQL When:
- 📈 Plant count > 1,000
- 📈 Need full-text search across all fields
- 📈 Want semantic search (vectors)
- 📈 Adding DNA sequences (BLAST search)
- 📈 Processing 100K+ photos with embeddings
- 📈 Database file approaching 1GB
- 📈 Multiple concurrent users

### Migration Path (Future)
```bash
# 1. Export SQLite to SQL
sqlite3 prisma/dev.db .dump > migration.sql

# 2. Convert to PostgreSQL format
# (Prisma can handle this automatically)

# 3. Update schema.prisma
datasource db {
  provider = "postgresql"  # Changed from sqlite
  url      = env("DATABASE_URL")
}

# 4. Create new Prisma migration
npx prisma migrate dev --name migrate_to_postgresql

# 5. Import data and verify
```

**Estimated Timeline:** Not needed until 500+ plants or DNA/vector features

---

## 📱 QR Code System Architecture

PlantDB includes a QR code system for frictionless mobile data entry. Scan a tag → opens the right page with the right actions pre-selected.

### URL Schema

```
/q/p/{plantId}     → /plants/{dbId}?quickcare=true
/q/l/{locationSlug} → /batch-care?location={location}&quickcare=true
```

### QR Flow Diagram

```
Phone Camera → QR Code (Tailscale URL)
      ↓
/q/[...slug]/page.tsx (Redirect Handler)
      ↓
┌─────────────────┬──────────────────────────────────┐
│ /q/p/{plantId}  │ /q/l/{location}                  │
├─────────────────┼──────────────────────────────────┤
│ Lookup plant by │ Redirect to /batch-care          │
│ plantId (ANT-)  │ with ?location= param            │
│ or DB id        │                                  │
├─────────────────┼──────────────────────────────────┤
│ Redirect to     │ useEffect detects param:         │
│ /plants/{id}    │ - Finds location by name         │
│ ?quickcare=true │ - Sets selectedLocationFilter    │
│                 │ - Auto-selects all plants there  │
│                 │ - Clears URL param               │
├─────────────────┼──────────────────────────────────┤
│ useEffect in    │ User logs care for entire        │
│ plant page      │ location in one action           │
│ opens modal     │                                  │
└─────────────────┴──────────────────────────────────┘
```

### Key Files

**QR Generation** (`src/lib/qr.ts`)
- `QR_BASE_URL`: Defaults to `http://100.88.172.122:3000` (Tailscale)
- Can override with `NEXT_PUBLIC_QR_BASE_URL` env var
- `getQRUrl(type, id)` - Build URL for QR content
- `generateQRDataUrl()` - Base64 data URL for display
- `generateQRSvg()` - SVG string for printing/scaling
- `generateQRMatrix()` - Raw boolean matrix for ZPL rendering

**ZPL Templates** (`src/lib/zpl.ts`)
- `generatePlantTagZPL()` - 2"x1" label with QR + text
- `generateLocationTagZPL()` - Location tags with plant count
- `generateQRGraphicField()` - Converts QR matrix to ZPL ^GFA
- Optimized for Zebra ZD421CN (300 DPI thermal transfer)

**Redirect Handler** (`src/app/q/[...slug]/page.tsx`)
- Parses `/q/p/{id}` and `/q/l/{location}` patterns
- Plant lookup via `/api/plants/lookup`
- Shows loading spinner during redirect

**Print APIs**
- `/api/print/plant-tag/[id]/route.ts`
- `/api/print/location-tag/[name]/route.ts`
- Query params: `?format=html|zpl|png`

### ZPL Label Layout (2" x 1" at 300 DPI)

```
+---------------------------+
| [QR]  ANT-2025-0036       |  (plantId - 40pt)
| [QR]  Hybrid Name Here    |  (line1 - 32pt)
| [QR]  Section             |  (line2 - 24pt)
|       cladari.app         |  (brand - 18pt)
+---------------------------+
600 dots wide × 300 dots tall
QR code: 150x150 dots (0.5" square)
```

### Tailscale Configuration

- Machine `f1` at `100.88.172.122` runs dev server
- QR codes encode this IP for phone → laptop access
- NAS `cheechnas` at `100.82.66.63` for backups
- Production: Set `NEXT_PUBLIC_QR_BASE_URL=https://cladari.app`

### Testing QR System

```bash
# Plant tag preview (browser)
http://localhost:3000/api/print/plant-tag/ANT-2025-0036?format=html

# Location tag preview
http://localhost:3000/api/print/location-tag/BALCONY?format=html

# Test redirect (simulates QR scan)
http://localhost:3000/q/p/ANT-2025-0036

# Download ZPL for printer
curl "http://localhost:3000/api/print/plant-tag/ANT-2025-0036?format=zpl" > label.zpl
```

---

## 🕐 Timezone Handling

All date operations use centralized timezone utilities to prevent off-by-one bugs (care logged at 10pm EST showing as tomorrow).

### Key File: `/lib/timezone.ts`

```typescript
// Default timezone (configurable in future)
export const APP_TIMEZONE = 'America/New_York';

// Use instead of: new Date().toISOString().split('T')[0]
export function getTodayString(timezone?: string): string

// Format existing date for form inputs
export function formatDateForInput(date: Date | string): string

// Parse form date at noon to avoid boundary issues
export function parseDateAtNoon(dateString: string): Date

// Relative time: "today", "yesterday", "3 days ago"
export function getRelativeTime(date: Date | string): string

// Check if date is today
export function isToday(date: Date | string): boolean
```

### Why Noon?

API routes create dates at noon (`T12:00:00`) rather than midnight to avoid timezone boundary issues:
```typescript
// In /api/plants/[id]/care-logs/route.ts
date: body.date ? new Date(body.date + 'T12:00:00') : new Date()
```

### Future: User-Configurable Timezone

The utility accepts an optional timezone parameter. Future settings page can allow:
- Auto-detect from browser: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Manual override in user preferences
- Store in user profile or localStorage

---

## 🤖 AI Photo Analysis Architecture

PlantDB includes Claude Opus 4 vision integration with extended thinking for intelligent plant health analysis. The AI can analyze photos alongside care data to provide diagnostic insights with explicit reasoning.

### Architecture Overview

```
Plant Detail Page → AIAssistant Component
         ↓ useChat hook (AI SDK)
    /api/chat (Next.js Route)
         ↓ loadImageAsBase64()
    Claude Opus 4 (claude-opus-4-20250514)
         ↓ Extended Thinking (16K budget)
         ↓ Streaming Response
    ReactMarkdown Rendering
```

### Key Components

**AIAssistant.tsx** (`src/components/AIAssistant.tsx`)
- Embedded chat interface on plant detail pages
- Two photo modes: Recent (3 photos) and Comprehensive (20 photos)
- Dynamic mode switching mid-conversation via checkbox
- Smart scroll behavior during streaming
- Markdown rendering with custom components
- Photo count indicator showing "X of Y photos"

**Chat API** (`src/app/api/chat/route.ts`)
- Integrates with Anthropic Claude API (Opus 4)
- Extended thinking enabled (16K token budget)
- maxDuration: 120s for complex diagnostic turns
- Loads photos as base64 from filesystem
- Injects plant context (care logs, EC/pH, location, health)
- Streaming responses via AI SDK's `streamText()`

**System Prompt Enhancements (v1.5.1)**
- **Epistemic Rigor**: Distinguishes observations vs hypotheses, confidence levels (HIGH/MEDIUM/LOW)
- **EC/pH Delta Analysis**: Input composition context (Si raises pH), trend vs isolated reading analysis
- **No Confabulation**: Explicit instruction to verify data before assuming, ask before prescribing

### Photo Processing Flow

```javascript
// 1. Photos sorted by dateTaken (newest first)
const sortedPhotos = photos.sort((a, b) =>
  new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()
);

// 2. Slice based on mode
const photosToProcess = photoMode === 'comprehensive'
  ? sortedPhotos.slice(0, 20)  // Up to 20 photos
  : sortedPhotos.slice(0, 3);  // 3 most recent

// 3. Load as base64 and attach to message
const imageAttachments = await Promise.all(
  photosToProcess.map(loadImageAsBase64)
);
```

### Token Cost Management

**Understanding costs:**
- ~1.5K tokens per photo
- Comprehensive mode (20 photos) = ~30K tokens per message
- Recent mode (3 photos) = ~4.5K tokens per message

**Mitigation strategy (discovered by user testing):**
1. Start conversation with Comprehensive for initial deep analysis
2. Uncheck "Deep analysis" checkbox mid-conversation
3. Follow-ups use Recent mode (3 photos) at lower cost
4. Claude retains memory of photos from earlier turns

**Why images re-send on every message:**
- Claude API is STATELESS - no server-side conversation memory
- Images must be attached to every request
- This is unavoidable; mode switching is the only mitigation

### Configuration

Requires `ANTHROPIC_API_KEY` in environment:
```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### Usage in Plant Detail Page

The AIAssistant component receives `plantData` from the parent:
```typescript
<AIAssistant plantData={plant} />
```

Plant data includes:
- `photos[]` - All photos with URLs and dateTaken
- `careLogs[]` - Care history with EC/pH values
- `currentLocation` - Growing location details
- `healthStatus`, `section`, `hybridName`, etc.

### Example AI Analysis Output

The AI can:
- Trace morphological progression chronologically across photos
- Cross-reference visual symptoms with EC/pH data from care logs
- Distinguish similar issues (thrips damage vs Fe/Mn lockout)
- Question labeled hybrid identification based on morphology
- Provide substrate health recommendations based on trends

---

## 🐛 Troubleshooting

### Server Won't Start

**Symptom:** `Error: Port 3000 already in use`
**Solution:**
```bash
# Kill existing server
pkill -f "next-server"

# Or find and kill by port
lsof -ti:3000 | xargs kill -9

# Restart
./scripts/dev --bg
```

**Symptom:** `Error: DATABASE_URL not found`
**Solution:**
```bash
# Check .env file exists
cat .env
# Should show: DATABASE_URL="file:./prisma/dev.db"

# If missing, create it
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
```

### Database Issues

**Symptom:** "Column does not exist" errors
**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# If that doesn't work, check schema matches database
npx prisma db pull  # This pulls actual DB structure into schema

# Or push schema to database
npx prisma db push

# Restart server
./scripts/stop && ./scripts/dev --bg
```

**Symptom:** Plants not showing up in UI
**Solution:**
```bash
# Check database has data
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Plant;"

# Check API works
curl http://localhost:3000/api/plants | jq length

# Check browser console for errors (F12 → Console tab)
```

### Photo Upload Issues

**Symptom:** Photos not uploading
**Check:**
- File size < 10MB
- Format: JPEG, PNG, or DNG
- Permissions on `/public/uploads/` directory

**Fix permissions:**
```bash
chmod 755 public/uploads/photos
chmod 755 public/uploads/thumbnails
```

### EC/pH Alert Issues

**Symptom:** False pH drift warnings
**Cause:** Including old data in averages
**Fix:** System now uses only last 3 logs for current values

**Symptom:** EC variance not showing
**Cause:** Unpaired readings (missing input or output)
**Fix:** System now only calculates variance from paired readings

### Plant Detail Page Errors

**Symptom:** Plant detail page shows "Unknown Species"
**Cause:** Missing hybridName and species fields
**Solution:** Edit the plant and add a name

**Symptom:** 500 error on plant detail page
**Check logs:**
```bash
tail -50 .next-dev.log
# Look for schema mismatch errors
```

**Common fix:**
```bash
# Regenerate Prisma client after schema changes
npx prisma generate
./scripts/stop && ./scripts/dev --bg
```

---

## 📚 API Documentation

### Plant Endpoints

**GET /api/plants**
- Returns: Array of all plants, sorted by name
- Includes: vendor, currentLocation, photos (cover or most recent)
- Filters: Archived plants excluded

**GET /api/plants/{id}**
- Returns: Single plant with all relations
- Includes: All photos, care logs, measurements, traits

**POST /api/plants**
- Creates new plant
- Auto-generates plantId if not provided
- Required: At minimum, genus (defaults to "Anthurium")

**PUT/PATCH /api/plants/{id}**
- Updates plant fields
- Supports partial updates
- Special: `coverPhotoId` to set display photo

**DELETE /api/plants/{id}**
- Soft delete (sets isArchived=true)
- Preserves data for ML training

### Care Log Endpoints

**POST /api/plants/{id}/care-logs**
- Records care activity
- Supports EC/pH data in details
- Auto-creates journal entry
- Handles pest discovery/treatment

**GET /api/plants/{id}/care-logs**
- Returns care history
- Ordered by date descending
- Includes parsed EC/pH data

### Photo Endpoints

**POST /api/photos**
- Uploads photo(s)
- Extracts EXIF metadata
- Generates thumbnails
- Returns photo records with URLs

**DELETE /api/photos/{id}**
- Removes photo and thumbnail
- Updates plant if was cover photo

### Batch Operations

**POST /api/batch-care**
- Records care for multiple plants
- Supports all care types
- Includes EC/pH and rain data
- Returns success count

### Dashboard Analytics

**GET /api/dashboard/stats**
- Collection statistics
- Plants needing attention
- Financial summary
- Recent activity
- EC/pH alerts

### Chat Log Endpoints (AI Conversations)

**GET /api/chat-logs?plantId=xxx**
- Returns all saved AI conversations for a plant
- Parses JSON messages and userEdits
- Ordered by conversationDate descending

**POST /api/chat-logs**
- Saves new AI conversation
- Body: `{ plantId, messages: [{role, content, timestamp}], conversationDate? }`
- Auto-generates title from first user message
- Sets confidence to "unverified" by default

**GET /api/chat-logs/{id}**
- Returns single chat log with plant info
- Includes parsed messages and userEdits

**PATCH /api/chat-logs/{id}**
- Updates title, confidence, messages, or userEdits
- Validates confidence: unverified, verified, partially_verified, disputed

**DELETE /api/chat-logs/{id}**
- Deletes chat log permanently

---

## 🎯 Quick Reference

### Keyboard Shortcuts
- `Cmd+K`: Quick care modal
- `/`: Focus search (on plant list)
- `Esc`: Close modals

### Important Files
- Schema: `prisma/schema.prisma`
- Database: `prisma/dev.db`
- Env vars: `.env`
- Logs: `.next-dev.log`
- Backups: `backups/`

### Common Commands
```bash
# Start server
./scripts/dev --bg

# View database
npx prisma studio

# Check plants
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Plant;"

# Backup database
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# View logs
tail -f .next-dev.log
```

### Support Contacts
- Database Issues: Check `.next-dev.log` first
- Schema Problems: Run `npx prisma generate`
- UI Bugs: Check browser console (F12)
- Data Loss: Check backups in NAS

---

## 📈 Performance Metrics

### Current Performance (Nov 2025)
- Plant list load: <200ms
- Plant detail load: <150ms
- Photo upload: <2s (with thumbnail generation)
- Search response: <50ms
- Database size: ~50MB
- Photo storage: ~2GB

### Optimization Targets
- Keep database <500MB
- Thumbnail all photos <200KB
- API response <100ms
- Page load <1s
- Database queries <50ms

---

## 🧬 Breeding Pipeline API

### Endpoints

**Breeding Records (Crosses)**
```
GET    /api/breeding           - List all crosses with summary stats
POST   /api/breeding           - Create new cross (auto-generates CLX-YYYY-###)
GET    /api/breeding/{id}      - Get cross with full pipeline
PATCH  /api/breeding/{id}      - Update cross details
DELETE /api/breeding/{id}      - Delete cross (only if no harvests)
```

**Harvests**
```
GET    /api/breeding/{id}/harvests           - List harvests for cross
POST   /api/breeding/{id}/harvests           - Add harvest (auto-increments harvestNumber)
GET    /api/breeding/{id}/harvests/{hid}     - Get single harvest
PATCH  /api/breeding/{id}/harvests/{hid}     - Update harvest
DELETE /api/breeding/{id}/harvests/{hid}     - Delete harvest
```

**Seed Batches**
```
GET    /api/seed-batches           - List all seed batches
POST   /api/seed-batches           - Create batch (auto-generates SDB-YYYY-###)
GET    /api/seed-batches/{id}      - Get batch with seedlings
PATCH  /api/seed-batches/{id}      - Update batch
DELETE /api/seed-batches/{id}      - Delete batch (only if no seedlings)
```

**Seedlings**
```
GET    /api/seedlings              - List seedlings with filters
POST   /api/seedlings              - Create seedling(s) (bulk supported)
GET    /api/seedlings/{id}         - Get seedling with full lineage
PATCH  /api/seedlings/{id}         - Update seedling
DELETE /api/seedlings/{id}         - Delete seedling (only if not graduated)
POST   /api/seedlings/{id}/graduate - Graduate to Plant table
```

### ID Generation

Located in `src/lib/breeding-ids.ts`:
```typescript
generateCrossId()     // Returns CLX-YYYY-### (e.g., CLX-2025-001)
generateSeedBatchId() // Returns SDB-YYYY-### (e.g., SDB-2025-001)
generateSeedlingId()  // Returns SDL-YYYY-#### (e.g., SDL-2025-0001)
generatePlantId()     // Returns ANT-YYYY-#### (e.g., ANT-2025-0070)
```

### Graduation Workflow

When a seedling is graduated:
1. Seedling must have selectionStatus = KEEPER or HOLDBACK
2. Creates Plant record with:
   - Auto-generated ANT-YYYY-#### plantId
   - femaleParentId and maleParentId from breeding record
   - breedingRecordId linking to the cross
   - generation (F1, F2, S1 auto-detected)
   - propagationType = 'seed'
3. Updates seedling:
   - Sets graduatedToPlantId
   - Sets graduationDate
   - Sets selectionStatus = GRADUATED
4. Updates breeding record f1PlantsRaised count

---

**End of Engineering Manual v1.7.5**