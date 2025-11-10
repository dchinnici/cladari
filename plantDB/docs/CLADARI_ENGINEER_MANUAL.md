# Cladari Plant Database - Engineering Manual
**Version:** 1.1.2
**Last Updated:** November 10, 2025
**Status:** FOUNDATION PHASE - Data Hygiene & Standardization
**Architecture:** SQLite + Next.js 15 + Prisma ORM

---

## 🌱 What Is This System?

The Cladari Plant Database is a comprehensive Anthurium breeding management system designed for serious collectors and breeders. It tracks:

- **Plant Collection**: 67 plants (current), scalable to thousands
- **Breeding Records**: Parent/offspring relationships, cross tracking
- **Care Management**: Watering, fertilizing, health monitoring
- **Morphological Traits**: Botanical-standard phenotype recording
- **Financial Tracking**: Acquisition costs, market values
- **Photos**: Growth progression documentation
- **Vendor Management**: Source tracking and reputation

**Not just a spreadsheet:** This is a proper botanical database with:
- Relational data (plants link to vendors, locations, breeding records)
- Standardized taxonomy (dropdown fields prevent typos)
- Time-series tracking (measurements, care logs over time)
- Hot-reloading development environment
- API-first design (every feature has an endpoint)

---

## 📊 Current System State (October 17, 2025)

### What's Working ✅
```
✅ Web UI (http://localhost:3000): Plant browsing, detail pages, editing
✅ SQLite Database: 67 plants, relationships, vendor data
✅ API Endpoints: CRUD operations for plants, care logs, measurements
✅ Prisma ORM: Type-safe database access, migrations
✅ Hot Reload: Code changes appear immediately in browser
✅ Data Standardization: Section, Health Status, Propagation Type dropdowns
✅ Alphabetical Sorting: Plants sorted by name (hybridName or species)
```

### Recent Improvements 🚀
```
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

Oct 17: REPRODUCTIVE PHENOLOGY - Fertility tracking system
        - FloweringCycle model for breeding coordination
        - Track spathe emergence, female/male phases
        - Pollen collection and storage management
        - Flowering tab on plant detail pages
        - Documentation: REPRODUCTIVE_PHENOLOGY.md

Oct 17: TEMPORAL MORPHOLOGY - Track phenotype changes over time
        - Removed unique constraint on Trait observations
        - Edit capability for prior observations
        - Timeline view of morphological changes
        - Documentation: TEMPORAL_MORPHOLOGY.md

Oct 17: DATA STANDARDIZATION
        - Added Propagation Type, Generation, Breeder, Breeder Code fields
        - Removed confusing top-right Edit button
        - Changed Section field from text to dropdown (13 Anthurium sections)
        - Fixed database connection issues (absolute path in .env)
        - Resolved schema mismatches (removed variegationType, measurementType)
        - Renamed speciesComplex → section throughout entire codebase
```

### Collection Statistics 📈
```
Total Plants: 67
Collection Value: $11,469
Vendors: Multiple tracked
Locations: Tracked with environmental data
Breeding Records: Crosses and offspring relationships
```

---

## 🏗️ Database Architecture (Simple Explanation)

### What is SQLite?
**Think of it like Excel, but much more powerful:**
- File-based database (just one file: `dev.db`)
- No server required (unlike PostgreSQL/MySQL)
- Perfect for single-user applications (you)
- Fast for small-to-medium datasets (<100K records)
- Easy to backup (just copy the file)

**Location:** `/Users/davidchinnici/cladari/plantDB/prisma/dev.db`

### What is Prisma?
**Your translator between JavaScript and SQL:**
- Defines your database structure in `schema.prisma`
- Generates TypeScript types automatically
- Prevents SQL injection and common errors
- Makes database changes through "migrations"

**Think of it as:** A type-safe layer that prevents you from breaking your database

### Database Tables (Current)

**Core Tables:**
```
Plant            - Main plant records (67 rows)
├── Genetics     - Genetic data (ploidy, RA numbers, provenance)
├── Trait        - Morphological traits (leaf, spathe, growth patterns)
├── Photo        - Plant photos with metadata
├── Measurement  - Growth measurements over time
└── CareLog      - Care activities (watering, fertilizing, etc.)

BreedingRecord   - Cross tracking (female × male → offspring)
Vendor           - Source vendors and reputation
Location         - Growing locations (greenhouse, tent, shelf)
Treatment        - Fertilizers, pesticides, fungicides
Species          - Reference data for accepted names
```

