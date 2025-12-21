#!/bin/bash
# Automated Backup Script for Cladari Plant Database
# Runs daily at 2 AM via cron
# Maintains 30-day rolling backup window

set -e

# Configuration
DB_PATH="/Users/davidchinnici/cladari/plantDB/prisma/dev.db"
BACKUP_ROOT="/Users/davidchinnici/cladari/backups"
SNAPSHOT_DIR="/Users/davidchinnici/cladari/plantDB/docs/db-snapshots"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
MONTH=$(date +%Y-%m)

# Create backup directories
BACKUP_DIR="$BACKUP_ROOT/$MONTH"
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Cladari database backup..."

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    log "ERROR: Database not found at $DB_PATH"
    exit 1
fi

# 1. Create timestamped SQLite backup
BACKUP_FILE="$BACKUP_DIR/cladari-${DATE}_${TIME}.db"
log "Creating database backup: $BACKUP_FILE"
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# 2. Create compressed archive
log "Compressing backup..."
gzip -k "$BACKUP_FILE"

# 3. Generate snapshot for version control
log "Generating text snapshots..."
cd /Users/davidchinnici/cladari/plantDB
./scripts/snapshot-db.sh > /dev/null 2>&1

# 4. Create daily summary
log "Generating backup summary..."
sqlite3 "$DB_PATH" << EOF > "$BACKUP_DIR/summary-${DATE}.txt"
.mode column
.headers on
SELECT 'Database Summary for $DATE' as Report;
SELECT '================================' as '';
SELECT COUNT(*) as total_plants FROM Plant WHERE isArchived = 0;
SELECT COUNT(*) as archived_plants FROM Plant WHERE isArchived = 1;
SELECT COUNT(*) as care_logs_today FROM CareLog WHERE date(date) = date('now');
SELECT COUNT(*) as total_care_logs FROM CareLog;
SELECT ROUND(SUM(acquisitionCost), 2) as collection_value FROM Plant WHERE acquisitionCost IS NOT NULL AND isArchived = 0;
SELECT COUNT(*) as plants_needing_water FROM Plant p
  WHERE p.id NOT IN (
    SELECT DISTINCT plantId FROM CareLog
    WHERE action IN ('water', 'watering')
    AND date > datetime('now', '-7 days')
  ) AND p.isArchived = 0;
EOF

# 5. Verify backup integrity
log "Verifying backup integrity..."
if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
    log "✓ Backup verified successfully"
else
    log "ERROR: Backup verification failed!"
    exit 1
fi

# 6. Clean up old backups (keep 30 days)
log "Cleaning up old backups..."
find "$BACKUP_ROOT" -name "cladari-*.db*" -type f -mtime +30 -delete
find "$BACKUP_ROOT" -name "summary-*.txt" -type f -mtime +30 -delete

# 7. Report backup size and location
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)

log "================================"
log "✅ Backup completed successfully!"
log "  Original DB size: $DB_SIZE"
log "  Compressed backup: $BACKUP_SIZE"
log "  Location: $BACKUP_FILE.gz"
log "  Retention: 30 days"
log "================================"

# 8. Create latest symlink for easy access
ln -sf "$BACKUP_FILE" "$BACKUP_ROOT/latest-backup.db"
ln -sf "$BACKUP_FILE.gz" "$BACKUP_ROOT/latest-backup.db.gz"

# Optional: Send notification (uncomment if you want macOS notification)
# osascript -e 'display notification "Database backup completed successfully" with title "Cladari Backup" subtitle "Size: '"$BACKUP_SIZE"'"'

exit 0