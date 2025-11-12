# Changelog

All notable changes to the Cladari Plant Management System will be documented in this file.

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