# CLAUDE.md - Cladari Project Context

## What This Is
Cladari is a production plant database for managing a high-value Anthurium breeding collection (~70 plants, ~$15K value). Built for a serious breeding program focused on documented provenance, genetic transparency, and conservation.

## Tech Stack
- **Framework**: Next.js 15.5.6 (App Router)
- **Database**: Supabase Postgres + Prisma ORM
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (photos)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Location**: `plantDB/` is the app root

## Key Paths
```
plantDB/
├── prisma/
│   ├── schema.prisma          # ACTIVE SCHEMA (Postgres) - read this first
│   ├── schema.sqlite.backup   # Archived SQLite schema
│   └── dev.db                 # Legacy SQLite (archived, not used)
├── src/
│   ├── app/                   # Next.js App Router pages + API routes
│   │   ├── api/               # REST endpoints (all require auth)
│   │   │   ├── breeding/      # Breeding record API
│   │   │   ├── seed-batches/  # Seed batch API
│   │   │   ├── seedlings/     # Seedling API
│   │   │   ├── chat/          # AI chat endpoint (Claude Opus 4)
│   │   │   ├── chat-logs/     # AI conversation persistence (HITL)
│   │   │   ├── sensorpush/    # SensorPush API (sync, history)
│   │   │   ├── weather/       # Open-Meteo weather API
│   │   │   └── print/         # QR/label print APIs (plant-tag, location-tag)
│   │   ├── login/             # Supabase auth login page
│   │   ├── q/                 # QR redirect handler (/q/p/{id}, /q/l/{loc})
│   │   ├── plants/            # Plant management UI
│   │   ├── breeding/          # Breeding pipeline UI
│   │   ├── batch-care/        # Batch operations
│   │   └── dashboard/         # Analytics
│   ├── components/            # React components
│   └── lib/
│       ├── supabase/          # Supabase client utilities
│       │   ├── server.ts      # Server-side client (API routes)
│       │   └── client.ts      # Browser client (components)
│       ├── breeding-ids.ts    # ID generation utilities
│       ├── timezone.ts        # Timezone utilities (America/New_York default)
│       ├── qr.ts              # QR code generation (Tailscale URL encoding)
│       ├── zpl.ts             # Zebra ZPL templates for label printing
│       ├── sensorpush.ts      # SensorPush OAuth API client
│       ├── weather.ts         # Open-Meteo weather API (Fort Lauderdale)
│       └── ...                # Care algorithms, ML functions
├── scripts/                   # Migration and automation scripts
│   ├── migrate-to-supabase.ts      # Data migration script
│   ├── migrate-photos-to-supabase.ts # Photo storage migration
│   └── setup-rls-policies.sql      # Row Level Security policies
└── middleware.ts              # Auth middleware (protects routes)
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

## Current Version: v1.7.0 (Dec 15, 2025)

### Recently Completed
- **Supabase Migration** - Full production infrastructure (v1.7.0)
  - Database: SQLite → Supabase Postgres with pgvector extension enabled
  - Auth: Supabase Auth with email/password, middleware protection
  - Storage: 564 photos migrated to Supabase Storage with signed URLs
  - Multi-tenant ready: Profile model, userId on all primary entities
  - RLS policies prepared for future Swift app (direct Supabase SDK access)
  - Data migrated: 70 plants, 871 care logs, 17 chat logs, full breeding pipeline
- **HITL Quality Scoring** - Granular AI feedback for ML training (v1.6.3)
  - 0-4 quality scale with retrieval weight computation
  - SaveChatModal: Score, edit, and save AI responses
  - NegativeExample model: Bad responses stored separately for RLHF
  - Failure types: hallucination, missed_context, factual_error, etc.
  - Journal shows quality badges (color-coded 0-4)
- **Cross-plant context isolation** - AI chat resets between plants (v1.6.3)
- **SensorPush Integration** - Live environmental monitoring (v1.6.1)
  - Library: `/lib/sensorpush.ts` - OAuth API client with token caching
  - APIs: `/api/sensorpush/sync`, `/api/sensorpush/history`
  - Location UI shows "Live" badge, disables manual input for sensor-linked locations
  - 10-minute cron job syncs all sensors
- **Weather Integration** - Open-Meteo API for outdoor context (v1.6.1)
  - Library: `/lib/weather.ts` - Free API, Fort Lauderdale coords
  - API: `/api/weather` - Current + 7-day forecast
  - AI chat now receives weather + barometric pressure context
- **Plant Detail Refactor** - 9 tabs → 5 tabs (Overview, Journal, Photos, Flowering, Lineage)
- **AI Chat Logging** - Save conversations to Journal with HITL confidence tracking

### Queued Workstreams

**ML Vision Pipeline** (HIGH PRIORITY - Separate workstream)
- See `plantDB/docs/ML_VISION_PIPELINE.md` for full spec
- 5-stage pipeline: Segmentation → Feature Extraction → Temporal Alignment → Cross-Collection Reasoning → Knowledge Graph
- Models: SAM2, DINOv2, Florence-2
- Hardware: RTX 4090 on F2
- Purpose: Rigorous morphological analysis, not "good enough" similarity search

**pgvector Semantic Search** (IMPLEMENTED v1.7.1)
Full semantic search infrastructure:
- **Embedding service**: BGE-base-en-v1.5 via @xenova/transformers (768 dimensions)
- **Chunking**: ChatLogs split on `##` headers into semantic chunks
- **Chunk types**: damage_analysis, care_analysis, environmental, recommendation, observation, diagnosis, breeding, history, general
- **Auto-embedding**: New ChatLogs automatically chunked and embedded on save
- **Hybrid search API**: `/api/ml/semantic-search` with quality-weighted ranking
- **Backfill script**: `scripts/backfill-embeddings.ts` for existing ChatLogs

