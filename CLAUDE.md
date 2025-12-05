# CLAUDE.md - Cladari Project Context

## What This Is
Cladari is a production plant database for managing a high-value Anthurium breeding collection (~70 plants, ~$15K value). Built for a serious breeding program focused on documented provenance, genetic transparency, and conservation.

## Tech Stack
- **Framework**: Next.js 15.5.6 (App Router)
- **Database**: SQLite + Prisma ORM (Postgres-ready schema exists)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Location**: `plantDB/` is the app root

## Key Paths
```
plantDB/
├── prisma/
│   ├── schema.prisma          # ACTIVE SCHEMA - read this first
│   ├── schema.postgres.prisma # Future migration target
│   └── dev.db                 # SQLite database
├── src/
│   ├── app/                   # Next.js App Router pages + API routes
│   │   ├── api/               # REST endpoints
│   │   │   ├── breeding/      # Breeding record API
│   │   │   ├── seed-batches/  # Seed batch API
│   │   │   └── seedlings/     # Seedling API
│   │   ├── plants/            # Plant management UI
│   │   ├── breeding/          # Breeding pipeline UI
│   │   ├── batch-care/        # Batch operations
│   │   └── dashboard/         # Analytics
│   ├── components/            # React components
│   └── lib/
│       ├── breeding-ids.ts    # ID generation utilities
│       └── ...                # Care algorithms, ML functions
├── mcp-server/                # MCP server for AI integration
├── public/uploads/            # Photo storage
└── scripts/                   # Automation scripts
```

## Naming Conventions
- **Plant IDs**: `ANT-YYYY-####` (e.g., ANT-2025-0036)
- **Cross IDs**: `CLX-YYYY-###` (e.g., CLX-2025-001)
- **Seed Batch IDs**: `SDB-YYYY-###` (e.g., SDB-2025-001)
- **Seedling IDs**: `SDL-YYYY-####` (graduate to ANT when accessioned)
- **Database**: snake_case for raw SQL, camelCase for Prisma models
- **Components**: PascalCase React components
- **API routes**: kebab-case paths
- **ID Generation**: `src/lib/breeding-ids.ts` for all ID generation

## Current State (Dec 2025)
### Working Well
- Plant CRUD with full detail pages (7 tabs)
- Care logging with EC/pH tracking
- Photo management with cover selection
- Batch care operations
- Dashboard analytics
- MCP server integration
- **Breeding pipeline** (v1.3.0) - Full cross tracking

### Breeding Module (v1.3.0 - Implemented)
Full pipeline tracking from pollination to accessioned plants:
```
Cross (CLX-YYYY-###) → Harvest → SeedBatch (SDB-YYYY-###) → Seedling (SDL-YYYY-####) → Plant (ANT-YYYY-####)
```

**Schema Models**: BreedingRecord, Harvest, SeedBatch, Seedling
**API Routes**:
- `/api/breeding` and `/api/breeding/[id]` - Cross management
- `/api/breeding/[id]/harvests` - Harvest tracking
- `/api/seed-batches` and `/api/seed-batches/[id]` - Seed batch CRUD
- `/api/seedlings` and `/api/seedlings/[id]` - Seedling management
- `/api/seedlings/[id]/graduate` - Graduation workflow

**UI**: `/breeding` page with expandable cross cards, pipeline visualization

**Key Features**:
- Cross categories: INTRASPECIFIC, INTERSPECIFIC, INTERSECTIONAL (auto-detected)
- Multiple harvests per cross (berries ripen in waves)
- Germination tracking: substrate, temp, humidity, emergence
- Selection philosophy: Max 5 keepers + 2 holdbacks per batch
- Seedlings graduate to Plant table when formally accessioned
- Full lineage: femaleParentId, maleParentId, breedingRecordId
- Asexual lineage: cloneSource/clones for offsets, TC, divisions
- Generation tracking: F1, F2, S1, BC1, etc.

### Still Pending (Phase 1 Priorities)
- Harvest modal UI (API complete)
- Seed batch modal UI (API complete)
- Seedling modal UI (API complete)
- Graduation workflow UI (API complete)
- QR code generation per plant
- QR scan → quick care log flow
- Postgres migration for production
- Auth layer (Clerk/Supabase) for multi-tenant

## Domain Context: Anthurium Breeding

### Key Terminology
- **Spadix**: The spike bearing tiny flowers (what gets pollinated)
- **Spathe**: The colorful "flower" (actually a modified leaf)
- **Protogynous**: Female-receptive before male pollen release
- **Intersectional**: Crosses between different taxonomic sections (harder, more interesting)
- **F1, F2, etc.**: Filial generations from a cross
- **Selfing (S1)**: Pollinating a plant with its own pollen

