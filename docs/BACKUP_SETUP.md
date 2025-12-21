# Backup Setup Guide - Cladari PlantDB
**Critical: Protect your breeding program data**

---

## Overview: 3-2-1 Backup Strategy

Your data is backed up in **three places**:
1. **Live data** on your Mac (`/Users/davidchinnici/cladari/plantDB/`)
2. **Time Machine** (local, automatic, hourly/daily)
3. **Synology NAS** (network, automated daily via Tailscale)

This protects against:
- Accidental deletion (Time Machine hourly backups)
- Hard drive failure (NAS backup)
- Mac loss/theft (NAS via Tailscale is accessible remotely)
- Catastrophic failure (30 days of database snapshots on NAS)

---

## Quick Setup (One-Time Configuration)

### Step 1: Set Up SSH Key Authentication (5 minutes)

This allows automated backups without password prompts.

```bash
# 1. Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "cladari-backup"
# Press Enter to accept default location (~/.ssh/id_ed25519)
# Press Enter twice for no passphrase (required for automation)

# 2. Copy your public key to the NAS
# Replace 'davidchinnici' with your actual NAS username
ssh-copy-id davidchinnici@100.82.66.63

# 3. Test the connection (should NOT ask for password)
ssh davidchinnici@100.82.66.63 "echo SSH key authentication working!"
```

**If you get an error about `ssh-copy-id` not found:**
```bash
# Manual method:
cat ~/.ssh/id_ed25519.pub | ssh davidchinnici@100.82.66.63 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 2: Create NAS Backup Directory

```bash
# SSH into your NAS and create the backup structure
ssh davidchinnici@100.82.66.63

# On the NAS, create directories (adjust path based on your NAS setup)
mkdir -p /volume1/Backups/cladari/db-snapshots
exit
```

**Note:** NAS paths vary by model. Common paths:
- `/volume1/Backups/` (most Synology models)
- `/volumeUSB1/usbshare/` (USB drives)
- Check your NAS's File Station to confirm

### Step 3: Edit the Backup Script

Open the script and update these lines if needed:

```bash
# Edit the script
nano /Users/davidchinnici/cladari/plantDB/scripts/backup-to-nas.sh

# Update these lines:
NAS_USER="dchinnici"  # Your NAS username (verified working)
NAS_BACKUP_PATH="/var/services/homes/dchinnici/Backups/cladari"  # Full path on NAS (auto-configured)
```

Save with `Ctrl+O`, exit with `Ctrl+X`.

### Step 4: Test Manual Backup

```bash
# Run the backup script manually
cd /Users/davidchinnici/cladari/plantDB
./scripts/backup-to-nas.sh

# Check the log
cat logs/backup.log
```

**Expected output:**
```
========================================
Backup started: Sat Oct 18 14:30:00 PDT 2025
========================================
sending incremental file list
./
prisma/dev.db
... (more files) ...
✅ Backup completed successfully: Sat Oct 18 14:30:15 PDT 2025
✅ Database snapshot saved: dev_20251018_143015.db
```

### Step 5: Set Up Daily Automated Backups

We'll use macOS **launchd** (like cron but better for Macs).

Create the automation file:

```bash
# Create launchd plist
cat > ~/Library/LaunchAgents/com.cladari.plantdb.backup.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cladari.plantdb.backup</string>

    <key>ProgramArguments</key>
    <array>
        <string>/Users/davidchinnici/cladari/plantDB/scripts/backup-to-nas.sh</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>22</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/Users/davidchinnici/cladari/plantDB/logs/backup-launchd.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/davidchinnici/cladari/plantDB/logs/backup-launchd.error.log</string>
</dict>
</plist>
EOF

# Load the automation (starts immediately and on login)
launchctl load ~/Library/LaunchAgents/com.cladari.plantdb.backup.plist
```

**This will run the backup every day at 10:00 PM.**

To change the time, edit the `Hour` value (0-23, 24-hour format).

---

## Daily Usage

### Automatic Backups
- **Time Machine:** Runs automatically when Mac is on and connected
- **NAS Backup:** Runs daily at 10 PM automatically
- **No action required** - just leave your Mac on or let it wake for backups

### Manual Backup (Before Major Changes)

```bash
# Quick manual backup before risky operations
cd /Users/davidchinnici/cladari/plantDB
./scripts/backup-to-nas.sh
```

**Run manual backups before:**
- Bulk data imports
- Database schema changes
- Major deletions or reorganizations
- Software updates

---

## Checking Backup Status

### View Recent Backup Logs
```bash
# View last backup
tail -n 20 /Users/davidchinnici/cladari/plantDB/logs/backup.log

