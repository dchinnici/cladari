# Changelog

All notable changes to the Cladari Plant Management System will be documented in this file.

## [1.1.0] - 2025-10-20

### Added
- **CSV Export** - Export entire plant database to CSV file for backup and analysis
  - 23-column comprehensive export including plant info, care logs, measurements
  - Automatic filename with date stamp
  - One-click download from Plants page

- **Plant Deletion** - Ability to delete plants with safety confirmation
  - Confirmation modal with warning about permanent data loss
  - Cascading deletion of all related records (care logs, measurements, photos, etc.)
  - Automatic redirect to plants list after deletion

- **Sort and Filter Improvements**
  - Sort by: Needs Attention (oldest first), Recently Updated, Alphabetical
  - Default sort shows plants needing updates first
  - Stale plant alerts (7+ days without updates)
  - Orange "Stale" badges on plant cards
  - Header count showing total plants needing attention

- **Elite Genetics Tracking**
  - New `isEliteGenetics` boolean field in database schema
  - Inline checkbox on plant overview for quick marking
  - Instant save with toast notifications

- **Care Log Editing**
  - Edit existing care logs after creation
  - New PATCH endpoint at `/api/plants/[id]/care-logs/[logId]`
  - Modal supports both create and edit modes
  - Essential for adding output EC/pH after watering

- **Comprehensive Recent Activity**
  - Dashboard now shows all activity types
  - Tracks: plant additions, updates, care logs, measurements, flowering
  - Merged timeline sorted by timestamp
  - Shows top 15 most recent activities

### Changed
- **Breeder Code Updates**
  - Consolidated codes: OG5 → OG
  - Added new breeder code: FP
  - Updated all dropdowns (plant detail, filters)

- **Navigation Improvements**
  - Top right button changed from "Add Plant" to "Batch Care"
  - Better workflow access to batch operations

- **Dashboard Cleanup**
  - Removed Vendors and Financials sections
  - Focused on breeding and genetics metrics
  - Updated elite genetics codes (RA, OG instead of numbered variants)

### Fixed
- **Timezone Bug** - Care log dates and measurements now save correctly
  - Added 'T12:00:00' to interpret dates as local noon
  - Prevents dates from appearing as previous day

- **EC/pH Submission** - Fixed measurement form submission failures
  - Applied same timezone fix to measurements endpoint

- **Plants Filter** - Filter modal now fully operational
  - Filter by: Health Status, Breeder Code, Location, Section
  - Active filter count badge
  - Clear filters functionality

- **Scroll Position** - Page no longer resets scroll after edits
  - Implemented `preserveScrollPosition` helper
  - Applied to all data refresh operations
  - Better UX for long pages with many plants

- **Custom Breeder Code Bug** - Fixed "custom" appearing as actual breeder code
  - Modified save logic to prevent "custom" from being stored
  - Cleared existing "custom" values from database
  - Prevents UI selection trigger value from becoming data

### Technical
- Database schema update: Added `isEliteGenetics` field to Plant model
- New API endpoints:
  - `GET /api/plants/export` - CSV export
  - `DELETE /api/plants/[id]` - Plant deletion
  - `PATCH /api/plants/[id]/care-logs/[logId]` - Care log editing
- Enhanced dashboard stats endpoint with comprehensive activity tracking
- Improved scroll preservation across all update operations

### Database
- Ran `npx prisma db push` and `npx prisma generate` for schema updates
- Added isEliteGenetics column to Plant table

---

## [1.0.0] - 2025-10-17

### Initial Release
- Core plant database functionality
- Location management with advanced environmental metrics
- Flowering cycle tracking
- Temporal morphology documentation
- Care logging and batch operations
- EC & pH tracking
- Breeding record management
- Dashboard analytics
- Excel data import from 67-plant collection

### Features
- Next.js 15 with App Router
- Prisma ORM with SQLite
- TypeScript throughout
- TailwindCSS with glassmorphism effects
- React Query for data management
- Toast notifications
- Modal-based editing