**Search usage:**
```bash
# Simple search
GET /api/ml/semantic-search?q=spider+mites&limit=10

# Advanced search (POST)
POST /api/ml/semantic-search
{
  "query": "yellowing leaves",
  "chunkTypes": ["damage_analysis", "diagnosis"],
  "minQuality": 3
}
```

---

## Current State (Dec 2025)
### Working Well
- **Semantic Search** (v1.7.1) - pgvector embeddings, quality-weighted retrieval, auto-chunking
- **Supabase Infrastructure** (v1.7.0) - Postgres, Auth, Storage all operational
- **HITL Quality Scoring** (v1.6.3) - 0-4 scoring, negative examples, retrieval weights
- **SensorPush Integration** (v1.6.1) - Live environmental monitoring, 10-min cron sync
- **Weather Integration** (v1.6.1) - Open-Meteo for outdoor conditions + AI context
- **Plant Detail** (v1.6.0) - 5 tabs: Overview, Journal, Photos, Flowering, Lineage
- **AI Chat Logging** (v1.6.3) - Save with quality scoring, edit capability, context isolation
- **AI Photo Analysis** (v1.5.0) - Claude Opus 4 with extended thinking
- **QR Code System** (v1.5.1) - Plant and location tags with quickcare flow
- **Timezone handling** (v1.5.1) - America/New_York, no more date bugs
- **Breeding pipeline** (v1.3.0) - Full cross tracking
- Care logging with EC/pH tracking
- Photo management with cover selection (564 photos in Supabase Storage)
- Batch care operations
- Dashboard analytics

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
- Zebra ZD421CN printer integration (ZPL templates ready)
- Batch print functionality (all plants in a location)

### Just Completed (Dec 10, 2025 - v1.6.0)

**Plant Detail Page Refactor:**
- Consolidated 9 tabs → 5 tabs (Overview, Journal, Photos, Flowering, Lineage)
- **Overview**: Health Metrics + AI Assistant + Quick Actions + Plant Details
- **Journal**: Unified timeline (care logs, notes, morphology, measurements, AI consultations)
- **Lineage**: Renamed from "breeding" - ancestry, progeny, breeding participation

**AI Chat Logging with HITL:**
- **ChatLog model**: Stores conversations with confidence tracking
- **Confidence levels**: unverified, verified, partially_verified, disputed
- **Manual save**: "Save" button preserves valuable conversations to Journal
- **API**: `/api/chat-logs` CRUD endpoints

**New Components:**
- `HealthMetrics.tsx` - ML predictions, substrate health, EC/pH trends
- `QuickActions.tsx` - One-click Water, Feed, Note, Photo buttons
- `JournalTab.tsx` - Unified timeline with type filters
- `JournalEntryModal.tsx` - Single modal with type selector
- `LineageTab.tsx` - Family tree display

### Previously (v1.5.1)

**QR Code Infrastructure:**
- Plant/Location QR codes with quickcare flow
- Print APIs (html/zpl/png formats)
- Tailscale URL encoding for mobile

**Timezone Standardization:**
- `/lib/timezone.ts` with America/New_York default
- Fixed date off-by-one bugs

