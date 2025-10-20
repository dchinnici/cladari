#!/bin/bash

# Cladari PlantDB - Automated NAS Backup Script
# Backs up entire plantDB directory to Synology NAS

# Configuration
SOURCE_DIR="/Users/davidchinnici/cladari/plantDB"
NAS_HOST="100.82.66.63"  # Tailscale IP (works from anywhere)
NAS_USER="dchinnici"  # NAS username
NAS_BACKUP_PATH="/var/services/homes/dchinnici/Backups/cladari"  # Full path on NAS
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$SOURCE_DIR/logs/backup.log"

# Create logs directory if it doesn't exist
mkdir -p "$SOURCE_DIR/logs"

echo "========================================" >> "$LOG_FILE"
echo "Backup started: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Check if Tailscale is connected
if ! ping -c 1 -t 2 $NAS_HOST > /dev/null 2>&1; then
    echo "ERROR: Cannot reach NAS at $NAS_HOST (Tailscale may be disconnected)" >> "$LOG_FILE"
    exit 1
fi

# Rsync to NAS (preserves timestamps, permissions, handles deletes)
# -a: archive mode (recursive, preserves everything)
# -v: verbose
# -z: compress during transfer
# --delete: remove files on destination that were deleted on source
# --exclude: skip node_modules and build artifacts

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'logs/*.log' \
    --exclude 'db-snapshots' \
    -e "ssh -i $HOME/.ssh/id_ed25519 -o StrictHostKeyChecking=no" \
    "$SOURCE_DIR/" \
    "$NAS_USER@$NAS_HOST:Backups/cladari/" \
    >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $(date)" >> "$LOG_FILE"
    
    # Also create a timestamped snapshot of just the database
    scp -i "$HOME/.ssh/id_ed25519" "$SOURCE_DIR/prisma/dev.db" \
        "$NAS_USER@$NAS_HOST:Backups/cladari/db-snapshots/dev_$TIMESTAMP.db" \
        >> "$LOG_FILE" 2>&1
    
    echo "✅ Database snapshot saved: dev_$TIMESTAMP.db" >> "$LOG_FILE"
else
    echo "❌ Backup FAILED: $(date)" >> "$LOG_FILE"
    exit 1
fi

# Keep only last 30 database snapshots (cleanup old ones)
ssh -i "$HOME/.ssh/id_ed25519" "$NAS_USER@$NAS_HOST" \
    "cd Backups/cladari/db-snapshots && ls -t dev_*.db 2>/dev/null | tail -n +31 | xargs -r rm" \
    >> "$LOG_FILE" 2>&1

echo "Backup log saved to: $LOG_FILE"
