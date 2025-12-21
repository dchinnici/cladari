#!/bin/bash
# Database Snapshot Script
# Creates AI-friendly text snapshots of the database for version control

set -e

SNAPSHOT_DIR="docs/db-snapshots"
DATE=$(date +%Y%m%d-%H%M%S)
DB_PATH="prisma/dev.db"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    exit 1
fi

# Create snapshot directory
mkdir -p "$SNAPSHOT_DIR"

echo "📸 Creating database snapshot..."

# 1. Full SQL dump (complete backup)
echo "  → Exporting full SQL dump..."
sqlite3 "$DB_PATH" .dump > "$SNAPSHOT_DIR/latest.sql"

# 2. Database statistics (high-level overview)
echo "  → Generating statistics..."
sqlite3 "$DB_PATH" << 'EOF' > "$SNAPSHOT_DIR/latest-stats.json"
.mode json
SELECT
  (SELECT COUNT(*) FROM Plant) as total_plants,
  (SELECT COUNT(*) FROM CareLog) as total_care_logs,
  (SELECT COUNT(*) FROM Photo) as total_photos,
  (SELECT COUNT(*) FROM Location) as total_locations,
  (SELECT COUNT(*) FROM Vendor) as total_vendors,
  (SELECT COUNT(*) FROM BreedingRecord) as total_crosses,
  (SELECT COUNT(*) FROM FloweringCycle) as total_flowering_cycles,
  (SELECT COUNT(*) FROM Trait) as total_trait_observations,
  (SELECT SUM(acquisitionCost) FROM Plant WHERE acquisitionCost IS NOT NULL) as total_collection_value;
EOF

# 3. Sample plant data (first 10 plants with key fields)
echo "  → Sampling plant data..."
sqlite3 "$DB_PATH" << 'EOF' > "$SNAPSHOT_DIR/sample-plants.json"
.mode json
SELECT
  id, plantId, hybridName, species, section,
  healthStatus, acquisitionCost, accessionDate,
  breederCode, locationId
FROM Plant
ORDER BY accessionDate DESC
LIMIT 10;
EOF

# 4. Recent care logs (last 20 entries)
echo "  → Sampling recent care logs..."
sqlite3 "$DB_PATH" << 'EOF' > "$SNAPSHOT_DIR/sample-care-logs.json"
.mode json
SELECT
  c.id, c.plantId, c.date, c.action, c.details,
  p.plantId as plant_code, p.hybridName
FROM CareLog c
JOIN Plant p ON c.plantId = p.id
ORDER BY c.date DESC
LIMIT 20;
EOF

# 5. Schema info (table structure)
echo "  → Exporting schema..."
sqlite3 "$DB_PATH" << 'EOF' > "$SNAPSHOT_DIR/schema-info.txt"
.schema
EOF

# 6. Table sizes (row counts)
echo "  → Calculating table sizes..."
sqlite3 "$DB_PATH" << 'EOF' > "$SNAPSHOT_DIR/table-sizes.txt"
SELECT name,
       (SELECT COUNT(*) FROM sqlite_master sm WHERE sm.name = m.name) as row_count
FROM sqlite_master m
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;
EOF

# Get file sizes
SQL_SIZE=$(du -h "$SNAPSHOT_DIR/latest.sql" | cut -f1)
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)

echo ""
echo "✅ Snapshot complete!"
echo "   Database size: $DB_SIZE"
echo "   SQL dump size: $SQL_SIZE"
echo "   Location: $SNAPSHOT_DIR/"
echo ""
echo "📋 Files created:"
echo "   - latest.sql (full backup)"
echo "   - latest-stats.json (statistics)"
echo "   - sample-plants.json (10 recent plants)"
echo "   - sample-care-logs.json (20 recent logs)"
echo "   - schema-info.txt (table structures)"
echo "   - table-sizes.txt (row counts)"
echo ""
echo "💡 Commit these snapshots to git for AI assistant access"
