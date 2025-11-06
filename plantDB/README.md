# Cladari - Plant Management System

**Professional plant management platform for breeding, conservation, and environmental optimization**

Built with Next.js 15, Prisma, and SQLite for comprehensive Anthurium breeding program management.

---

## 🌱 Features

### Core Functionality
- **Plant Database** - Track accessions, lineage, genetics, and breeding records
- **CSV Export** - One-click export of entire database to CSV for backup and analysis
- **Smart Filtering & Sorting** - Adaptive care-based sorting, persistent filters across navigation
- **Location Management** - Monitor environmental conditions across multiple growing areas
- **Reproductive Phenology** - Track flowering cycles and fertility windows for breeding optimization
- **Temporal Morphology** - Document phenotypic changes over time
- **Care Logging** - Record watering (with baseline fertigation), special feeds, treatments
- **Care Log Management** - Full CRUD: Create, edit, and delete care logs with confirmation
- **Batch Care Operations** - Apply same care to multiple plants with location-based selection
- **Rain Tracking** - Log natural rainfall with amount and duration for outdoor plants
- **EC & pH Tracking** - Monitor nutrient and substrate chemistry with input/output measurements
- **Adaptive Care Recommendations** - ML-powered watering schedules based on historical patterns
- **Pest/Disease Discovery** - Structured workflow for logging pest findings separately from treatments
- **Elite Genetics Flagging** - Mark and track elite breeding stock
- **Photo Management** - Upload photos with EXIF extraction, edit metadata, organize by type/growth stage

### Fertigation Workflow
Modern liquid feed management system:
- **Baseline Feed** - Auto-fill pH 6.1 / EC 1.0 (CalMag + TPS One + K-Carb) with one checkbox
- **Integrated Schedule** - Watering always includes baseline fertigation (no separate fertilization schedule)
- **Incremental Feeds** - Log deviations from baseline (silica, dolomite, pH adjustments)
- **Event-Based** - Special feeds are event-driven, not schedule-driven

### Care Recommendation Engine
Intelligent scheduling system that learns from your patterns:
- **Adaptive Watering Frequency** - Calculates average interval from your last 10 care logs
- **Environmental Adjustments** - Modifies intervals based on temperature (>24°C) and humidity (>60%)
- **Confidence Levels** - High/Medium/Low based on data availability
- **EC/pH Context** - Substrate health scoring and trend analysis
- **Substrate Alerts** - Automatic warnings for EC buildup, pH drift, salt accumulation
- **No Fixed Schedules** - System learns YOUR specific watering patterns per plant

### Location Management
Comprehensive environmental tracking with advanced metrics:
- **Basic Monitoring:** Temperature, humidity (RH%), light levels
- **Advanced Metrics:** DLI (Daily Light Integral), VPD (Vapor Pressure Deficit), CO₂, atmospheric pressure
- **Equipment Tracking:** Grow lights, photoperiod, airflow, fan systems
- **Capacity Planning:** Track plant counts, prevent overcrowding
- **Organization:** Zone, shelf, position hierarchies

### Breeding Program
- **Flowering Cycle Tracking** - Monitor spathe emergence, female/male phases, pollen collection
- **Pollen Management** - Track quality, storage, viability for coordinated crosses
- **Lineage Tracking** - F1, F2, F3+ generations with parent relationships
- **Breeding Goals** - Document selection criteria and outcomes

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd plantDB

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## 📁 Project Structure

```
plantDB/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   │   ├── locations/    # Location management endpoints
│   │   │   ├── plants/       # Plant CRUD + flowering/traits/photos
│   │   │   └── dashboard/    # Analytics endpoints
│   │   ├── plants/           # Plant pages
│   │   ├── locations/        # Location management UI
│   │   ├── breeding/         # Breeding records
│   │   ├── genetics/         # Genetic analysis
│   │   ├── batch-care/       # Batch operations
│   │   └── dashboard/        # Overview dashboard
│   ├── components/           # Reusable React components
│   │   └── care/            # Care recommendation components
│   └── lib/                  # Utilities
│       ├── care/            # Care recommendation engine
│       ├── careLogUtils.ts  # Care frequency calculations
│       └── prisma.ts        # Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── dev.db               # SQLite database
├── docs/                     # Documentation
│   ├── LOCATION_MANAGEMENT.md
│   ├── REPRODUCTIVE_PHENOLOGY.md
│   ├── TEMPORAL_MORPHOLOGY.md
│   ├── CLADARI_ENGINEER_MANUAL.md
│   └── OPERATOR_MANUAL.md
├── public/
│   └── uploads/            # Photo storage
│       ├── photos/         # Full-size images
│       └── thumbnails/     # Optimized thumbnails
└── scripts/                # Utility scripts
```

