# Cladari Plant Management - Operator Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Project History & Evolution](#project-history--evolution)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [Application Structure](#application-structure)
6. [Key Features](#key-features)
7. [Known Issues & Solutions](#known-issues--solutions)
8. [Development Guide](#development-guide)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

Cladari Plant Management is a comprehensive web application designed to track and manage an anthurium plant collection worth over $11,000. The system manages 67+ plants with detailed tracking of genetics, morphology, breeding history, care requirements, and market values.

### Core Purpose
- Track individual plant specimens with unique IDs (ANT-2025-XXXX format)
- Monitor plant health through EC/pH measurements
- Document morphological traits for breeding programs
- Manage breeding crosses and genetic lineages
- Schedule and log care activities
- Predict market values based on traits

---

## Project History & Evolution

### Initial State
- Started with Excel spreadsheet (`Anthurium_Collection_Enhanced-2.xlsx`) containing 67 plants
- Data included basic info: names, sources, prices, acquisition dates
- Total collection value: $11,469

### Migration Path
1. **PostgreSQL Intent**: Originally planned for PostgreSQL with pgvector for AI-powered trait analysis
2. **Docker Issues**: Docker daemon wasn't running, preventing PostgreSQL setup
3. **SQLite Pivot**: Successfully migrated to SQLite for immediate functionality
4. **Data Import**: Built custom import script to migrate Excel data to database

### Key Development Milestones
1. Database schema design with 12+ interconnected models
2. Next.js 15 app with TypeScript implementation
3. Beautiful UI with glassmorphism effects
4. Functional CRUD operations for all entities
5. Batch care logging for efficiency
6. EC/pH tracking with input/output measurements
7. Next.js 15 compatibility fixes (async params)

---

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15.5.5 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Styling**: Tailwind CSS with glassmorphism
- **Icons**: Lucide React
- **Data Import**: xlsx library

### File Structure
```
anthurium-breeding-system/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── dev.db             # SQLite database
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── plants/       # Plant pages
│   │   ├── batch-care/   # Batch operations
│   │   └── dashboard/    # Analytics
│   ├── components/       # React components
│   └── lib/             # Utilities
├── scripts/
│   └── import-excel-data.js  # Data migration
└── public/              # Static assets
```

---

## Database Architecture

### Core Models

#### Plant
- Central entity with unique plantId (ANT-2025-XXXX)
- Stores: name, species, variety, source, price, acquisition date
- Uses `notes` field as JSON storage for care requirements
- Links to all other entities

#### Trait (Morphological Data)
- Category-based system (leaf, spathe, spadix, growth)
- Trait names (shape, color, texture, size)
- Values stored as strings with optional expression levels
- Multiple traits per plant

#### CareLog
- Tracks all care activities (watering, fertilizing, etc.)
- Stores EC/pH measurements in `details` JSON field
- Supports batch operations across multiple plants

#### Measurement
- Dedicated EC/pH tracking with timestamps
- Types: routine, pre-water, post-water
- Separate from care logs for detailed monitoring

#### Breeding
- Tracks crosses between plants
- Parent relationships (female/male)
- F1 generation tracking
- Success metrics

### Data Storage Patterns
- **JSON Fields**: Used for flexible data (care requirements, EC/pH details)
- **Normalized Relations**: Proper foreign keys for data integrity
- **Temporal Data**: All entities track creation/update times

---

## Application Structure

### API Routes (All Next.js 15 Compatible)

#### `/api/plants`
- GET: List all plants with relationships
- POST: Create new plant

#### `/api/plants/[id]`
- GET: Single plant with full details
- PATCH: Update plant info (including care requirements as JSON)

#### `/api/plants/[id]/traits`
- POST: Create/update morphological traits
- Maps UI fields to database structure

#### `/api/plants/[id]/care-logs`
- POST: Add care log with EC/pH data

#### `/api/plants/[id]/measurements`
- POST: Record EC/pH measurements

#### `/api/plants/[id]/care-logs/[logId]`
- PATCH: Edit existing care log (NEW in v1.1.0)

#### `/api/plants/export`
- GET: Export database to CSV (NEW in v1.1.0)

#### `/api/batch-care`
- POST: Apply same care to multiple plants

### Key UI Components

#### Plant Detail Page (`/plants/[id]`)
- 7 tabs: Overview, Care & Notes, EC & pH, Morphology, Photos, Breeding, Care Logs
- Modal-based editing for all sections
- Real-time data updates

#### Plant List (`/plants`)
- Card-based layout with glassmorphism
- Quick stats display
- Search and filter capabilities

#### Batch Care (`/batch-care`)
- Multi-plant selection with manual or location-based selection
- Select by Location dropdown for quick bulk operations
- Single form for multiple plants
- EC/pH input with separate in/out fields
- Rain activity type with amount and duration tracking

---

## Key Features

### 1. Plant Management
- Unique ID generation
- Comprehensive plant profiles
- Photo management (placeholder)
- QR code support (planned)

### 2. Care Tracking
- Individual care logs
- Batch care operations with location-based selection
- Rain tracking with amount and duration
- Fertigation tracking (input/output EC/pH)
- Care scheduling

### 3. Morphological Documentation
- Structured trait recording
- Category-based organization
- Breeding selection support

### 4. Breeding Program
- Cross documentation
- Parent tracking
- F1 generation records
- Success rate analytics

### 5. Data Analytics
- Dashboard with statistics
- Comprehensive recent activity tracking (all change types)
- Value tracking
- Growth monitoring
- Collection insights
- Stale plant alerts (7+ days without updates)

### 6. Data Management
- CSV export (23-column comprehensive export)
- Plant deletion with safety confirmation
- Smart sorting (oldest first for update queue)
- Advanced filtering (health, breeder, location, section)

### 7. Elite Genetics
- Mark elite breeding stock with checkbox
- Inline instant save
- Filter and sort by elite status

---

## Recent Updates (v1.1.1) - Latest

### New Features Added
1. **Batch Care: Select by Location** - Instantly select all plants in a specific location
   - Dropdown shows all locations with plant counts
   - Perfect for applying care to outdoor plants (balcony, patio) after rain
2. **Rain Activity Type** - Track natural rainfall for outdoor plants
   - Rainfall Amount: Light, Medium, Heavy
   - Duration: Brief, Short, Medium, Long, Extended
   - Saved to care log details JSON for analytics

### Bugs Fixed
1. **Elite Genetics Toast** - Fixed backwards notification message
   - Now correctly reflects actual database state
   - Uses API response value instead of event target

---

## Previous Updates (v1.1.0)

### New Features Added
1. **CSV Export** - Export entire database to CSV from Plants page
2. **Plant Deletion** - Delete plants with confirmation modal
3. **Care Log Editing** - Edit existing care logs (essential for adding output EC/pH)
4. **Sort by Update Age** - Default sort shows plants needing attention first
5. **Stale Plant Alerts** - Orange badges for plants not updated in 7+ days
6. **Elite Genetics Tracking** - Mark and filter elite breeding stock
7. **Comprehensive Activity Feed** - Dashboard shows all changes (plants, care, measurements, flowering)

### Bugs Fixed
1. **Timezone Bug** - Care logs and measurements now save correct dates
2. **EC/pH Submission** - Fixed measurement form failures
3. **Filter Functionality** - Plants filter modal now fully operational
4. **Scroll Position** - Page preserves scroll after edits
5. **Custom Breeder Code** - Fixed "custom" appearing as actual value
6. **Breeder Codes** - Consolidated OG5→OG, added FP

---

## Known Issues & Solutions

### 1. Next.js 15 Async Params
**Issue**: Dynamic routes require awaiting params
**Solution**: All routes updated with:
```typescript
const params = await context.params
```

### 2. Database Schema Mismatches
**Issue**: Trait model structure differs from UI expectations
**Solution**: Implemented mapping layer between UI fields and database structure

### 3. Care Requirements Storage
**Issue**: No dedicated database fields for care requirements
**Solution**: Store as JSON in plant.notes field

### 4. Field Name Inconsistencies
**Issue**: API expects different field names than UI sends
**Solution**: Field mapping in API routes (e.g., activityType vs action)

---

## Development Guide

### Starting Development Server
```bash
cd plantDB
DATABASE_URL="file:./prisma/dev.db" npm run dev
```

### Running Data Import
```bash
cd plantDB
DATABASE_URL="file:./prisma/dev.db" node scripts/import-excel-data.js
```

### Database Migrations
```bash
cd plantDB
npx prisma migrate dev
npx prisma generate
```

### Common Tasks

#### Adding New Plant Fields
1. Update Prisma schema
2. Run migration
3. Update API routes
4. Update UI components

#### Modifying Trait Categories
1. Update trait creation logic in `/api/plants/[id]/traits`
2. Update display logic in plant detail page
3. Ensure morphology form matches

---

## Troubleshooting

### Server Won't Start
- Check DATABASE_URL environment variable
- Verify dev.db exists
- Run `npx prisma generate`

### Data Not Saving
- Check browser console for API errors
- Verify field names match database schema
- Ensure async params are awaited

### UI Not Updating
- Check React Query cache
- Verify API returns updated data
- Force refresh with fetchPlant()

### Import Errors
- Verify Excel file path
- Check column names match script expectations
- Ensure database is initialized

---

## Future Enhancements

### Planned Features
1. Photo upload functionality
2. QR code generation and printing
3. Advanced search and filtering
4. Export capabilities
5. Mobile app companion
6. PostgreSQL migration with pgvector
7. AI-powered trait analysis
8. Market value predictions

### Technical Improvements
1. Add comprehensive testing
2. Implement error boundaries
3. Add loading states
4. Optimize database queries
5. Implement caching strategy
6. Add user authentication
7. Set up CI/CD pipeline

---

## Important Notes

### For Claude/AI Assistants
- Always await params in Next.js 15 dynamic routes
- Plant care requirements are stored as JSON in notes field
- Traits use category/traitName/value structure, not flat fields
- EC/pH data goes in details JSON field of care logs
- Use currentLocation, not location in plant queries
- Dates must append 'T12:00:00' to prevent timezone issues
- Use preserveScrollPosition() wrapper for all data refreshes
- Care log edits use logId field to distinguish create vs update modes

### For Developers
- Run dev server with DATABASE_URL set
- Don't commit dev.db to version control
- Test batch operations with small sets first
- Keep JSON fields backward compatible
- Document any schema changes

### For Users
- Regular backups recommended
- Batch care saves time for group treatments
- Use morphology tab for breeding decisions
- Track EC/pH for optimal plant health
- Document everything for breeding success

---

## Contact & Support

This system was developed through iterative collaboration between the user and Claude. For questions or issues:
1. Check this manual first
2. Review error messages carefully
3. Verify database integrity
4. Test with single operations before batch

Remember: This is a living system designed to grow with your collection and breeding program. Regular updates and improvements are expected as requirements evolve.

---

*Last Updated: October 20, 2025*
*Version: 1.1.1*
*Total Plants: 67+*
*Collection Value: $11,469+*
### PostgreSQL + pgvector Plan

This project runs on SQLite for fast local dev. To migrate to Postgres with pgvector:

1) Provision Postgres and enable pgvector
- Create a Postgres instance (local Docker or managed)
- Enable extension: `CREATE EXTENSION IF NOT EXISTS vector;`

2) Use the Postgres Prisma schema
- See `prisma/schema.postgres.prisma` (keeps JSON fields as `Json`, and includes a commented `Unsupported("vector(768)")` example for embeddings)
- Set `DATABASE_URL` to your Postgres DSN in `.env`
- Temporarily point Prisma CLI to the Postgres schema, e.g.:
  - `npx prisma migrate dev --schema=prisma/schema.postgres.prisma`
  - `npx prisma generate --schema=prisma/schema.postgres.prisma`

3) Add vector columns via a migration
- Example SQL migration:
  - `ALTER TABLE "Genetics" ADD COLUMN traitEmbedding vector(768);`
- Then wire your ML pipeline to write embeddings to this column

4) Code adjustments
- Replace stringified JSON reads/writes with real JSON (no `JSON.stringify`/`JSON.parse` for fields marked `Json`)
- Keep the SQLite schema for local, Postgres schema for prod until comfortable, then unify

5) Rollout
- Back up SQLite data
- Import into Postgres (export script or Prisma seed)
- Point the app’s `DATABASE_URL` to Postgres in prod