### How Data Connects

**Example: A plant's complete record**
```
Plant "ANT-2025-0042" (NSE Dressleri)
├── vendor → "NSE Tropicals" (Vendor table)
├── currentLocation → "Greenhouse A1" (Location table)
├── genetics → {ploidy: "2n", raNumber: "RA8"} (Genetics table)
├── traits → [
│     {category: "leaf", traitName: "texture", value: "velvety"},
│     {category: "leaf", traitName: "color", value: "dark green"}
│   ] (Trait table)
├── measurements → [
│     {date: "2025-01-15", leafLength: 25.5, leafWidth: 18.2}
│   ] (Measurement table)
└── careLogs → [
      {date: "2025-10-01", action: "fertilize", details: {...}}
    ] (CareLog table)
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
DATABASE_URL="file:./dev.db" npm run dev -- --hostname 0.0.0.0
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
└── README.md                     # Project overview
```

### Database Files
```
prisma/
├── schema.prisma                 # Database structure (THE SOURCE OF TRUTH)
├── dev.db                        # SQLite database file (67 plants)
├── dev.db-shm, dev.db-wal        # SQLite working files
└── migrations/                   # Database change history
```

### Source Code
```
src/
├── app/
│   ├── page.tsx                  # Homepage/Dashboard
│   ├── plants/
│   │   ├── page.tsx              # Plant list page
│   │   └── [id]/page.tsx         # Plant detail page (MAIN UI)
│   └── api/
│       ├── plants/
│       │   ├── route.ts          # GET /api/plants, POST /api/plants
│       │   └── [id]/route.ts     # GET/PATCH/DELETE /api/plants/{id}
│       └── dashboard/
│           └── stats/route.ts    # GET /api/dashboard/stats
├── components/
│   ├── modal.tsx                 # Reusable modal component
│   └── toast.tsx                 # Toast notifications
└── lib/
    └── prisma.ts                 # Prisma client singleton
```

### Documentation
```
docs/
├── CLADARI_ENGINEER_MANUAL.md   # This file
├── VISION_AND_PIPELINE.md        # Future roadmap (to be created)
├── DB_QUICK_REFERENCE.md         # Quick tips
└── README.md                     # Documentation index
```

### Scripts
```
scripts/
├── dev                           # Start development server
├── stop                          # Stop server
└── import-excel-data.js          # Import from Excel (if needed)
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

### Backing Up Your Data

**Automated Backups (ACTIVE) ✅**
```bash
# Backups run automatically every night at 10 PM to Synology NAS
# - Full project sync to NAS (370 files)
# - Database snapshots (last 30 days retained)
# - Time Machine hourly backups (local)

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
SELECT 'Vendors:', COUNT(*) FROM Vendor;
SELECT 'Locations:', COUNT(*) FROM Location;
SELECT 'Breeding Records:', COUNT(*) FROM BreedingRecord;
SELECT 'Care Logs:', COUNT(*) FROM CareLog;
SELECT 'Measurements:', COUNT(*) FROM Measurement;
EOF
```

**Find plants by section:**
```bash
sqlite3 prisma/dev.db "SELECT plantId, hybridName, section FROM Plant WHERE section='Cardiolonchium';"
```

---

## 🎚️ Feature Flags (Current & Planned)

### Currently Active ✅
```javascript
// These features are LIVE in production
{
  standardized_dropdowns: true,    // Section, Health Status, etc.
  alphabetical_sorting: true,      // Plants sorted by name
  breeding_tracking: true,         // Parent/offspring relationships
  flowering_cycles: true,          // Reproductive phenology tracking
  temporal_morphology: true,       // Track phenotype changes over time
  care_logging: true,              // Water, fertilize, repot tracking
  financial_tracking: true,        // Costs and market values
  vendor_management: true,         // Source tracking
  location_management: true,       // Advanced environmental tracking
  environmental_metrics: true,     // DLI, VPD, CO₂, pressure
  equipment_tracking: true,        // Grow lights, airflow, photoperiod
  automated_backups: true          // Daily NAS backups + database snapshots
}
```

### Planned Features 📋
```javascript
// Phase 2 (Next 2-8 weeks)
{
  photo_storage: false,            // Photo upload and management
  qr_code_generation: false,       // Print labels with QR codes
  mobile_pwa: false,               // Mobile-optimized plant pages
  sensor_integration: false,       // SensorPush, smart home data
  export_darwin_core: false,       // Botanical standard export
  batch_operations: false          // Edit multiple plants at once
}

