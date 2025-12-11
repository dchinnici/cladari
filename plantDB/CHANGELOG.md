# Changelog

All notable changes to the Cladari Plant Management System will be documented in this file.

## [1.6.1] - 2025-12-11

### Added
- **SensorPush Integration** - Live environmental monitoring from SensorPush sensors
  - **Library**: `/lib/sensorpush.ts` - Full OAuth API client with token caching
  - **Schema**: Added `sensorPushId` field to Location model for sensor mapping
  - **Sync API**: `/api/sensorpush/sync` - Updates all mapped locations with latest readings
    - GET: Sync all mapped locations
    - POST: Map a sensor to a location
    - DELETE: Unmap a sensor
  - **History API**: `/api/sensorpush/history` - Fetch historical sensor data
    - Query params: locationId, sensorId, hours, limit
    - Returns samples with calculated stats (min/max/avg)
  - **Location UI**: "Live" badge with Radio icon for sensor-linked locations
    - Sensor data displayed in emerald green
    - Fields disabled in edit modal when sensor-linked (prevents manual override)
  - **Cron job**: Every 10 minutes syncs sensors + refreshes weather

- **Weather Integration** - Open-Meteo API for outdoor conditions context
  - **Library**: `/lib/weather.ts` - Free API, no key required
  - **Fort Lauderdale coordinates**: 26.1276, -80.1440 (445 N Andrews Ave)
  - **Weather API**: `/api/weather` - Current conditions + 7-day forecast
    - GET: Returns cached data (15 min freshness)
    - POST: Force refresh (called by cron)
  - **WMO weather codes**: Full mapping (clear, cloudy, rain, fog, thunderstorm, etc.)
  - **Formatted output**: "Overcast, 72°F (feels 69°F), Wind 10mph NW, UV 4.2"

- **AI Context Enhancement** - Environmental + weather data for smarter analysis
  - **Location sensor history**: 7-day stats + daily averages passed to AI
  - **Outdoor conditions**: Barometric pressure from balcony sensor (global)
  - **Weather context**: Current conditions + 3-day forecast
  - **Correlation capability**: AI can now explain "100% humidity = rain vs fog vs dew"

- **Section Addition**: Added Leptanthurium to plant overview section dropdown

### Changed
- **Locations page**: Shows live sensor data with last sync timestamp
- **AI Chat**: Now receives environmental history and weather context automatically

### Technical
- New Prisma field: `Location.sensorPushId` (optional String)
- SensorPush OAuth tokens cached in memory (1 hour TTL)
- Weather data cached 15 minutes, refreshed every 10 by cron
- Barometric pressure sourced globally from outdoor sensor (calibration noise between sensors)

### Sensor Mappings
| Sensor | Location(s) |
|--------|-------------|
| Balcony OUTDOOR | Balcony (+ global pressure source) |
| Anthurium Shelf | Grow Center 1 (loft) |
| Grow Tent | Grow Tent 1 |
| Bedroom Plant Shelf | Grow Center 2 (main floor), Ambient Display |

## [1.6.0] - 2025-12-10

### Added
- **Plant Detail Page Refactor** - Consolidated 9 tabs into 5 focused tabs
  - **Overview**: Now includes Health Metrics (ML predictions), AI Assistant (embedded), Quick Actions, Plant Details
  - **Journal**: NEW unified timeline combining care logs, notes, morphology, measurements, and AI consultations
  - **Photos**: Unchanged
  - **Flowering**: Unchanged
  - **Lineage**: Renamed from "breeding" - shows ancestry, progeny, breeding participation

- **AI Chat Logging with HITL** - Save valuable AI consultations to plant journal
  - **ChatLog model**: Stores full conversation with confidence tracking
  - **Manual save**: "Save" button in AI Assistant to preserve conversations
  - **Confidence levels**: unverified, verified, partially_verified, disputed
  - **User edits tracking**: Record corrections to AI responses
  - **Journal integration**: AI consultations appear in Journal tab with purple styling
  - **Expandable view**: Click to expand/collapse full conversation

- **New Components**
  - `HealthMetrics.tsx` - ML predictions, substrate health, alerts, EC/pH trends
  - `QuickActions.tsx` - One-click Water, Feed, Note, Photo buttons
  - `JournalTab.tsx` - Unified timeline with filters by entry type
  - `JournalEntryModal.tsx` - Single modal with type selector for all entry types
  - `LineageTab.tsx` - Ancestry, progeny, breeding participation display

- **New API Endpoints**
  - `GET /api/chat-logs?plantId=xxx` - Fetch all chat logs for a plant
  - `POST /api/chat-logs` - Save new AI conversation
  - `GET /api/chat-logs/{id}` - Fetch single chat log
  - `PATCH /api/chat-logs/{id}` - Update title, confidence, messages, userEdits
  - `DELETE /api/chat-logs/{id}` - Delete chat log

