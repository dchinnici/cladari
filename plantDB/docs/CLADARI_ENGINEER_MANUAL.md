# Cladari Plant Database - Engineering Manual
**Version:** 1.2.0
**Last Updated:** November 12, 2025
**Status:** PRODUCTION PHASE - Photo Management & Data Optimization
**Architecture:** SQLite + Next.js 15 + Prisma ORM

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
- ML-ready infrastructure for future AI features

---

## 📊 Current System State (November 12, 2025)

### What's Working ✅
```
✅ Web UI (http://localhost:3000): Plant browsing, detail pages, editing
✅ SQLite Database: 67+ plants, relationships, vendor data
✅ API Endpoints: CRUD operations for plants, care logs, measurements
✅ Prisma ORM: Type-safe database access, migrations
✅ Hot Reload: Code changes appear immediately in browser
✅ Data Standardization: Section, Health Status, Propagation Type dropdowns
✅ Photo Management: Upload, display, cover photo selection
✅ EC/pH Tracking: Input/output monitoring with health scoring
✅ Pest Management: Discovery and treatment tracking
✅ Advanced Care Features: Batch care, quick care (Cmd+K), rain tracking
✅ Dashboard Analytics: Care queue, collection stats, critical alerts
```

### Recent Improvements 🚀
```
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
Total Plants: 67+
Collection Value: $11,469+
Vendors: Multiple tracked with reputation
Locations: Environmental monitoring active
Breeding Records: Crosses and offspring relationships
Photos: 500+ with EXIF data
Care Logs: EC/pH tracking active
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
Plant            - Main plant records with coverPhotoId
├── Genetics     - Genetic data (ploidy, RA numbers, provenance)
├── Trait        - Morphological traits (leaf, spathe, growth patterns)
├── Photo        - Plant photos with metadata (8 types)
├── Measurement  - Growth measurements over time
├── CareLog      - Care activities with EC/pH data
├── PlantJournal - Unified activity log for ML training
└── FloweringCycle - Reproductive phenology tracking

BreedingRecord   - Cross tracking (female × male → offspring)
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
├── schema.prisma                 # Database structure (THE SOURCE OF TRUTH)
├── dev.db                        # SQLite database file
├── dev.db-shm, dev.db-wal        # SQLite working files
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
│   └── api/
│       ├── plants/
│       │   ├── route.ts          # GET /api/plants, POST /api/plants
│       │   └── [id]/
│       │       ├── route.ts      # GET/PUT/PATCH/DELETE
│       │       └── care-logs/    # Care log endpoints
│       ├── photos/
│       │   └── route.ts          # Photo upload/management
│       ├── batch-care/
│       │   └── route.ts          # Batch operations
│       └── dashboard/
│           └── stats/route.ts    # Analytics endpoints
├── components/
│   ├── modal.tsx                 # Reusable modal component
│   ├── toast.tsx                 # Toast notifications
│   ├── QuickCare.tsx             # Quick care modal (Cmd+K)
│   └── care/
│       ├── CareQueue.tsx         # Dashboard care queue
│       ├── UpcomingCare.tsx      # ML-powered recommendations
│       └── ECPHDashboard.tsx     # EC/pH analytics
└── lib/
    ├── prisma.ts                 # Prisma client singleton
    ├── care/
    │   ├── ecPhUtils.ts          # EC/pH calculations
    │   ├── recommendations.ts    # ML care predictions
    │   └── types.ts              # TypeScript definitions
    └── ml/
        └── diagnosis.ts          # AI diagnostic functions
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

mcp-server/
├── index.ts                      # MCP server implementation
├── README.md                     # MCP setup guide
├── package.json                  # Dependencies
└── dist/                        # Compiled JavaScript
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
  breeding_tracking: true,         // Parent/offspring relationships
  flowering_cycles: true,          // Reproductive phenology tracking
  temporal_morphology: true,       // Track phenotype changes over time

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
  qr_code_generation: false,       // Print labels with QR codes
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

## 🤖 MCP Server Architecture

PlantDB includes a Model Context Protocol (MCP) server that enables natural language interaction through Sovria AI. This represents a new paradigm: **modular domain expert systems** that can be queried conversationally.

### Architecture Overview

```
User → Sovria AI (Orchestrator)
         ↓ MCP Protocol
    PlantDB MCP Server
         ↓ HTTP/REST
    PlantDB Backend (Next.js)
         ↓ Prisma ORM
    SQLite Database
```

### Available MCP Tools

**search_plants**
- Natural language plant search
- Example: "Find velvety plants with red veins under $200"
- Uses semantic matching on traits, names, locations

**predict_care**
- ML-powered care schedule predictions
- Example: "Which plants need water today?"
- Analyzes historical patterns, environment, substrate health

**diagnose_symptoms**
- Plant health diagnosis
- Example: "Diagnose yellowing leaves with brown tips"
- Distinguishes similar issues (thrips vs nutrient lockout)

**get_plant_details**
- Retrieve plant information
- Can return single plant or entire collection
- Includes care logs, photos, statistics

### MCP Server Implementation

Location: `/mcp-server/`

Key files:
- `index.ts` - Server implementation with tool handlers
- `package.json` - Dependencies (@modelcontextprotocol/sdk, zod)
- `README.md` - Setup and configuration guide
- `test-server.ts` - Test suite for validation

### Configuration

Add to Sovria's MCP config:
```json
{
  "mcpServers": {
    "plantdb": {
      "command": "node",
      "args": ["/path/to/plantDB/mcp-server/dist/index.js"],
      "env": {
        "PLANTDB_API_BASE": "http://localhost:3000/api"
      }
    }
  }
}
```

### Development Workflow

```bash
# Build MCP server
cd mcp-server
npm install
npm run build

# Test the server
npm run test

# Check integration with Sovria
# Ask: "Show me all my plants"
# Ask: "Which plants need water?"
```

### Modular Domain Expert Pattern

PlantDB demonstrates the **modular domain expert** pattern:
- Each domain (plants, health, finance) has its own system
- Systems expose capabilities via MCP tools
- Sovria AI orchestrates cross-domain queries
- No data centralization required

Benefits:
- Domain expertise maintained separately
- Systems can evolve independently
- Clear responsibility boundaries
- Scalable to many domains

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

**End of Engineering Manual v1.2.0**