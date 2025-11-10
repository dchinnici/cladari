#!/bin/bash
# Setup cron job for automated daily backups

CRON_CMD="/Users/davidchinnici/cladari/plantDB/scripts/automated-backup.sh"
CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "automated-backup.sh"; then
    echo "✓ Cron job already exists"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $CRON_CMD") | crontab -
    echo "✓ Cron job added: Daily backups at 2 AM"
fi

echo ""
echo "Current cron jobs:"
crontab -l | grep -E "cladari|plantDB" || echo "No Cladari cron jobs found"

echo ""
echo "To manually run backup: ./scripts/automated-backup.sh"
echo "To check backup status: ls -la ~/cladari/backups/"
echo "To remove cron job: crontab -e (then delete the line)"