### Changed
- **Tab reduction**: 9 tabs → 5 tabs for better UX
- **AI Assistant location**: Moved from separate tab to Overview for easy access
- **Recommendations merged**: Health metrics now front-and-center in Overview
- **Care/Logs merged**: Unified into Journal tab with timeline view

### Technical
- New Prisma model: `ChatLog` with confidence tracking and embedding field (future pgvector)
- Plant API now includes `chatLogs` relation
- Journal tab supports filtering by: care, note, morphology, measurement, ai
- AIAssistant component now accepts `onSaveConversation` callback

## [1.5.1] - 2025-12-10

### Added
- **QR Code Infrastructure** - Full plant and location tag system
  - **Plant QR**: `/q/p/{plantId}` → Opens plant detail with quickcare modal auto-triggered
  - **Location QR**: `/q/l/{location}` → Opens batch care with location + all plants auto-selected
  - **Print APIs**: `/api/print/plant-tag/{id}` and `/api/print/location-tag/{name}`
    - `?format=html` - Browser preview with print button
    - `?format=zpl` - Raw ZPL for Zebra ZD421CN (2"x1" labels at 300 DPI)
    - `?format=png` - QR code as PNG download
  - **UI**: QR buttons on plant detail and locations pages
  - **Mobile**: Tailscale IP (100.88.172.122) encoded in QR for phone scanning

- **Timezone Standardization** - Fixes date off-by-one bugs
  - New utility: `/lib/timezone.ts` with `America/New_York` default
  - `getTodayString()` for consistent YYYY-MM-DD in local timezone
  - Fixed: Care logged at 10pm EST no longer shows as tomorrow
  - Updated all 14 date initializations across codebase
  - Future: Can be made configurable via user settings

### Changed
- **AI Chat Model** - Upgraded to Claude Opus 4 with extended thinking
  - 16K token thinking budget for deeper analysis
  - maxDuration increased to 120s
  - New system prompt sections: Epistemic Rigor, EC/pH Delta Analysis

### Technical
- New files: `/lib/timezone.ts`, `/lib/qr.ts`, `/lib/zpl.ts`
- New API routes: `/api/print/plant-tag/[id]`, `/api/print/location-tag/[name]`, `/api/plants/lookup`
- New page: `/q/[...slug]` for QR redirect handling
- Batch care page now uses Suspense wrapper for useSearchParams (hydration fix)

## [1.5.0] - 2025-12-10

### Added
- **AI Photo Analysis** - Vision-powered plant health analysis using Claude Sonnet 4
  - **AIAssistant component** - Embedded chat interface on plant detail pages
  - **Two analysis modes**:
    - **Recent (default)**: Analyzes 3 most recent photos for quick insights
    - **Comprehensive**: Deep analysis of up to 20 photos for thorough evaluation
  - **Dynamic mode switching**: Change modes mid-conversation to optimize token usage
  - **Cross-reference with care data**: AI analyzes photos alongside EC/pH logs, watering history
  - **Multi-turn conversations**: Full conversation memory within session
  - **Markdown rendering**: Rich formatted responses with headers, lists, code blocks
  - **Smart scroll behavior**: Auto-scroll during streaming, user can scroll up without disruption
  - **Photo count indicator**: Shows "X of Y photos" being analyzed

- **New API Endpoint** - `/api/chat`
  - Integrates with Anthropic Claude API (claude-sonnet-4-20250514)
  - Processes plant photos as base64 images
  - Includes full plant context (care logs, EC/pH data, location, health status)
  - Streaming responses via AI SDK

### Technical
- Added `react-markdown` dependency for rich text rendering
- AIAssistant uses `useChat` hook from `@ai-sdk/react` with custom transport
- Photo mode controlled via ref pattern for per-request state reading
- Photos sorted by `dateTaken` descending before selection

### Notes
- **Token costs**: ~1.5K tokens per photo. Comprehensive mode (20 photos) = ~30K tokens per message
- **Mitigation**: Start with comprehensive for initial analysis, switch to recent for follow-ups
- Claude API is stateless - images must be re-sent with each message (unavoidable)

## [1.4.0] - 2025-12-08

### Added
- **Clone Batch Care Tracking** - Track care logs for batches before graduation
  - New `cloneBatchId` field on CareLog model
  - `/api/clone-batches/[id]/care-logs` API endpoint
  - Batch detail page (`/batches/[id]`) with care history
  - EC/pH tracking per batch