### Previously Completed (Dec 5, 2025)
- **CloneBatch model** added to schema (CLB-YYYY-###)
- **API routes**: `/api/clone-batches` (CRUD complete)
- **UI**: `/batches` page with create modal, stats, list view
- Supports TC, CUTTING, DIVISION, OFFSET propagation types
- Links to source plant or external source
- Postgres schema synced

### Phase 2 Backlog: ML Improvements
**Substrate Health Analysis needs upgrade:**
Current: Snapshot of last 3 logs → threshold check
Needed: Time series since last repot → trend analysis

Should analyze:
- Input consistency (EC/pH variance over time)
- Output trend direction (acidifying? EC building?)
- Delta trend (gap widening or stabilizing?)
- Data density → confidence weighting

Example output: "Based on 12 readings over 8 weeks, 85% confidence substrate is acidifying at 0.15 pH/month. Consider CalMag buffer."

Infrastructure exists in `/lib/ml/` (healthTrajectory.ts, statisticalAnalyzer.ts) but not wired into recommendations.ts properly.

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
# From plantDB directory
npm run dev            # Dev server with hot reload (localhost:3000)

# From repo root (convenience scripts)
./scripts/dev          # Start dev server
./scripts/stop         # Stop background servers
./scripts/db studio    # Visual database editor (connects to Supabase)
./scripts/db generate  # Regenerate Prisma client after schema changes
```

**Environment Setup:**
- Copy `.env.example` to `.env` and fill in Supabase credentials
- Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Database URLs use Supabase connection pooler (port 6543 for app, 5432 for migrations)

## Testing Changes
```bash
# After schema changes
cd plantDB
npx prisma db push     # Push schema to Supabase Postgres
npx prisma generate    # Regenerate client

# Verify
npx prisma studio      # Visual inspection (opens in browser)

# Check build
npm run build          # Verify no TypeScript errors
```

**Auth Testing:**
- Login at `/login` with Supabase Auth credentials
- All API routes require authentication
- Middleware protects `/dashboard`, `/plants`, `/breeding`, etc.

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

### The Thesis: Stream Protocol

**Core insight**: "Authenticity isn't a state. It's a story."

Cladari implements **Layer 2 (Biological Biography)** of the three-layer Stream Protocol:

| Layer | Name | What It Does | Cladari Implementation |
|-------|------|--------------|------------------------|
| 1 | Genomic Identity | Foundational markers (DNA fingerprint) | Future: MinION sequencing |
| 2 | **Biological Biography** | Continuous documentation creates narrative | **NOW**: Care logs, photos, breeding pipeline, AI consultations |
| 3 | Coherence Verification | Pattern recognition catches inconsistencies | Future: ML Vision Pipeline |

**Why narrative beats snapshots**: Fakes can match a single photo or claim provenance. They cannot maintain coherent biological narratives over time. A plant with 2 years of documented care logs, EC/pH trends, flowering cycles, and AI consultations creates a story that counterfeiting cannot replicate.

**The breeding pipeline is verification infrastructure**:
```
Cross (CLX) → Harvest → SeedBatch (SDB) → Seedling (SDL) → Plant (ANT)
```
Each step in this chain is documented with timestamps, photos, and environmental context. This isn't just record-keeping - it's creating the "streaming authentication" that proves provenance.

**Why this guides development decisions**:
- Rich data capture (HITL scoring, AI consultations) > quick features
- Documentation depth > breadth of plants
- Layer 2 (narrative) must be solid before Layer 3 (ML coherence checking)
- Every feature should ask: "Does this add to the verification story?"

### Phased Roadmap

**Phase 1: Pro Web Tool (Now → 6 months)**
- ✅ Supabase Postgres + Auth (multi-tenant ready)
- ✅ Photo storage migration to Supabase Storage
- Finish breeding pipeline UI (harvest/seedling modals, graduation)
- pgvector semantic search for AI context retrieval
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

### Key Mobile Feature: QR Quick Log (IMPLEMENTED v1.5.1)
The mobile unlock isn't an app - it's frictionless data entry:
- **Plant QR**: Scan → opens plant page with quickcare modal auto-triggered
- **Location QR**: Scan "BALCONY" → batch care page with location pre-selected + all plants in that location auto-selected
- Walk past a bench, notice something, log it in 5 seconds
- Makes one-off VALUABLE data entry possible in real-time
- **Network**: Uses Tailscale IP (100.88.172.122) for phone → dev machine access
- **Next step**: Connect Zebra ZD421CN printer for physical tag printing

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

**Development philosophy**: Dave is a polymath systems-builder. Features should be robust and complete rather than rushed. The codebase serves as both production tool and learning infrastructure. When in doubt, prioritize data quality and verification depth over velocity.
