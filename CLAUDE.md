# CLAUDE.md - Cladari Project Context

---
## Production Safety Rules (CRITICAL — Feb 2026)

**Cladari has real users with irreplaceable data. Uptime and data integrity are non-negotiable.**

### Non-Negotiable Rules
1. **NEVER** use `prisma db push` in production — use `prisma migrate dev` for schema changes
2. **NEVER** drop or rename columns without a data-preserving migration
3. **NEVER** hard-delete user records — use soft delete (`isArchived`)
4. **ALWAYS** back up before schema migrations
5. **ALWAYS** test schema changes locally before applying to production
6. **ALWAYS** verify builds pass (`npm run build`) before pushing to main

### Migration Workflow
```bash
npx prisma migrate dev --name describe-change  # Create migration locally
# Review the generated SQL in prisma/migrations/
npm run build                                    # Verify no TypeScript errors
# Test locally against dev database
npx prisma migrate deploy                        # Apply to production
```

### Cascade Delete Awareness
- **Profile → ALL owned entities**: Deleting a Profile cascades to plants, locations, breeding records, vendors, clone batches
- **Plant → ALL child records**: Deleting a Plant cascades to care logs, photos, journal entries, flowering cycles, growth metrics, genetics, chat logs
- **Safe patterns**: Breeding lineage uses `SetNull` (genealogy preserved), breeding records use `Restrict` (can't delete parents)

### Admin Infrastructure
- `ADMIN_EMAILS` env var controls admin access (comma-separated emails)
- Admin "View As" feature in UserMenu for troubleshooting user accounts
- Admin user management: `DELETE /api/admin/users/[id]?mode=purge|revoke|delete-data`
  - `purge`: delete Supabase auth + Postgres Profile + all cascaded data
  - `revoke`: delete Supabase auth only (keep data for training)
  - `delete-data`: delete Postgres only (keep login ability)
- Admin user inspect: `GET /api/admin/users/[id]` — Profile + auth status + data counts
- **User deletion is two-system**: Supabase Auth (login) and Postgres Profile (data) are decoupled. Use the admin endpoint to handle both atomically.
- Beta feedback button sends Telegram notifications to admin

### Multi-Tenant Constraints (Fixed Feb 28, 2026)
- `Location.name` — `@@unique([userId, name])` (was global `@unique`, blocked users from common names)
- `Vendor.name` — `@@unique([userId, name])` (same fix)
- Auth callback handles email conflicts: when Google OAuth creates new UUID for existing email, migrates Profile + owned data to new UUID
- `DEMO_ACCOUNT_PASSWORD` env var — demo credentials moved out of source code

---
## Follow-Up: Domain Migration Cleanup (by March 5, 2026)

Domain migrated from `cladari.ai` → `cladari.co` on Feb 26, 2026. Old domains redirect via Vercel 308s. Once stable for a week, clean up these safety-net entries:

1. **Supabase Auth** → Authentication → URL Configuration → Remove:
   - `https://www.cladari.ai/auth/callback`
   - `https://www.cladari.ai/**`
2. **Google Cloud Console** → APIs & Services → Credentials → OAuth Client → Remove from Authorized JavaScript origins:
   - `https://cladari.ai`
   - `https://www.cladari.ai`
3. **Vercel Environment Variables** → Confirm `NEXT_PUBLIC_QR_BASE_URL=https://cladari.co` is set

---

## Sprint Status

**Backlog Clearing Sprint** (Dec 27, 2025 – Feb 16, 2026) — **COMPLETE**

### Completed This Sprint
- ✅ ML predictor try-catch (P1 security)
- ✅ Chat API input validation (P1 security)
- ✅ Harvest modal UI (create + edit + delete)
- ✅ Seed batch modal UI (create + edit + delete)
- ✅ Seedling modal UI + graduation workflow
- ✅ Clone batch graduation with data transfer (care logs + photos)
- ✅ Breeding record photo upload UI
- ✅ pH/EC field ordering standardized platform-wide
- ✅ Baseline feed centralized (`constants.ts`)
- ✅ Note button fixed (freeform notes)
- ✅ Division batch lineage display
- ✅ Production Vercel env var restoration

### Beta Onboarding Sprint (Feb 28, 2026)
- ✅ Multi-tenant unique constraints (Location.name, Vendor.name scoped per user)
- ✅ Auth callback email conflict recovery (Profile UUID migration)
- ✅ Admin user deletion endpoint (purge/revoke/delete-data modes)
- ✅ Location API error messaging (P2002/P2003 → user-friendly messages)
- ✅ Demo account credentials moved to .env (GitGuardian compliance)
- ✅ Sovria® trademark on marketing page
- [ ] Admin dashboard UI (`/(admin)` routes — user management, activity feed, feedback inbox)
- [ ] Email allowlist / registration gating (post-beta)

### Still Open (Carry to Next Sprint)
- [ ] Multi-tenant SensorPush credentials
- [ ] Apply RLS policies from `scripts/setup-rls-policies.sql`
- [ ] Standardize Prisma error responses
- [ ] Connect taxa embeddings to AI chat
- [ ] Location sensor management UI
- [ ] Batch print functionality
- [ ] SWP vs top watering tracking
- [ ] Autocomplete/search for text fields

### Marketing Site Updates (Feb 18, 2026)
- ✅ **Homepage restructure** — Progressive disclosure: Declare → Guide → Deep Dive
  - Hero: "We're losing biological knowledge faster than we're creating it"
  - Problem section: Condensed to 3 one-liner cards
  - How It Works: 4 expandable accordion cards (useState toggle)
  - Platform: Tabbed interface with segmented control (3 tabs)
  - Sovria teaser: Condensed to centered single-paragraph block
  - Research questions: Auto-rotating carousel (6s interval)
- ✅ **Breeder-focused block** added between How It Works and Platform
- ✅ **Typography overhaul** — Lora (serif) + Outfit (sans)
  - History: DM Sans + Instrument Serif → Fraunces + Outfit → **Lora + Outfit** (current)
  - Fraunces dropped due to ornamental distortion at display sizes (optical size axis)
  - Typography shared with sovria.com for brand consistency
- ✅ **Sovria.com rebuilt** — Complete pivot from $50K hardware product to domain-specific AI infrastructure positioning. See `/Users/davidchinnici/sov-web/CLAUDE.md` for details.

---

## What This Is
Cladari is a production plant database for managing a high-value Anthurium breeding collection (~70 plants, ~$15K value). Built for a serious breeding program focused on documented provenance, genetic transparency, and conservation.

## Tech Stack
- **Framework**: Next.js 15.5.6 (App Router)
- **Database**: Supabase Postgres + Prisma ORM
- **Auth**: Supabase Auth (Google OAuth + email/password)
- **Storage**: Supabase Storage (photos)
- **Hosting**: Vercel (production: www.cladari.co)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Typography**: Lora (serif headings) + Outfit (sans body) via `next/font/google`
- **Structure**: Monorepo (consolidated Dec 21, 2025)

## Emergency Recovery
**Monorepo consolidation backup (Dec 21, 2025):**
```
/Users/davidchinnici/cladari-backup-20251221/
```
Contains full pre-merge state if rollback needed.

## Key Paths
```
cladari/                          # Monorepo root
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
│   │   │   ├── chat/          # AI chat endpoint (Opus 4 + quick actions + context modes + stress analysis)
│   │   │   ├── chat-logs/     # AI conversation persistence (HITL + auto-embedding)
│   │   │   ├── ml/            # ML endpoints (semantic-search, diagnose, predict-care)
│   │   │   ├── taxa/          # Taxon reference API (IAS species data)
│   │   │   ├── sensorpush/    # SensorPush API (sync, history, sensors)
│   │   │   ├── weather/       # Open-Meteo weather API
│   │   │   └── print/         # Label print APIs (zebra, plant-tag, location-tag)
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
│       └── ml/                # Machine learning modules
│           ├── embeddings.ts  # BGE embedding service (768d pgvector)
│           ├── chunker.ts     # ChatLog semantic chunking
│           └── ...            # Statistical analyzers, predictors
├── scripts/                   # Migration and automation scripts
│   ├── migrate-to-supabase.ts      # Data migration script
│   ├── migrate-photos-to-supabase.ts # Photo storage migration
│   ├── print-proxy.ts              # Local print proxy (Tailscale Funnel)
│   ├── scrape-ias-taxa.ts          # IAS species scraper (154 Anthurium species)
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

## Current Version: v1.7.9 (Dec 27, 2025)

### Recently Completed
- **Telegram Daily Care Notifications** (Dec 27, 2025)
  - **Telegram Bot Integration** (`src/lib/telegram.ts`):
    - CladariCareBot sends daily digest at 8am EST
    - HTML-formatted messages with plant care priorities
    - `sendTelegramMessage()`, `formatDailyDigest()` functions
  - **Daily Digest API** (`/api/notifications/daily-digest`):
    - Queries plants by care status using dynamic thresholds
    - Categories: overdue (red), due today (yellow), healthy (green)
    - Protected by CRON_SECRET for production
  - **Vercel Cron**: Configured at `0 13 * * *` UTC (8am EST)
  - **Environment Variables**:
    - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NOTIFY_USER_ID`
  - **Future**: Add SensorPush environmental alerts, PWA push notifications

- **IAS Taxon Reference System + Embeddings** (Dec 27, 2025)
  - **TaxonReference model**: Full morphometric schema for species data
    - Taxonomy: genus, species, section, authority, type specimen
    - Measurements: blade, spadix, spathe, petiole dimensions (JSON ranges)
    - Ecology: habit, distribution, elevation, habitat
    - ML-ready: pgvector embedding field, verification status
  - **IAS Scraper** (`scripts/scrape-ias-taxa.ts`):
    - Parses International Aroid Society species descriptions
    - Extracts structured data from botanical text (measurements, traits)
    - Handles SSL issues with curl fallback
    - **154 species scraped** across 15 sections
  - **Taxa Embeddings** (`scripts/embed-taxa.ts`):
    - BGE-base-en-v1.5 embeddings (768 dimensions, same as ChatLog)
    - Rich text: taxonomy + morphometrics + colors + traits + descriptions
    - **147 taxa embedded** (ready for semantic search)
  - **Taxa API Endpoints**:
    - `GET /api/taxa` - List with filtering (species, section, source, genus)
    - `GET /api/taxa/[species]` - Full details + related taxa + matching plants
    - `PATCH /api/taxa/[species]` - HITL verification workflow
  - **Status**: Infrastructure complete, NOT YET WIRED to AI chat
  - **Next step**: Design context-aware injection (see `docs/TAXA_INTEGRATION_DESIGN.md`)
  - **Future sources**: MOBOT, Tropicos, iNaturalist (same schema, different source)
  - **CRITICAL DATA GAP** (identified Dec 27, 2025):
    - IAS scrape heavily weighted toward obscure Panamanian species
    - **Cardiolonchium section: only 5 species** (crystallinum, dressleri, papillilaminum, folsomianum, cerrocampanense)
    - **Missing key horticultural species**: forgetii, portillae, warocqueanum, magnificum, regale, clarinervium, luxurians, etc.
    - This is the MOST IMPORTANT section for ornamental breeding - needs priority data sourcing
    - Root cause: IAS data based on Croat's Panama monographs, misses Mexican/Colombian species

- **P1 Defensive Fixes + Dynamic UI** (Dec 24, 2025)
  - **Dynamic Urgency Colors**: Plant cards now use plant-specific watering thresholds
    - Uses `care-thresholds.ts` which calculates 1.3x (yellow) and 1.7x (red) of average interval
    - Shows `(~4.2d avg)` hint for plants with ≥3 care events
    - Falls back to static 5/7 days for new plants
  - **Chat API Input Validation**: Validates messages array, role, content before processing
    - Catches malformed JSON, missing messages, invalid structure
    - Returns 400 with clear error messages instead of 500
  - **ML Predictor Graceful Degradation**: Each predictor wrapped in try-catch
    - Watering, health, and flowering predictors fail independently
    - Response includes `predictorStatus` to indicate which succeeded/failed
    - Partial results returned instead of 500ing entire request
  - **Bug List Cleanup**: Verified and marked #2, #7, #10 as fixed
  - **GitHub Cleanup**: Removed "CLAUDE READ" folder from tracking, updated .gitignore

- **AI Chat Quick Actions + Photo Context Classification** (v1.7.8)
  - **Quick Action Templates**: Four pre-configured analysis modes
    - 📊 **Substrate** - EC/pH trends, no photos (fast, cheap)
    - 👁️ **Visual** - Quick health check, 3 photos
    - 📈 **Progress** - Growth over time, 10 photos chronologically
    - 📋 **Full Report** - Comprehensive analysis, 20 photos
  - **Freestyle Mode**: Toggle for multi-turn deep-dive conversations
  - **Dynamic Photo Context**: Two-tier classification system for ML pipeline
    - Tier 1 (anatomy): whole_plant, leaf, petiole, spathe, spadix, stem, cataphyll, base, roots
    - Tier 2 (intent): Dynamic options based on type (emergent, unfurling, pest_evidence, damage, etc.)
    - AI receives context hints: "Type: leaf, Context: pest_evidence"
  - **Photo limit fix**: Progress mode now correctly sends 10 photos (was sending 20)
  - **Per-turn Copy/Save**: Inline buttons on each AI response for HITL scoring
  - **Improved welcome message**: Dynamic capabilities display based on available data
  - **Queued: Temporal Segmentation** - LocationHistory model, epoch boundaries for repots/treatments

- **Enhanced Environmental Stress Analysis + Opus 4 Restoration** (v1.7.7)
  - **Switched AI back to Opus 4** from Sonnet 4 after inadequate leaf damage analysis
  - **Enhanced `getEnvironmentalHistory()`** in chat API:
    - Increased sample window from 7 → 14 days
    - Increased sample limit from 200 → 500 readings
    - Added stress event detection: LOW_RH (<55%), HIGH_VPD (>1.3), temp extremes
    - Daily summaries now show min/max ranges, not just averages
    - Days with stress events flagged with ⚠️
    - Trend analysis: humidity/VPD rising/falling/stable over period
    - Worst readings with timestamps for correlation with care events
  - **New stress thresholds** configurable at top of chat route
  - AI chat now receives granular data to correlate leaf damage with environmental events

- **v1.7.6** - Monorepo consolidation, Tailscale print proxy, pot sticker label layout
- **v1.7.5** - Unified "Breed" navigation, flowering event picker, clone batch photo upload, multi-plant graduation fix
- **v1.7.4** - Production deployment (www.cladari.co), Google OAuth, training data export
- **v1.7.3** - Plant diary export, Zebra printing, rain-adjusted watering predictor (TUNABLE HYPOTHESES in `wateringPredictor.ts`)
- **v1.7.2** - Mobile PWA fixes, Supabase Storage photo upload, EXIF rotation handling
- **v1.7.1** - pgvector semantic search (BGE-base-en-v1.5, 768d), auto-embedding ChatLogs, hybrid search API
- **v1.7.0** - Supabase migration (SQLite → Postgres), Auth, Storage, multi-tenant, pgvector enabled
- **v1.6.3** - HITL quality scoring (0-4 scale), negative examples for RLHF, cross-plant context isolation
- **v1.6.1** - SensorPush integration (OAuth, 10-min cron sync), Weather integration (Open-Meteo)
- **v1.6.0** - Plant detail refactor (9→5 tabs), AI chat logging with HITL confidence

### Queued Workstreams

**ML Vision Pipeline** (HIGH PRIORITY - Separate workstream)
- See `plantDB/docs/ML_VISION_PIPELINE.md` for full spec
- **Component 0: Taxon Reference System** - Species/cultivar reference database with verified photos and diagnostic traits. Enables AI to compare against YOUR verified specimens, not just general training data. Data sources: your collection, iNaturalist, MOBOT/Tropicos, GBIF.
- 5-stage pipeline: Segmentation → Feature Extraction → Temporal Alignment → Cross-Collection Reasoning → Knowledge Graph
- Models: SAM2, DINOv2, Florence-2
- Hardware: RTX 4090 on F2
- Purpose: Rigorous morphological analysis, not "good enough" similarity search

**Voice Memo Import** (MEDIUM PRIORITY - Quality of life)
- See `plantDB/docs/VOICE_MEMO_IMPORT.md` for full spec
- **Calm tech vision**: Speak while doing care, data appears in PlantDB
- Pipeline: Audio capture → F2 Whisper transcription → LLM parsing → Care log API
- Infrastructure exists: Whisper on F2:8085, Care Log APIs, Opus4 for parsing
- **Phase 1**: Batch processing (end-of-day review) — 4-6 hours
- **Phase 2**: PWA voice button (real-time) — 8-12 hours
- **Phase 3**: Ambient lav mic mode — 20-30 hours
- Start with Phase 1 to validate Whisper quality on botanical vocabulary

**Sovria Component Harvest** (MEDIUM PRIORITY - ML infrastructure)
- Extract reusable ML components from ~/f1sovria for Cladari batch pipelines
- **embedding_strategy.py** (506 lines) — Multi-modal embedding engine
- **ingestion_pipeline.py** (836 lines) — Multi-source data adapters
- **realtime_query_api.py** (700 lines) — Semantic search patterns
- **LoRA training framework** — For plant-specific model fine-tuning
- Purpose: Offline batch ML pipeline on F2, reports back to Supabase

**pgvector Semantic Search** (IMPLEMENTED v1.7.1) — See version history above. Search API: `GET/POST /api/ml/semantic-search`

---

## Current State (Dec 2025)
### Working Well
- **Production Live** (v1.7.4) - www.cladari.co on Vercel, Google OAuth, multi-tenant
- **Mobile PWA** (v1.7.2) - Viewport locked, safe area padding, scroll containment
- **Photo Upload** (v1.7.2) - All uploads go to Supabase Storage, EXIF rotation handling (~696 photos)
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
- Photo management with cover selection (~600 photos in Supabase Storage)
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

### Still Pending
- Batch print functionality (all plants in a location)
- Standard 2"x1" label templates (need labels)
- Multi-tenant printing strategy (different printers per user)
- Tag label redesign (pot stickers vs plant tags)
- SWP vs top watering care method tracking per plant
- Autocomplete/search to prevent text field misspellings
- Future event alerts/reminders system

### Queued Enhancements (Dec 17, 2025)

**Location Sensor Management UI**
- Location edit modal: Add sensor dropdown to link/unlink SensorPush sensors
- API ready: `GET /api/sensorpush/sensors` returns all sensors with latest readings + linked status
- Show sensor name + last reading in dropdown
- Manual temp/humidity input as fallback when no sensor linked
- "Unlink sensor" option to clear sensorPushId

**Location History Tracking** (identified via HITL feedback)
- Track when plants move between locations
- Enable historical environmental correlation
- Critical for: stress analysis, breeding performance, ML training

Proposed schema:
```prisma
model LocationHistory {
  id         String   @id @default(cuid())
  plant      Plant    @relation(fields: [plantId], references: [id])
  plantId    String
  location   Location @relation(fields: [locationId], references: [id])
  locationId String
  movedAt    DateTime @default(now())
  movedFrom  String?  // Previous location name for quick reference
  notes      String?  // Reason for move
}
```

Use case: "Where was ANT-2025-0016 from Dec 10-17?" → Query LocationHistory → Match to sensor data for each period → Calculate weighted environmental exposure

### Zebra Printer Setup
**Hardware**: Zebra ZD421CN-300dpi via macOS CUPS (`lp` command)
- **Local dev**: `/api/print/zebra` calls `lp` directly
- **Production**: Forwards to `scripts/print-proxy.ts` via Tailscale Funnel (`https://f1.tail2ea078.ts.net/print`)
- **UI**: Plant detail menu → "Print Label", Locations page → printer icon
- **Labels**: Pot sticker 57x32mm (production), Plant tag 2"x1" (templates ready, need labels)
- **Templates**: `src/lib/zpl.ts` — `generatePotStickerZPL()`, `generatePlantTagZPL()`

### Key Components
- `HealthMetrics.tsx` - ML predictions, substrate health, EC/pH trends
- `QuickActions.tsx` - One-click Care, Flower, Note, Photo buttons
- `JournalTab.tsx` - Unified timeline with type filters
- `LineageTab.tsx` - Family tree display with clone batch origin support

### Phase 2 Backlog: ML Improvements
- **Rain-adjusted watering**: Current HYPOTHETICAL thresholds in `src/lib/ml/wateringPredictor.ts`. Needs learned correlations from care data + precipitation history.
- **Substrate health analysis**: Current snapshot (last 3 logs) → needs time series since last repot with trend analysis. Infrastructure in `/lib/ml/` (healthTrajectory.ts, statisticalAnalyzer.ts) not yet wired to recommendations.ts.

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

## Development Gotchas (Lessons Learned)

**AI SDK v4 Message Format** (Dec 2025)
- The `useChat` hook sends messages with `parts` array, NOT `content` string
- When validating chat API input, accept BOTH formats:
  ```typescript
  const hasContent = typeof msg.content === 'string' || Array.isArray(msg.content);
  const hasParts = Array.isArray(msg.parts);
  if (!hasContent && !hasParts) { /* reject */ }
  ```
- Lesson: Always test API validation with the actual client format, not just raw API format

**Vercel Environment Variables**
- Local `.env` files do NOT sync to Vercel production
- After project reconnection or fresh deploy, verify env vars exist: `vercel env ls`
- Critical vars: ANTHROPIC_API_KEY, DATABASE_URL, SUPABASE_* keys
- Missing env vars cause silent failures that look like code bugs

**SensorPush API Limitations**
- No stats/summary endpoint - only raw `/samples` with ~5MB limit
- Returns oldest samples first, truncates recent data if limit hit
- No webhooks - designed for historical queries, not real-time
- Solution: Query in 2-day windows to ensure recent data coverage

**Documentation Hygiene (The Documentation Contract)**
- **ALWAYS update all 5 docs together** when bumping versions or adding features:
  1. `CLAUDE.md` - Version header + Recently Completed section
  2. `docs/CLADARI_ENGINEER_MANUAL.md` - Version + What's Working + Recent Improvements
  3. `OPERATOR_MANUAL.md` - Version + new feature sections for user-facing changes
  4. `CHANGELOG.md` - New version entry with Added/Changed/Fixed/Technical sections
  5. `README.md` - Version badge + features list + version history table
- **Commit all doc updates atomically** in a single commit (e.g., `docs: update all documentation for vX.Y.Z`)
- **Why this matters**: Documentation fragmentation causes confusion for humans and AI assistants. When CLAUDE.md says v1.7.9 but README says v1.7.5, context is unreliable.
- **The contract**: The Documentation Index table (below) defines which files update for which changes. Treat it as a checklist.
- **Quick check**: After any feature commit, ask "Did I update the docs?" If version bumped, all 5 files must change.

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

## Documentation Index

**When updating documentation after commits, update these files:**

### Root Level (plantDB/)
| File | Purpose | Update When |
|------|---------|-------------|
| `CLAUDE.md` | AI context, version history, architecture | Every version bump, major features |
| `OPERATOR_MANUAL.md` | End-user guide | UI changes, new features |
| `CHANGELOG.md` | Version history | Every release |
| `INTEGRATION.md` | Sovria/MCP integration | API changes, infrastructure |
| `README.md` | Project overview | Major milestones |

### docs/ Folder
Feature-specific docs in `docs/`: `CLADARI_ENGINEER_MANUAL.md`, `NEXT_SESSION_BUGS.md`, `DEFERRED_TASKS.md`, `ML_VISION_PIPELINE.md`, `LOCATION_MANAGEMENT.md`, `REPRODUCTIVE_PHENOLOGY.md`, `UNIFIED_JOURNAL_DESIGN.md`, and others. Archive in `docs/archive/`.

### Quick Update Checklist
After version bumps: update CLAUDE.md, OPERATOR_MANUAL.md, CHANGELOG.md, CLADARI_ENGINEER_MANUAL.md, README.md atomically.

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
- ✅ pgvector semantic search for AI context retrieval
- ✅ QR code scanning → quick care logging
- ✅ PWA for mobile access
- ✅ **Production deployment** (www.cladari.co on Vercel)
- ✅ **Google OAuth** (one-click sign in)
- ✅ **Training data pipeline** (HITL export for fine-tuning)
- Finish breeding pipeline UI (harvest/seedling modals, graduation)
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

### Key Mobile Feature: QR Quick Log (v1.5.1)
- **Plant QR**: Scan → opens plant page with quickcare modal
- **Location QR**: Scan → batch care page with location pre-selected
- 5-second data entry while doing care rounds

### Market Position
- **Pro tool + B2B**, not consumer (no Planta/Greg competition)
- Blue ocean: nobody does breeding pipeline well
- Rich data for ML > shallow watering reminders

## Owner Context

Dave operates Cladari as an elite anthurium breeding program in Fort Lauderdale. Conservation focus, transparent documentation, anti-counterfeiting measures. Building toward becoming one of the highest quality breeders in the Americas within five years.

**Bigger picture**: Cladari is the first implementation of the Stream Protocol (see `CLAUDE READ/Authenticity 5.1.md`). PlantDB is infrastructure for biological verification that may expand to other domains. VA Collective is the meta-framework. This isn't a hobby app - it's proof of concept for verification infrastructure.

**Development philosophy**: Dave is a polymath systems-builder. Features should be robust and complete rather than rushed. The codebase serves as both production tool and learning infrastructure. When in doubt, prioritize data quality and verification depth over velocity.