- **Batch Detail Page** - Full CRUD for clone batches
  - View/edit batch info (species, cultivar, counts, status, location)
  - Add care logs with watering, feeding, treatment options
  - EC/pH input fields for each care entry
  - Delete batch with confirmation
  - Links to graduated plants

- **Seed Batch Edit/Delete** - Manage seed batches in breeding pipeline
  - Edit button on each seed batch card
  - Edit modal with sow date, seed count, substrate, status, container, temperature, humidity, notes
  - Delete button (only shows for batches with no seedlings)
  - Current values now pre-populate in edit modal

- **Feed Products API** - `/api/feed-products` for managing fertilizer products

### Changed
- **EC/pH Data Structure** - Migrated from JSON `details` field to structured columns
  - `inputEC`, `inputPH`, `outputEC`, `outputPH` now proper Float columns
  - `isBaselineFeed` and `feedComponents` columns for feed tracking
  - Backward compatible: still reads legacy JSON data
  - Migration script: `scripts/migrate-ecph-data.ts`

- **Baseline Feed Update** - Removed K-Carb from baseline feed formula
  - Updated batch care and plant care log forms
  - K-Carb now available as optional additive

- **Mobile Navigation** - Added Batches to bottom nav bar
  - Replaced Genetics with Batches for quicker access

### Fixed
- **Seed Batch Creation** - Fixed temperature/humidity type error (String → Float parsing)
- **Seed Batch Update** - Fixed PATCH API to properly parse float fields
- **Cross Delete** - Now allows deleting crosses with harvests (cascade delete)
  - Only blocks deletion if graduated plants exist
  - Shows cascade warning in confirmation dialog

### Technical
- Schema updates synced between SQLite and Postgres versions
- CareLog model now supports both Plant and CloneBatch relations
- Improved type safety in care log APIs

## [1.3.0] - 2025-12-04

