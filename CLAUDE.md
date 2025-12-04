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

### Still Pending
- Harvest modal UI (API complete)
- Seedling modal UI (API complete)
- Graduation workflow UI (API complete)

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

## Owner Context
Dave operates Cladari as an elite anthurium breeding program in Fort Lauderdale. Conservation focus, transparent documentation, anti-counterfeiting measures. Building toward becoming one of the highest quality breeders in the Americas within five years. This isn't a hobby app - it's infrastructure for a serious breeding operation.