---

## 🗄️ Database Schema

### Core Models
- **Plant** - Central entity with lineage, genetics, location
- **Location** - Growing environments with environmental metrics
- **FloweringCycle** - Reproductive phenology tracking
- **Trait** - Temporal morphology observations
- **CareLog** - Care activities and interventions
- **Photo** - Plant photos with EXIF metadata
- **Measurement** - EC, pH, nutrient tracking
- **GrowthMetric** - Quick growth assessments
- **BreedingRecord** - Cross documentation
- **Vendor** - Source tracking
- **Treatment** - Fertilizers, pesticides, fungicides

See `prisma/schema.prisma` for complete schema definition.

---

## 🎯 Key Workflows

### Daily Care Logging
1. Navigate to plant detail page
2. Click **Add Care Log**
3. Select **Watering** activity type
4. Check **Include baseline feed** checkbox (auto-fills pH 6.1, EC 1.0)
5. Adjust values if needed for this specific watering
6. Add notes about plant condition
7. Save - baseline feed recorded in 10 seconds!

### Recording Special Feeds
1. Same as above, but select **Incremental Feed** instead
2. System knows this is a deviation from baseline
3. Describe what was added (silica, pH down, extra nutrients)
4. No schedule needed - these are event-based

### Managing Locations
1. Navigate to **Locations** in top navigation
2. **Add Location** to create new growing area
3. Document environmental conditions:
   - Basic: Temperature, humidity
   - Advanced: DLI, VPD, CO₂, pressure
   - Equipment: Grow lights, airflow, photoperiod
4. Assign plants via dropdown in plant detail pages

### Tracking Flowering Cycles
1. Open plant detail page → **Flowering** tab
2. **Log Flowering Event** when spathe emerges
3. Update cycle as phases progress:
   - Spathe emergence → Female receptive → Male pollen → Cycle complete
4. Track pollen collection and storage
5. Coordinate crosses using fertility windows

### Recording Pest Discoveries
1. Plant detail → **Add Care Log**
2. Select **Pest/Disease Discovery**
3. Choose pest type from comprehensive dropdown (spider mites, thrips, root rot, etc.)
4. Select severity level (Mild, Moderate, Severe, Critical)
5. Specify affected area (lower leaves, new growth, roots)
6. Log treatment separately using **Pest Treatment** action

### Photo Management
1. Plant detail → **Photos** tab
2. Drag and drop images or click to select
3. System extracts EXIF date automatically
4. Edit photo metadata:
   - Photo type (whole plant, leaf, spathe, spadix, roots)
   - Growth stage (seedling, juvenile, mature)
   - Notes
   - Date taken (manual override if needed)
5. Delete photos with confirmation

### Batch Care Operations
1. Navigate to **Batch Care** from top navigation
2. **Select by Location:**
   - Choose location from dropdown (shows plant count)
   - Click "Select" to select all plants in that location
3. Choose activity type (Watering, Rain, Fertilizing, etc.)
4. For **Rain** activity:
   - Select rainfall amount: Light, Medium, or Heavy
   - Select duration: Brief, Short, Medium, Long, or Extended
5. Add notes and click **Save to Selected Plants**

---

## 📊 Environmental Metrics

### Daily Light Integral (DLI)
- **Units:** mol/m²/day
- **Optimal for Anthuriums:** 10-20 mol/m²/day
- Measures total light energy plants receive per day

### Vapor Pressure Deficit (VPD)
- **Units:** kPa (kilopascals)
- **Optimal for Anthuriums:** 0.8-1.2 kPa
- Indicates transpiration driving force

### CO₂ Concentration
- **Units:** ppm (parts per million)
- **Ambient:** ~400 ppm
- **Enriched:** 800-1200 ppm (20-30% faster growth)

See `docs/LOCATION_MANAGEMENT.md` for detailed environmental metrics reference.

---

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build
npm start

# Database management
npx prisma studio          # Visual database editor
npx prisma db push         # Sync schema to database
npx prisma generate        # Regenerate Prisma Client

# Code quality
npm run lint               # ESLint checks
```

### API Routes

All API routes follow RESTful conventions:

```
GET    /api/plants                            # List all plants
POST   /api/plants                            # Create plant
GET    /api/plants/[id]                       # Get plant details
PATCH  /api/plants/[id]                       # Update plant
DELETE /api/plants/[id]                       # Delete plant
GET    /api/plants/export                     # Export database to CSV
GET    /api/plants/[id]/recommendations      # Get adaptive care recommendations

