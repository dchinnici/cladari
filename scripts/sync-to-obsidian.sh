#!/bin/bash
# Sync Cladari docs to Obsidian vault
# Usage: ./scripts/sync-to-obsidian.sh

# Configure these paths
CLADARI_DOCS="/Users/davidchinnici/cladari/cladari-website/docs"
CLADARI_ROOT="/Users/davidchinnici/cladari"
OBSIDIAN_VAULT="$HOME/Documents/Obsidian"  # Adjust to your vault path
OBSIDIAN_FOLDER="$OBSIDIAN_VAULT/Cladari"

# Create target folder if it doesn't exist
mkdir -p "$OBSIDIAN_FOLDER/docs"

# Sync docs folder
rsync -av --delete \
  --exclude='db-snapshots/' \
  --exclude='archive/' \
  "$CLADARI_DOCS/" "$OBSIDIAN_FOLDER/docs/"

# Also sync root-level docs
cp "$CLADARI_ROOT/CLAUDE.md" "$OBSIDIAN_FOLDER/CLAUDE.md"
cp "/Users/davidchinnici/cladari/cladari-website/CHANGELOG.md" "$OBSIDIAN_FOLDER/CHANGELOG.md"
cp "/Users/davidchinnici/cladari/cladari-website/README.md" "$OBSIDIAN_FOLDER/README.md"
cp "/Users/davidchinnici/cladari/cladari-website/OPERATOR_MANUAL.md" "$OBSIDIAN_FOLDER/OPERATOR_MANUAL.md" 2>/dev/null

# Add a sync timestamp
echo "Last synced: $(date)" > "$OBSIDIAN_FOLDER/.last-sync"

echo "✅ Synced Cladari docs to Obsidian vault"
echo "   Source: $CLADARI_DOCS"
echo "   Target: $OBSIDIAN_FOLDER"