// Phase 3 (Months 3-6)
{
  vector_search: false,            // Semantic plant search
  postgresql_migration: false,     // Move to Postgres when >1000 plants
  mcp_server: false,               // LLM tool integration
  photo_embeddings: false,         // AI-powered photo analysis
  dna_database: false,             // MinION sequence storage
  pest_detection: false            // AI pest/disease detection
}

// Phase 4 (Months 6-12)
{
  distributed_processing: false,   // F2 (RTX 4090) for heavy ML
  custom_ml_models: false,         // Trait prediction from photos
  breeding_ai: false,              // AI-suggested crosses
  multi_user: false                // Collaboration features
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
# Should show: DATABASE_URL="file:./dev.db"

# If missing, create it
echo 'DATABASE_URL="file:./dev.db"' > .env
```

### Database Issues

**Symptom:** "Column does not exist" errors
**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# If that doesn't work, check schema matches database
npx prisma db pull  # This pulls actual DB structure into schema

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
- Includes: vendor, currentLocation relations
```bash
curl http://localhost:3000/api/plants
```

**POST /api/plants**
- Creates: New plant
- Auto-generates: plantId (ANT-YYYY-XXXX format)
- Body example:
```json
{
  "hybridName": "NSE Dressleri Rio Gauche",
  "species": "Anthurium dressleri",
  "section": "Cardiolonchium",
  "acquisitionCost": 150.00,
  "healthStatus": "healthy",
  "propagationType": "cutting",
  "generation": "F1",
  "breeder": "NSE Tropicals",
  "breederCode": "RA8"
}
```

**GET /api/plants/[id]**
- Returns: Single plant with all relations
- Includes: vendor, location, genetics, traits, photos, careLogs, measurements, breeding records

**PATCH /api/plants/[id]**
- Updates: Plant fields
- Body: Partial plant object (only fields to update)

**Dashboard Stats**

**GET /api/dashboard/stats**
- Returns: Collection statistics
```json
{
  "totalPlants": 67,
  "healthyPlants": 60,
  "totalInvestment": 11469,
  "avgCost": 171.18,
  "maxCost": 500,
  "totalCrosses": 5,
  "activeCrosses": 3,
  "totalVendors": 8,
  "activeVendors": 4,
  "speciesDistribution": [...],
  "topVendors": [...],
  "eliteGenetics": [...],
  "recentActivity": [...]
}
```

---

## 🎯 Quick Start Guide

### First Time Setup

**1. Install dependencies**
```bash
cd /Users/davidchinnici/cladari/plantDB
npm install
```

**2. Verify database connection**
```bash
cat .env
# Should show: DATABASE_URL="file:./dev.db"
```

**3. Generate Prisma client**
```bash
npx prisma generate
```

**4. Start development server**
```bash
./scripts/dev --bg
```

**5. Open in browser**
```
http://localhost:3000
```

### Daily Workflow

**Start working:**
```bash
cd /Users/davidchinnici/cladari/plantDB
./scripts/dev --bg
open http://localhost:3000
```

**Check logs if something breaks:**
```bash
tail -f .next-dev.log
```

**Stop for the day:**
```bash
./scripts/stop
```

**Backup weekly:**
```bash
cp prisma/dev.db prisma/backups/dev-$(date +%Y%m%d).db
```

---

## 🔮 Future Vision

### Phase 1: Foundation (Current - Week 2)
- ✅ Basic CRUD operations
- 🔄 Standardized dropdowns (in progress)
- 📋 Morphology dropdowns (botanical terms)
- 📋 Bug fixing and data validation

### Phase 2: Enhanced Data (Weeks 3-8)
- 📸 Photo upload and storage
- 🏷️ QR code generation (Zebra ZD421 printer)
- 📱 Mobile PWA for plant pages
- 📡 SensorPush integration (environmental data)
- 📊 Export to Darwin Core format
- ✏️ Batch edit operations

### Phase 3: Intelligence Layer (Months 3-6)
- 🧠 PostgreSQL + pgvector migration
- 🔍 Semantic plant search
- 🤖 MCP server (LLM tool integration)
- 📷 Photo embeddings and analysis
- 🧬 MinION DNA sequence database
- 🐛 AI pest/disease detection

### Phase 4: Distributed Processing (Months 6-12)
- 🖥️ F2 (RTX 4090) for heavy ML workloads
- 🎯 Custom trait prediction models
- 🧬 BLAST search for DNA sequences
- 💡 AI-suggested breeding crosses
- 🌐 Integration with Sovria (personal AI)

---

## 🔗 Integration with Sovria (Future)

### What is Sovria?
Your personal AI consciousness system running on F1 (M3 Ultra) and F2 (RTX 4090). It tracks:
- Conversations and beliefs
- Health data (WHOOP, HealthKit)
- Photos and memories
- Life patterns and correlations

### How PlantDB Integrates

**As a Modality:**
PlantDB becomes another "sense" for Sovria, enabling queries like:
```
"When did I buy the most plants and what was happening in my life?"
→ Correlates PlantDB acquisitions with Sovria health/conversation data

"Suggest breeding projects based on my current creative energy"
→ Uses Sovria cognitive state + PlantDB genetics

"How has my plant care improved over time?"
→ PlantDB care logs + Sovria belief evolution
```

**Technical Integration:**
- PlantDB exposes MCP server (Model Context Protocol)
- Sovria gains `search_plants` and `suggest_crosses` tools
- Bidirectional correlation: Life events ↔ Plant activities

**Timeline:** Phase 4 (Months 6-12)

---

## 📖 Reference Documents

### Documentation Files
- **DB_QUICK_REFERENCE.md** - Quick tips and troubleshooting
- **VISION_AND_PIPELINE.md** - Strategic roadmap and brainstorming (to be created)
- **OPERATOR_MANUAL.md** - User guide for non-technical use
- **INSTRUCTION_MANUAL.md** - System overview

### External Resources
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **SQLite Docs**: https://www.sqlite.org/docs.html
- **Anthurium Taxonomy**: Missouri Botanical Garden, WCSPF (Kew Gardens)

### Sovria Integration
- **~/f1sovria/docs/ENGINEER_MANUAL_2025_09_11_VECTOR.md** - Vector database patterns
- **~/f1sovria/docs/DISTRIBUTED_CONSCIOUSNESS_ARCHITECTURE_2025_09_11.md** - F1/F2 architecture
- **~/f1sovria/docs/SOVRIA_ETHOS_AND_DIRECTION.md** - Vision and philosophy

---

## 🎨 Hardware Notes

### Zebra ZD421 Printer
**Purpose:** Print plant labels with QR codes
**Label Format:**
```
┌─────────────────┐
│  [QR Code]      │  ← Deep link to plant page
│                 │
│  ANT-2025-1234  │  ← Plant ID
│  RA8 × RA5      │  ← Breeder code / cross
│  NSE Dressleri  │  ← Common name
└─────────────────┘
```

**Integration Timeline:** Phase 2 (QR code generation)
**Label Size:** 2" x 1" recommended (fits most pots)
**Material:** Weatherproof polyester for greenhouse use

---

## 💡 Key Principles

### Data Sovereignty
- **Your data, your control**: SQLite file is yours
- **No cloud lock-in**: Everything runs locally
- **Easy backups**: Just copy dev.db
- **Portable**: Move to any machine

### Standardization First
- **Botanical accuracy**: Use accepted taxonomic terms
- **Dropdown enforcement**: Prevent typos in critical fields
- **Data validation**: Ensure publishable quality
- **Future-proof**: Ready for scientific use

### API-First Design
- **Every feature = endpoint**: UI and code can access same data
- **Integration ready**: Other tools can query your database
- **LLM compatible**: Ready for AI tool integration
- **Automation friendly**: Scripts can manage data

### Progressive Enhancement
- **Start simple**: SQLite is perfect for now
- **Scale when needed**: Clear migration path to Postgres
- **Add features gradually**: Each phase builds on previous
- **No premature optimization**: Only add complexity when necessary

---

## 🆘 Support & Help

### When You're Stuck

1. **Check the logs first**
   ```bash
   tail -50 .next-dev.log
   ```

2. **Restart the server**
   ```bash
   ./scripts/stop && ./scripts/dev --bg
   ```

3. **Verify database connection**
   ```bash
   npx prisma studio
   # Opens at http://localhost:5555
   ```

4. **Check for schema mismatches**
   ```bash
   npx prisma generate
   ```

5. **Ask Claude/AI for help**
   - Show error messages from logs
   - Describe what you were trying to do
   - Reference this manual

### Common Gotchas

❌ **Don't edit dev.db directly** → Use Prisma Studio or API
❌ **Don't delete migrations folder** → Breaks schema history
❌ **Don't commit .env to git** → Contains sensitive paths
✅ **Do backup before schema changes** → Safety first
✅ **Do regenerate Prisma client after schema edits** → Keeps types in sync
✅ **Do use Prisma Studio for quick edits** → Visual and safe

---

## 📝 Changelog

### Version 1.0 - October 17, 2025

#### Initial Manual Creation
- Comprehensive system documentation
- Database architecture explanation
- Common operations guide
- Troubleshooting section
- Future vision and roadmap

#### Recent System Improvements
- Added Propagation Type dropdown
- Added Generation dropdown (F1-F6, P1, BC1)
- Added Breeder Code dropdown (RA5, RA6, RA8, OG5, NSE)
- Added Breeder text field
- Removed confusing top-right Edit button
- Changed Section to dropdown (13 Anthurium sections)
- Fixed database connection with absolute path
- Resolved schema mismatches
- Renamed speciesComplex → section globally

---

**Manual Status**: 🟢 COMPLETE - Living Document
**Last Updated**: October 17, 2025
**Next Review**: When major features are added (Phase 2)
**Confidence Level**: High - System is stable and well-documented

**Remember:** This is YOUR database. You built it. You understand it. This manual is here to help you remember how it works when you come back to it later. Don't be intimidated - you know more than you think.

---

## Recent Updates (November 2025)

### v1.1.2 - Production Hardening & ML Data Preservation (Nov 10, 2025)

#### EXIF Date Extraction - Commercial Grade
**Problem:** Photo dates were inconsistent, especially for DNG files which were actually JPEGs with wrong extensions.

**Solution:** Upgraded from `exif-parser` to `exiftool-vendored` (industry standard Perl ExifTool wrapper)

**Technical Details:**
```typescript
// Old approach (fragile)
import ExifParser from 'exif-parser'
const parser = ExifParser.create(buffer)
const result = parser.parse()

// New approach (production-ready)
import { exiftool } from 'exiftool-vendored'
const tags = await exiftool.read(tempFilePath)
// Handles: JPEG, DNG, RAW (CR2/NEF/ARW), HEIC, PNG
// Auto-detects via magic bytes, not extension
```

**Benefits:**
- Handles ALL image formats correctly
- Detects actual file type via magic bytes (not fooled by wrong extensions)
- Proper fallback: DateTimeOriginal → CreateDate → DateTime
- Commercial/consumer release ready

**Files Modified:**
- `/src/app/api/photos/route.ts` - Photo upload with EXIF extraction
- `package.json` - Added `exiftool-vendored` dependency

---

#### Archive/Graveyard System - ML Training Data Preservation
**Problem:** Delete operations permanently destroyed all plant data, losing valuable training data for future ML models.

**Solution:** Implemented soft delete with archive system

**Schema Changes:**
```prisma
model Plant {
  // ... existing fields ...
  
  // Archive / Graveyard (soft delete - preserve data for ML training)
  isArchived        Boolean  @default(false)
  archivedAt        DateTime?
  archiveReason     String?  // died, sold, culled, divided, lost, etc.
  
  @@index([isArchived])
}
```

**API Implementation:**
```typescript
// DELETE /api/plants/[id] - Archives instead of deleting
export async function DELETE(request, context) {
  const archived = await prisma.plant.update({
    where: { id: params.id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archiveReason: body.reason || 'deleted'
    }
  })
  // All related data retained: photos, care logs, measurements, traits
}

// GET /api/plants - Auto-filters archived plants
const plants = await prisma.plant.findMany({
  where: { isArchived: false }  // Only show active plants
})
```

**Archive Reasons:**
- `died` - Plant death (disease, pest, environmental)
- `sold` - Sold to customer
- `culled` - Removed during F1 selection
- `divided` - Parent plant divided into offshoots
- `lost` - Lost/stolen/destroyed
- `deleted` - User-initiated removal

**Benefits:**
- **ML training data preserved:** All historical care, growth, and trait data retained
- **Reversible:** Can restore archived plants if needed
- **Analytics:** Track mortality rates, cull reasons, success patterns
- **Audit trail:** Full history of collection changes

**Files Created/Modified:**
- `prisma/schema.prisma` - Added archive fields
- `/src/app/api/plants/[id]/route.ts` - New endpoint with archive logic
- `/src/app/api/plants/route.ts` - Filter archived plants from list

---

#### Bug Fixes (Nov 6-10, 2025)

**P0: Date Shifting Bug (UTC Mismatch)**
- **Problem:** Care entries showed wrong dates (afternoon entries appeared as tomorrow)
- **Root Cause:** `new Date(body.date + 'T12:00:00')` interpreted as local time, shifted to UTC
- **Fix:** Changed to `new Date(body.date + 'T00:00:00.000Z')` for explicit UTC midnight
- **Impact:** Fixed across 8 API endpoints (care logs, measurements, flowering, traits, plants)

**P1: False EC Buildup Alert (Plant 0046)**
- **Problem:** EC variance 0.62 triggered critical alert despite healthy values
- **Root Cause:** Rain water flush (EC 0.05) artificially lowered average input EC
  - Input EC avg: (1.17 + 0.05 + 0.37) / 3 = 0.53
  - Output EC avg: 1.15 / 1 = 1.15  
  - Variance: 0.62 > 0.5 threshold ❌
- **Fix:** Calculate EC variance only from **paired readings** (logs with BOTH input and output)
- **Result:** Plant 0046 variance now 0.02 (healthy) ✓
- **File:** `/src/lib/care/ecPhUtils.ts:343-355`

**P1: Dashboard Stale Plants Calculation**
- **Problem:** Showed "53 plants not updated in 14+ days" incorrectly
- **Root Cause:** Used `plant.updatedAt` (record edits) instead of care activity
- **Fix:** Check `lastCareLog.date` for actual care activity
- **File:** `/src/app/api/dashboard/stats/route.ts:274-287`

**P1: Plant Page Not Refreshing After Care**
- **Problem:** Back navigation showed stale data (care-based sorting incorrect)
- **Fix:** Added visibility change listener to refetch on page focus
- **File:** `/src/app/plants/page.tsx:88-98`

**P1: UI Button Updates**
- Changed Add Care/Delete buttons to icon-only (water droplet blue, trash red)
- Added hover tooltips for accessibility
- **File:** `/src/app/plants/[id]/page.tsx:725-736`

---

#### ML/AI System Status (Clarification)

**Current State:** The "ML" system is a **placeholder/stub** with adaptive logic:
- ✅ Adaptive averaging (historical frequency calculations)
- ✅ Environmental adjustments (temp >24°C, humidity >60%)  
- ✅ Threshold-based alerts (EC variance, pH drift)
- ❌ NOT actual machine learning (no regression, no neural networks)

**Future Vision:** Replace with real ML models trained on collected data:
- **Scikit-learn:** Regression models for care schedules
- **TensorFlow.js:** Trait prediction, growth forecasting
- **Feature engineering:** VPD, DLI, growth rate correlations
- **Training pipeline:** Historical care/growth/environmental data

**Why Preserve All Data:**
- Every deleted plant = lost training examples
- Archive system retains: care patterns, failure modes, trait expressions
- Enables future ML: mortality prediction, optimal care schedules, trait inheritance models

---

