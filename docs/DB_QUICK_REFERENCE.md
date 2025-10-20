# Database Quick Reference Guide

## TL;DR - Do This

1. **Start the app**: `./scripts/dev` → open http://localhost:3000
2. **Visual database editor**: `./scripts/db studio`
3. **Backup**: `cp plantDB/prisma/dev.db plantDB/prisma/dev.db.backup`
4. **Help**: `./scripts/health` to check everything

## Database Location

Your active database: `plantDB/prisma/dev.db`

## Common SQLite Queries

### View all plants
```bash
cd plantDB
sqlite3 prisma/dev.db "SELECT plantId, hybridName, species, healthStatus FROM Plant LIMIT 10;"
```

### Count plants by species complex
```bash
sqlite3 prisma/dev.db "SELECT speciesComplex, COUNT(*) as count FROM Plant GROUP BY speciesComplex;"
```

### Recent care logs
```bash
sqlite3 prisma/dev.db "SELECT p.plantId, c.date, c.action FROM CareLog c JOIN Plant p ON c.plantId = p.id ORDER BY c.date DESC LIMIT 10;"
```

### Plants by vendor
```bash
sqlite3 prisma/dev.db "SELECT v.name, COUNT(p.id) as plants FROM Vendor v LEFT JOIN Plant p ON p.vendorId = v.id GROUP BY v.id;"
```

### All tables
```bash
sqlite3 prisma/dev.db ".tables"
```

### Table structure
```bash
sqlite3 prisma/dev.db ".schema Plant"
```

### Export to CSV
```bash
sqlite3 prisma/dev.db <<EOF
.headers on
.mode csv
.output plants_export.csv
SELECT plantId, hybridName, species, acquisitionCost, healthStatus FROM Plant;
.quit
EOF
```

## Using Prisma Studio (Easiest GUI Method)

```bash
./scripts/db studio
```

This opens a web interface where you can:
- Browse all tables
- Edit records visually
- Run filtered searches
- No SQL knowledge needed

## Web UI Features (Recommended)

The web UI at http://localhost:3000 provides:

### Plant Management
- `/plants` - List all plants
- `/plants/[id]` - Detailed plant view with 7 tabs:
  1. Overview - basic info
  2. Care & Notes - care requirements
  3. EC & pH - solution measurements
  4. Morphology - trait documentation
  5. Photos - image metadata
  6. Breeding - parentage tracking
  7. Care Logs - activity history

### Batch Operations
- `/batch-care` - Apply care to multiple plants at once

### Analytics
- `/dashboard` - Collection statistics and insights

## Data Model Quick Reference

### Plant (Main Entity)
```
plantId (ANT-2025-XXXX) → Unique identifier
species, hybridName → What it is
vendorId → Where you got it
acquisitionCost → What you paid
healthStatus → Current health
notes → JSON field for care requirements
```

### Trait (Morphology)
```
plantId → Which plant
category → leaf/spathe/spadix/growth
traitName → shape/color/texture/size
value → The actual trait value
```

### CareLog (Activity History)
```
plantId → Which plant
date → When
action → water/fertilize/repot/prune/treat
details → JSON field with EC/pH data
```

### Measurement (EC/pH Tracking)
```
plantId → Which plant
measurementDate → When measured
ecValue, phValue, tdsValue → Solution metrics
```

### BreedingRecord (Crosses)
```
crossId (X-2025-XXXX) → Unique cross identifier
femalePlantId, malePlantId → Parents
seedsProduced, germinationRate → Results
```

## JSON Fields (Important!)

Some fields store JSON as strings:
- `Plant.notes` → Care requirements
- `Plant.tags` → Plant tags
- `CareLog.details` → EC/pH input/output data
- `BreedingRecord.selectionCriteria` → Breeding criteria

When editing via SQL, remember to use proper JSON format.

## Backup Strategy

### Daily backup (recommended)
```bash
# Add to crontab or run manually
cp plantDB/prisma/dev.db "plantDB/prisma/backups/dev.db.$(date +%Y%m%d-%H%M%S)"
```

### Before major changes
```bash
./scripts/db studio  # Make a backup before using studio
```

## Troubleshooting

### "Database locked" error
- Close Prisma Studio
- Stop the dev server with `./scripts/stop`
- Try again

### Schema mismatch
```bash
./scripts/db generate  # Regenerate Prisma client
```

### Migration issues
```bash
./scripts/db push  # Push schema without migration
```

### Start fresh (DANGER - deletes data!)
```bash
# Only if you really need to
rm plantDB/prisma/dev.db
./scripts/db migrate --name init
./scripts/db import  # Re-import from Excel
```

## Environment Variables

The scripts handle this automatically, but if running commands manually:

```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma studio
```

## Scripts Reference

All from repo root:

- `./scripts/dev` - Start dev server
- `./scripts/start` - Start production server
- `./scripts/stop` - Stop background servers
- `./scripts/db generate` - Regenerate Prisma client
- `./scripts/db migrate --name xyz` - Create migration
- `./scripts/db studio` - Visual database editor
- `./scripts/db import` - Import Excel data
- `./scripts/health` - Health check

## Next Steps

1. **Start simple**: Use `./scripts/dev` and the web UI
2. **Visual edits**: Use `./scripts/db studio` for database browsing
3. **Advanced queries**: Use the SQLite examples above
4. **Backup regularly**: Copy dev.db before major changes

---

**Remember**: The web UI is your friend. It handles all the complex JSON fields and relationships for you. Only dive into raw SQL/Prisma when you need to do something the UI doesn't support.