### Added
- **Complete Breeding Pipeline** - Full tracking from pollination to accessioned plants
  - **Breeding Records (Crosses)**: Track CLX-YYYY-### crosses with female/male parents
  - **Cross Categories**: INTRASPECIFIC, INTERSPECIFIC, INTERSECTIONAL auto-detection
  - **Harvests**: Multiple berry harvests per cross (waves of ripening)
  - **Seed Batches (SDB-YYYY-###)**: Germination tracking with substrate, temp, humidity
  - **Seedlings (SDL-YYYY-####)**: Individual seedling tracking from emergence to graduation
  - **Selection Philosophy**: GROWING → KEEPER/HOLDBACK/CULL/DECEASED workflow
  - **Graduation Workflow**: Seedlings graduate to Plant table as ANT-YYYY-#### records

- **Lineage Tracking** - Enhanced parent/offspring relationships
  - Sexual reproduction: femaleParentId + maleParentId + breedingRecordId
  - Asexual reproduction: cloneSource/clones for offsets, TC, divisions
  - Generation tracking: F1, F2, S1, BC1, etc.
  - Target traits field for breeding goals

- **New API Endpoints**
  - `/api/breeding` - List/create breeding records
  - `/api/breeding/[id]` - CRUD for individual crosses
  - `/api/breeding/[id]/harvests` - Manage harvests per cross
  - `/api/seed-batches` and `/api/seed-batches/[id]` - Seed batch management
  - `/api/seedlings` and `/api/seedlings/[id]` - Seedling CRUD
  - `/api/seedlings/[id]/graduate` - Graduate seedlings to Plant table

- **Breeding UI** - New `/breeding` page
  - Plant dropdowns showing hybridName/species (plantId)
  - Expandable cross cards with pipeline visualization
  - Delete functionality for crosses without harvests
  - Summary stats: harvests, seeds, seedlings, graduated plants

### Technical
- New Prisma models: Harvest, SeedBatch, Seedling
- ID generation utilities in `src/lib/breeding-ids.ts`
- Self-referential Plant relations for clonal lineage

## [1.2.0] - 2025-11-12

### Added
- **Cover Photo Selection** - Choose which photo displays on plant cards
  - Star icon to set/change cover photo
  - Visual "Cover" badge indicator
  - Falls back to most recent photo if none selected
  - Supports both PUT and PATCH API methods

### Fixed
- **Pest Critical Status** - Only shows active (untreated) issues, not historical
- **EC/pH Averaging** - Now uses last 3 logs instead of 10 for current values
- **pH Drift Detection** - No longer triggers false warnings for improvements
- **Dropdown Z-Index** - Sort/filter menus now properly appear above cards
- **Timezone Handling** - Standardized to EST across all date operations
- **Repotting Fields** - "From" pot size now properly editable when empty
- **UI Refinements** - Removed activity type emojis per user preference

### Changed
- EC/pH calculations optimized for accuracy
- Paired reading analysis for EC variance
- Critical alerts logic improved

## [1.2.0-beta] - 2025-11-11

### Added
- **Photo Management System** - Complete photo workflow
  - Multi-photo upload with drag-and-drop
  - EXIF metadata extraction
  - Automatic thumbnail generation
  - 8 photo categories (whole plant, leaf, spathe, spadix, stem, catophyl, base, roots)
  - Edit/delete photo functionality
  - Growth stage tracking

- **EC/pH Analysis System** - Advanced substrate monitoring
  - EC variance detection between input/output
  - pH drift rate calculations
  - Substrate health scoring (0-100 scale)
  - Critical alerts for EC buildup
  - Trend-based recommendations

### Changed
- Plant cards now display photos prominently (3:2 aspect ratio)
- PlantID badge overlays on photo
- Photo-first design for better visual identification

## [1.1.9] - 2025-11-10

### Added
- **Automated Backup System** - Daily cron job at 2 AM with 30-day retention
- **Quick Care Modal (Cmd+K)** - Keyboard-driven care logging
- **Actionable Dashboard** - CareQueue widget with Water/Feed/Critical tabs
- **Database Performance Indexes** - 20+ optimized indexes
- **Batch Care Location Selection** - Select all plants in a location
- **Rain Activity Type** - Track natural rainfall with amount/duration
- **Substrate Details for Repotting** - Track PON, moss, drainage type

### Changed
- **Baseline Feed Update** - pH 5.9/EC 1.1 (from pH 6.1/EC 1.0)
- **K-Carb Reduction** - Lowered to prevent nutrient lockout
- Repotting now includes substrate mix details

### Fixed
- TypeScript errors in showToast
- Measurement API field mapping
- Care log form repotting fields
- Photo form reset issues

## [1.1.8] - 2025-11-09

### Added
- **ML Foundation** - Infrastructure for AI features
  - PlantJournal unified activity log
  - Vector embedding support in schema
  - ML diagnosis routes prepared
  - Care prediction algorithms

### Technical
- Journal system for NLP training data
- Photo metadata extraction for vision models
- Prepared for semantic search capabilities

## [1.1.7] - 2025-11-08

### Added
- **Batch Care Operations** - Apply care to multiple plants
- **Location-Based Selection** - Quick select by growing area
- **Care Frequency Analysis** - ML-powered scheduling

## [1.1.6] - 2025-10-18

### Added
- **Location Management System** - Environmental tracking
  - DLI (Daily Light Integral)
  - VPD (Vapor Pressure Deficit)
  - CO₂ monitoring (PPM)
  - Equipment tracking (lights, fans)
  - Occupancy and capacity planning

- **Reproductive Phenology** - Breeding cycle tracking
  - Spathe emergence dates
  - Female/male phase windows
  - Pollen viability tracking
  - Cross success rates

- **Temporal Morphology** - Track trait changes over time
  - Multiple observations per trait
  - Edit historical entries
  - Timeline visualization

### Technical
- Added comprehensive documentation
- Implemented 3-2-1 backup strategy
- SSH key authentication for NAS

## [1.1.5] - 2025-10-17

### Added
- **Data Standardization**
  - Section dropdown (13 Anthurium sections)
  - Health status standardization
  - Propagation type tracking
  - Generation fields (F1, F2, etc.)

### Fixed
- Database connection issues (absolute path)
- Schema mismatches
- Removed variegationType field

## [1.1.4] - 2025-10-16

### Added
- **Vendor Management** - Source tracking and reputation
- **Financial Tracking** - Acquisition costs, market values
- **Elite Genetics Flag** - Premium breeding lines
- **Mother Plant Tracking** - Breeding stock management

## [1.1.3] - 2025-10-15

### Added
- **Care Logging System** - Complete care history
- **EC/pH Tracking** - Input/output measurements
- **Pest Management** - Discovery and treatment
- **Growth Measurements** - Time-series data

## [1.1.2] - 2025-10-14

### Added
- **Breeding Records** - Parent/offspring relationships
- **Cross Tracking** - Female × male → F1
- **Trait System** - Morphological characteristics

## [1.1.1] - 2025-10-13

### Added
- **Plant Database** - Core CRUD operations
- **SQLite Integration** - Local database
- **Next.js 15 App** - Modern React framework
- **Prisma ORM** - Type-safe database access

### Initial Features
- Plant management (67 initial plants)
- Basic UI with glassmorphism
- API endpoints for all operations
- Excel data import script

## [1.0.0] - 2025-10-12

### Initial Release
- Project inception
- Database schema design
- Technology stack selection
- Migration from Excel spreadsheet

---

*Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*