### Sections in Collection
Cardiolonchium, Pachyneurium, Porphyrochitonium, Xialophyllum, and others. Intersectional crosses are flagged.

### Breeder Codes
- TZ = Tezula Plants (Daryl)
- SC = Scott Cohen
- EPP = Eddie Pronto
- NSE = NSE Tropicals
- SKG = Silver Krome Gardens lineage

## Code Style Preferences
- Prefer explicit over clever
- Use Prisma's type safety fully
- Keep API routes thin, business logic in lib/
- Toast notifications for user feedback
- No Google Fonts (offline builds must work)

## What NOT To Do
- Don't modify Plant model structure without discussion
- Don't delete migrations - keep them reversible during dev
- Don't assume network access (builds should work offline)
- Don't add external dependencies without justification
- Don't hardcode IDs or magic strings

## Running the Project
```bash
# From repo root
./scripts/dev          # Dev server with hot reload
./scripts/stop         # Stop background servers
./scripts/db studio    # Visual database editor
./scripts/db generate  # Regenerate Prisma client after schema changes
```

## Testing Changes
```bash
# After schema changes
npx prisma db push     # Push to dev.db (no migration)
npx prisma generate    # Regenerate client

# Verify
npx prisma studio      # Visual inspection
```

## Before Committing
1. Run `npx prisma validate` to check schema
2. Test affected API routes
3. Verify UI still renders
4. Check for TypeScript errors

## Getting Help
- OPERATOR_MANUAL.md - User guide
- INSTRUCTION_MANUAL.md - Day-to-day operations  
- DB_QUICK_REFERENCE.md - Database commands
- CHANGELOG.md - Version history and recent changes

## Strategic Direction (Dec 2025)

### What We're Building
A **pro breeding/growing intelligence platform**, not a consumer plant care app.

**Decided against**: Native mobile app, consumer market, competing with Planta/Greg.
**Decided for**: Web-first PWA, serious breeders/growers, B2B path to commercial operations.

### The Thesis
This is Layer 2 (Biological Biography) of the Stream Protocol - verification through continuous narrative rather than point-in-time snapshots. The breeding pipeline (Cross → Harvest → SeedBatch → Seedling → Plant) creates the documented lineage that proves provenance.

### Phased Roadmap

**Phase 1: Pro Web Tool (Now → 6 months)**
- Finish breeding pipeline UI (harvest/seedling modals, graduation)
- Deploy with Postgres + auth (multi-tenant ready)
- QR code scanning → quick care logging (key mobile feature)
- PWA for mobile access (add to homescreen works now)
- Alpha test with 5-10 serious breeders

**Phase 2: ML Layer (6-12 months)**
- Vector embeddings on care/growth/breeding data
- Pattern detection across environmental conditions
- Germination prediction, trait correlation
- Insights humans don't see

**Phase 3: Commercial (12-18 months)**
- Nursery/commercial operation pilots (Urban Roots, etc.)
- Connect actions to financials (cost per plant, time to market)
- ROI dashboards ("this protocol saved $X")
- Enterprise pricing

### Key Mobile Feature: QR Quick Log
The mobile unlock isn't an app - it's frictionless data entry:
- QR code on plant tag → opens plant bio page
- Quick action buttons: water, fertilize, note, photo
- Walk past a bench, notice something, log it in 5 seconds
- Makes one-off VALUABLE data entry possible in real-time

### Why Not Consumer App
- Red ocean market (Planta, Greg, etc.)
- Shallow data (watering reminders) doesn't train useful ML
- Consumer revenue ceiling ~$2K/month even if successful
- Distraction from core thesis (verification, breeding intelligence)

### Why Pro Tool + B2B
- Blue ocean (nobody does breeding pipeline well)
- Rich data (crosses, harvests, conditions, outcomes)
- Commercial ops will pay $500/month for breeding cycle optimization
- Data quality > data quantity for ML training

## Owner Context
Dave operates Cladari as an elite anthurium breeding program in Fort Lauderdale. Conservation focus, transparent documentation, anti-counterfeiting measures. Building toward becoming one of the highest quality breeders in the Americas within five years.

**Bigger picture**: Cladari is the first implementation of the Stream Protocol (see `CLAUDE READ/Authenticity 5.1.md`). PlantDB is infrastructure for biological verification that may expand to other domains. VA Collective is the meta-framework. This isn't a hobby app - it's proof of concept for verification infrastructure.
