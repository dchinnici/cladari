# Cladari - Plant Management System

**Professional plant management platform for breeding, conservation, and environmental optimization**

Built with Next.js 15, Prisma, and SQLite for comprehensive Anthurium breeding program management.

---

## 🌱 Features

### Core Functionality
- **Plant Database** - Track accessions, lineage, genetics, and breeding records
- **CSV Export** - One-click export of entire database to CSV for backup and analysis
- **Smart Filtering & Sorting** - Sort by update age, stale plant alerts, comprehensive filters
- **Location Management** - Monitor environmental conditions across multiple growing areas
- **Reproductive Phenology** - Track flowering cycles and fertility windows for breeding optimization
- **Temporal Morphology** - Document phenotypic changes over time
- **Care Logging** - Record watering, fertilization, treatments, and interventions
- **Care Log Editing** - Edit existing care logs to add output measurements and notes
- **EC & pH Tracking** - Monitor nutrient and soil chemistry metrics
- **Elite Genetics Flagging** - Mark and track elite breeding stock

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
│   │   │   ├── plants/       # Plant CRUD + flowering/traits
│   │   │   └── dashboard/    # Analytics endpoints
│   │   ├── plants/           # Plant pages
│   │   ├── locations/        # Location management UI
│   │   ├── breeding/         # Breeding records
│   │   ├── genetics/         # Genetic analysis
│   │   └── dashboard/        # Overview dashboard
│   ├── components/           # Reusable React components
│   └── lib/                  # Utilities (Prisma client, etc.)
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── dev.db               # SQLite database
├── docs/                     # Documentation
│   ├── LOCATION_MANAGEMENT.md
│   ├── REPRODUCTIVE_PHENOLOGY.md
│   ├── TEMPORAL_MORPHOLOGY.md
│   └── CLADARI_ENGINEER_MANUAL.md
└── public/                   # Static assets
```

---

## 🗄️ Database Schema

### Core Models
- **Plant** - Central entity with lineage, genetics, location
- **Location** - Growing environments with environmental metrics
- **FloweringCycle** - Reproductive phenology tracking
- **Trait** - Temporal morphology observations
- **CareLog** - Care activities and interventions
- **Measurement** - EC, pH, nutrient tracking
- **BreedingRecord** - Cross documentation
- **Vendor** - Source tracking

See `prisma/schema.prisma` for complete schema definition.

---

## 🎯 Key Workflows

### Adding a New Plant
1. Navigate to **Plants** → **+ Add Plant**
2. Fill in taxonomy, acquisition details
3. Assign to a location
4. Document initial morphology
5. Begin care logging

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

### Recording Morphology Changes
1. Plant detail → **Morphology** tab
2. **Edit Morphology** to record current observations
3. System tracks changes over time automatically
4. Each update creates a new timestamped observation

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
GET    /api/plants                       # List all plants
POST   /api/plants                       # Create plant
GET    /api/plants/[id]                  # Get plant details
PATCH  /api/plants/[id]                  # Update plant
DELETE /api/plants/[id]                  # Delete plant
GET    /api/plants/export                # Export database to CSV

GET    /api/locations           # List locations with counts
POST   /api/locations           # Create location
PATCH  /api/locations/[id]      # Update location
DELETE /api/locations/[id]      # Delete location (if no plants)

GET    /api/plants/[id]/flowering        # Get flowering cycles
POST   /api/plants/[id]/flowering        # Create cycle
PATCH  /api/plants/[id]/flowering/[cycleId]  # Update cycle
DELETE /api/plants/[id]/flowering/[cycleId]  # Delete cycle

PATCH  /api/plants/[id]/location                  # Update plant location
PATCH  /api/plants/[id]/care-logs/[logId]      # Edit care log
```

---

## 📚 Documentation

- **Location Management:** `docs/LOCATION_MANAGEMENT.md`
- **Reproductive Phenology:** `docs/REPRODUCTIVE_PHENOLOGY.md`
- **Temporal Morphology:** `docs/TEMPORAL_MORPHOLOGY.md`
- **Engineer Manual:** `docs/CLADARI_ENGINEER_MANUAL.md`
- **Vision & Pipeline:** `docs/VISION_AND_PIPELINE.md`

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15.5.6 (App Router)
- **Database:** Prisma ORM + SQLite
- **UI:** React 19, TailwindCSS, Lucide Icons
- **Charts:** Recharts
- **TypeScript:** Full type safety

---

## 🎯 Roadmap

### Phase 1 (Complete) ✅
- Core plant database
- Location management with advanced metrics
- Flowering cycle tracking
- Temporal morphology
- Care logging with edit capabilities
- CSV export functionality
- Plant deletion with safety checks
- Smart filtering and sorting
- Stale plant alerts
- Elite genetics tracking

### Phase 2 (Next)
- Dashboard with fertility windows widget
- Pollen inventory management
- Cycle prediction algorithms
- Environmental correlation analytics

### Phase 3 (Future)
- Sensor integration for real-time data
- Automated environmental alerts
- LLM-powered breeding recommendations (Sovria integration)
- Photo upload and AI analysis
- Breeding program genetics calculator

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

**Built with 🌿 for professional plant breeding and conservation**