# View all backups today
grep "$(date +%Y-%m-%d)" /Users/davidchinnici/cladari/plantDB/logs/backup.log
```

### Verify NAS Backups
```bash
# SSH into NAS and check backup files
ssh davidchinnici@100.82.66.63 "ls -lh /volume1/Backups/cladari/prisma/"

# Check database snapshots (last 30 days)
ssh davidchinnici@100.82.66.63 "ls -lht /volume1/Backups/cladari/db-snapshots/ | head -n 10"
```

### Check Automated Task Status
```bash
# See if launchd job is loaded
launchctl list | grep cladari

# View recent automation logs
tail -n 50 /Users/davidchinnici/cladari/plantDB/logs/backup-launchd.log
```

---

## Restoring from Backup

### Restore from NAS (Full Project)
```bash
# 1. Stop the dev server first
# 2. Restore entire project
rsync -avz davidchinnici@100.82.66.63:/volume1/Backups/cladari/ /Users/davidchinnici/cladari/plantDB/

# 3. Restart dev server
cd /Users/davidchinnici/cladari/plantDB
npm run dev
```

### Restore Database Only (Specific Date)
```bash
# 1. List available database snapshots
ssh davidchinnici@100.82.66.63 "ls -lht /volume1/Backups/cladari/db-snapshots/"

# 2. Copy specific snapshot (example: October 18, 2025 at 10 PM)
scp davidchinnici@100.82.66.63:/volume1/Backups/cladari/db-snapshots/dev_20251018_220000.db \
    /Users/davidchinnici/cladari/plantDB/prisma/dev.db

# 3. Restart dev server
```

### Restore from Time Machine
1. Open Time Machine (clock icon in menu bar)
2. Navigate to `/Users/davidchinnici/cladari/plantDB/prisma/`
3. Browse to desired date/time
4. Select `dev.db` and click "Restore"

---

## Troubleshooting

### "Permission denied" when running backup
```bash
chmod +x /Users/davidchinnici/cladari/plantDB/scripts/backup-to-nas.sh
```

### "Cannot reach NAS" error
```bash
# Check if Tailscale is running
/Applications/Tailscale.app/Contents/MacOS/Tailscale status

# Try local IP instead
ping 192.168.4.120

# Edit script to use local IP if Tailscale is down
# Change: NAS_HOST="192.168.4.120"
```

### Backup script asks for password
```bash
# SSH key authentication not set up correctly
# Re-run Step 1: Set Up SSH Key Authentication

# Test connection:
ssh davidchinnici@100.82.66.63 "echo test"
# Should NOT ask for password
```

### Launchd job not running
```bash
# Unload and reload
launchctl unload ~/Library/LaunchAgents/com.cladari.plantdb.backup.plist
launchctl load ~/Library/LaunchAgents/com.cladari.plantdb.backup.plist

# Check for errors
cat /Users/davidchinnici/cladari/plantDB/logs/backup-launchd.error.log
```

### NAS path doesn't exist
```bash
# SSH into NAS and find correct volume
ssh davidchinnici@100.82.66.63
df -h
# Look for /volume1, /volume2, etc.

# Update script with correct path
```

---

## Backup Retention Policy

**Time Machine:**
- Hourly backups for past 24 hours
- Daily backups for past month
- Weekly backups until disk is full

**NAS Automated Backup:**
- Full project sync (latest version always available)
- Last 30 database snapshots (kept automatically)
- Older snapshots deleted to save space

**Recommendation:** If you need long-term archival (e.g., end of breeding season), manually copy a database snapshot to a separate archive folder on the NAS.

---

## Security Notes

- **SSH Key:** Stored at `~/.ssh/id_ed25519` - keep this secure
- **Tailscale:** All traffic encrypted end-to-end
- **NAS Access:** Only accessible via Tailscale or local network
- **No Passwords in Scripts:** Script uses SSH key authentication

---

## Quick Reference Commands

```bash
# Manual backup now
./scripts/backup-to-nas.sh

# View last backup log
tail -n 20 logs/backup.log

# Check automated backups status
launchctl list | grep cladari

# List database snapshots on NAS
ssh davidchinnici@100.82.66.63 "ls -lht /volume1/Backups/cladari/db-snapshots/"

# Quick local database backup
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d)
```

---

## Support

If backups fail consistently:
1. Check logs: `cat logs/backup.log`
2. Verify Tailscale connection: `ping 100.82.66.63`
3. Test SSH access: `ssh davidchinnici@100.82.66.63`
4. Check NAS storage space
5. Verify NAS is powered on and accessible

**Your breeding program data is valuable - these backups protect years of work!**