GET    /api/locations           # List locations with counts
POST   /api/locations           # Create location
PATCH  /api/locations/[id]      # Update location
DELETE /api/locations/[id]      # Delete location (if no plants)

GET    /api/plants/[id]/flowering             # Get flowering cycles
POST   /api/plants/[id]/flowering             # Create cycle
PATCH  /api/plants/[id]/flowering/[cycleId]   # Update cycle
DELETE /api/plants/[id]/flowering/[cycleId]   # Delete cycle

POST   /api/plants/[id]/care-logs             # Create care log
PATCH  /api/plants/[id]/care-logs/[logId]     # Edit care log
DELETE /api/plants/[id]/care-logs/[logId]     # Delete care log (with confirmation)

POST   /api/photos                            # Upload photo
GET    /api/photos?plantId=[id]               # Get plant photos
PATCH  /api/photos?id=[photoId]               # Edit photo metadata
DELETE /api/photos?id=[photoId]               # Delete photo

PATCH  /api/plants/[id]/location              # Update plant location
```

---

## 📚 Documentation

- **Location Management:** `docs/LOCATION_MANAGEMENT.md`
- **Reproductive Phenology:** `docs/REPRODUCTIVE_PHENOLOGY.md`
- **Temporal Morphology:** `docs/TEMPORAL_MORPHOLOGY.md`
- **Engineer Manual:** `docs/CLADARI_ENGINEER_MANUAL.md`
- **Operator Manual:** `OPERATOR_MANUAL.md`
- **Vision & Pipeline:** `docs/VISION_AND_PIPELINE.md`

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15.5.6 (App Router)
- **Database:** Prisma ORM + SQLite
- **UI:** React 19, TailwindCSS, Lucide Icons
- **Charts:** Recharts
- **Image Processing:** Sharp (resize, thumbnails, EXIF extraction)
- **File Upload:** React Dropzone
- **TypeScript:** Full type safety

---

## 🎯 Roadmap

### Phase 1 (Complete) ✅
- Core plant database
- Location management with advanced metrics
- Flowering cycle tracking
- Temporal morphology
- Care logging with full CRUD capabilities
- Adaptive care recommendation engine
- Baseline feed checkbox with auto-fill
- Pest/disease discovery workflow
- Photo management with EXIF support
- Batch care with location-based selection
- Rain activity tracking with amount/duration
- CSV export functionality
- Plant deletion with safety checks
- Smart filtering and sorting with persistence
- Stale plant alerts
- Elite genetics tracking
- EC/pH tracking with substrate health analysis

### Phase 2 (Next)
- Dashboard with fertility windows widget
- Pollen inventory management
- Cycle prediction algorithms
- Environmental correlation analytics
- Advanced photo analysis (growth rate from images)
- Mobile-optimized PWA

### Phase 3 (Future)
- Sensor integration for real-time data
- Automated environmental alerts
- LLM-powered breeding recommendations (Sovria integration)
- AI pest/disease detection from photos
- Breeding program genetics calculator
- DNA sequence database (MinION integration)

---

## 📝 License

Proprietary - Cladari Plant Management System

---

## 🤝 Contributing

This is a private breeding program management system. For access or questions, contact the project maintainer.

---

## 📧 Support

For technical issues or feature requests, refer to `docs/CLADARI_ENGINEER_MANUAL.md` or contact the development team.

---

## 🤖 For AI Assistants (Claude, GPT, etc.)

**IMPORTANT:** When helping with debugging, feature development, or data analysis:

1. **Always remind the user to run the database snapshot:**
   ```bash
   ./scripts/snapshot-db.sh
   ```

2. **Request these files be uploaded to the conversation:**
   - `docs/db-snapshots/latest-stats.json` - Quick overview
   - `docs/db-snapshots/sample-plants.json` - Recent plant data
   - `docs/db-snapshots/sample-care-logs.json` - Recent care logs
   - `docs/db-snapshots/schema-info.txt` - Current schema (if schema questions arise)

3. **Why this matters:**
   - Text snapshots are easier to analyze than binary `.db` files
   - Provides real-time visibility into actual data state
   - Helps identify data quality issues, patterns, and edge cases
   - Essential for making informed recommendations

**Example prompt to user:**
> "Before we debug this, can you run `./scripts/snapshot-db.sh` and upload the files from `docs/db-snapshots/` (especially latest-stats.json and sample-plants.json) so I can see your current data state?"

---

**Version:** 1.2.0 - Bug Fix & Workflow Optimization Release
**Built with 🌿 for professional plant breeding and conservation**
