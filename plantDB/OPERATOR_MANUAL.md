# Cladari PlantDB - Operator Manual
**Version 1.2.0** | **Updated: November 12, 2025**

## 🌿 Welcome to Your Plant Management System

This guide will help you use all the features of your Anthurium collection database. No technical knowledge required!

---

## 📑 Table of Contents

1. [Quick Start Guide](#-quick-start-guide)
2. [Managing Your Plants](#-managing-your-plants)
3. [Care Management](#-care-management)
4. [Photo Management](#-photo-management)
5. [EC/pH Monitoring](#-ecph-monitoring)
6. [Batch Operations](#-batch-operations)
7. [Dashboard Features](#-dashboard-features)
8. [Keyboard Shortcuts](#-keyboard-shortcuts)
9. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start Guide

### Starting the System

1. **Open Terminal** on your Mac
2. **Navigate to the project**:
   ```bash
   cd /Users/davidchinnici/cladari/plantDB
   ```
3. **Start the server**:
   ```bash
   ./scripts/dev --bg
   ```
4. **Open your browser** and go to: http://localhost:3000

### Stopping the System

```bash
cd /Users/davidchinnici/cladari/plantDB
./scripts/stop
```

---

## 🌱 Managing Your Plants

### Viewing Your Collection

- **Main Plants Page**: See all your plants with photos in a beautiful card layout
- **Search**: Use the search bar to find plants quickly (press `/` to focus)
- **Sort Options**:
  - ⚠️ **Needs Attention**: Plants requiring care
  - 🕐 **Recently Active**: Latest updates first
  - 🔤 **Alphabetical**: A-Z by name
- **Filters**: Click the filter icon to narrow down by location, health, etc.

### Plant Details Page

Click any plant card to see full details with these tabs:

1. **Overview**: Basic info, location, health status
2. **Care Logs**: Complete care history with EC/pH data
3. **Traits**: Morphological characteristics
4. **Genetics**: Breeding info, parent plants
5. **Measurements**: Growth tracking over time
6. **Photos**: All plant photos (NEW: with cover photo selection!)
7. **Flowering**: Reproductive cycles
8. **Journal**: Complete activity timeline
9. **Recommendations**: AI-powered care suggestions

### Adding a New Plant

1. Click the **"Add Plant"** button (green button in top controls)
2. Fill in the details:
   - PlantID is auto-generated (ANT-2025-XXXX format)
   - Select section from dropdown (prevents typos)
   - Add hybrid name or species
   - Set acquisition cost and date
3. Click **Save**

### Editing Plant Information

1. On the plant detail page, click **"Edit"** (top right)
2. Update any fields
3. Click **"Save"** to confirm or **"Cancel"** to discard

---

## 💧 Care Management

### Quick Care (Cmd+K)

The fastest way to log care:

1. Press **Cmd+K** anywhere in the app
2. Select plants to care for
3. Choose activity type
4. Add optional details (EC/pH, notes)
5. Click **"Log Care"**

### Recording Individual Care

1. Go to the plant's detail page
2. Click **"Care Logs"** tab
3. Click **"Add Care Log"**
4. Fill in details:
   - **Activity Type**: Watering, Fertilizing, Repotting, etc.
   - **Baseline Feed**: Check this for standard nutrient mix
   - **EC/pH Values**: Optional but recommended
   - **Notes**: Any observations

### Understanding Care Types

- **Watering**: Regular water, can include baseline nutrients
- **Rain**: Natural watering (tracks amount/duration)
- **Incremental Feed**: Extra nutrients beyond baseline
- **Repotting**: Includes pot size, substrate details
- **Pest Discovery/Treatment**: Track issues and solutions
- **Pruning**: Maintenance activities

### Repotting Details

When logging repotting:
- **From/To Pot Size**: Automatically fills current size
- **Substrate Type**: PON, moss, bark mix, etc.
- **Drainage Type**: Drainage holes, net pot, semi-hydro
- **Substrate Mix**: Custom blend details

---

## 📸 Photo Management

### Uploading Photos

1. Go to plant's **Photos** tab
2. Click **"Upload Photos"**
3. Select multiple files (JPEG, PNG, DNG supported)
4. Choose photo type:
   - Whole Plant
   - Leaf Detail
   - Spathe
   - Spadix
   - Stem
   - Catophyl
   - Base/Petiole
   - Roots
5. Add growth stage and notes (optional)
6. Photos automatically extract EXIF data

### Setting a Cover Photo (NEW!)

The cover photo appears on plant cards in the main view:

1. In the Photos tab, hover over any photo
2. Click the **⭐ Star icon** to set as cover
3. Current cover shows a **"Cover"** badge
4. Change anytime by selecting a different photo

### Managing Photos

- **Edit**: Click the pencil icon to update details
- **Delete**: Click the trash icon to remove
- Photos are stored in `/public/uploads/photos/`
- Thumbnails generated automatically for performance

---

## 🧪 EC/pH Monitoring

### Recording Measurements

When logging care, add EC/pH values:
- **Input EC/pH**: Your nutrient solution values
- **Output EC/pH**: Runoff measurements

### Understanding Alerts

The system automatically detects issues:

- **🔴 Critical EC Buildup**: Output EC > Input EC by 0.3+
  - Action: Flush with pH-balanced water

- **⚠️ pH Drift Warning**: pH changing > 0.2 per week
  - Action: Check substrate age, consider CalMag buffer

- **🔴 Critical pH**: < 5.0 or > 7.0
  - Action: Immediate correction needed

### Substrate Health Score

Automatically calculated 0-100 based on:
- EC variance between input/output
- pH stability
- Time since last repot
- Recent measurements

Score < 50 suggests repotting needed.

---

## 📦 Batch Operations

### Batch Care

Perfect for watering multiple plants:

1. Click **"Batch Care"** button (blue droplet icon)
2. Select plants by:
   - Individual selection
   - Location (all plants in a tent/shelf)
   - Filter then select all
3. Choose activity type
4. Add details (applies to all selected)
5. Click **"Submit"**

### Rain Tracking

When plants get rained on:
1. Use Batch Care
2. Select "Rain" as activity
3. Enter rainfall amount (inches)
4. Enter duration (hours)
5. System logs natural watering for all selected plants

---

## 📊 Dashboard Features

### Care Queue Widget

Shows plants needing immediate attention in three categories:

1. **💧 Water**: Plants due for watering (5+ days)
2. **🌿 Feed**: Plants due for fertilizing (14+ days)
3. **⚠️ Critical**: Plants with issues:
   - Active pest/disease (untreated)
   - High EC or abnormal pH
   - No activity for 10+ days

Click any plant to go directly to its page, or use bulk actions.

### Collection Statistics

- Total plants and value
- Vendor distribution
- Health status breakdown
- Recent activity timeline
- Financial analytics

### EC/pH Dashboard

Visual analytics showing:
- Average EC/pH trends
- Plants with concerning values
- Substrate health scores
- Recommendations for improvement

---

## ⌨️ Keyboard Shortcuts

- **Cmd+K**: Open Quick Care modal
- **/**: Focus search box (on plant list)
- **Esc**: Close any modal
- **Enter**: Submit forms

---

## 🔧 Troubleshooting

### Common Issues

**Plants not showing photos?**
- Check if photos were uploaded
- Refresh the page (Cmd+R)
- Clear browser cache if needed

**EC/pH values not saving?**
- Enter numbers only (e.g., "1.2" not "1.2 EC")
- Make sure to click Save/Submit

**Dropdown menu appearing behind cards?**
- Hard refresh the page (Cmd+Shift+R)
- This is a known issue that's been fixed

**Date showing wrong?**
- System uses EST timezone
- Dates are stored at noon to avoid timezone issues

### Getting Help

1. **Check the logs**:
   ```bash
   cd /Users/davidchinnici/cladari/plantDB
   tail -50 .next-dev.log
   ```

2. **Restart the server**:
   ```bash
   ./scripts/stop
   ./scripts/dev --bg
   ```

3. **Check database**:
   ```bash
   npx prisma studio
   ```
   Opens visual database browser at http://localhost:5555

### Data Backup

Your data is automatically backed up:
- **Daily** to Synology NAS at 10 PM
- **Hourly** via Time Machine
- **Database snapshots** kept for 30 days

Manual backup anytime:
```bash
cd /Users/davidchinnici/cladari/plantDB
./scripts/backup-to-nas.sh
```

---

## 🎯 Pro Tips

### Efficient Workflows

1. **Weekly Care Routine**:
   - Use Dashboard to see what needs attention
   - Batch care plants in same location
   - Record EC/pH for trend analysis

2. **Photo Documentation**:
   - Take photos in consistent lighting
   - Use same angle for growth comparison
   - Set best photo as cover for easy identification

3. **EC/pH Best Practices**:
   - Always measure runoff when possible
   - Record baseline feed values (pH 5.9, EC 1.1)
   - Watch for variance trends, not single readings

4. **Organization**:
   - Use location feature to group plants
   - Keep notes concise but descriptive
   - Tag plants for easy filtering

### Data Entry Tips

- **Dates**: Click calendar icon for date picker
- **Numbers**: Tab through fields quickly
- **Dropdowns**: Type first letter to jump to options
- **Multi-select**: Hold Cmd to select multiple plants

---

## 📈 Understanding Your Data

### Plant Health Indicators

- **Healthy**: Normal growth, no issues
- **Stressed**: Showing signs of problems
- **Recovering**: Improving after treatment
- **Diseased**: Active pest/disease issue

### Care Frequency Guidelines

- **Watering**: Every 5-7 days (climate dependent)
- **Fertilizing**: Every 14 days during growth
- **EC/pH Check**: With each watering
- **Photos**: Monthly for growth tracking
- **Measurements**: Quarterly for mature plants

### Financial Tracking

- **Acquisition Cost**: What you paid
- **Market Value**: Current estimated worth
- **Elite Genetics**: Premium breeding lines
- **For Sale**: Plants available to sell

---

## 🚀 Advanced Features

### ML-Powered Recommendations

The Recommendations tab uses your care history to predict:
- Next watering date
- Optimal fertilizer schedule
- EC/pH adjustments needed
- Repotting timeline

### Journal System

Every action creates a journal entry:
- Automatic entries from care logs
- Manual notes and observations
- Photo uploads tracked
- Complete audit trail

### Breeding Management

Track your breeding program:
- Parent plant relationships
- F1/F2 generation tracking
- Cross success rates
- Trait inheritance patterns

---

## 📝 Quick Reference Card

### Essential URLs
- **Main App**: http://localhost:3000
- **Database Viewer**: http://localhost:5555 (run `npx prisma studio`)

### File Locations
- **Database**: `/prisma/dev.db`
- **Photos**: `/public/uploads/photos/`
- **Backups**: `/backups/`
- **Logs**: `/.next-dev.log`

### Emergency Commands
```bash
# If app crashes
./scripts/stop
./scripts/dev --bg

# If database locked
pkill -f "prisma studio"

# Force backup
./scripts/backup-to-nas.sh

# View recent activity
tail -f .next-dev.log
```

---

## 🎉 Enjoy Managing Your Collection!

Remember: This system grows with your collection. Every plant tracked, every measurement recorded, and every photo uploaded makes the system smarter and more valuable for your breeding program.

**Happy Growing! 🌿**

---

*End of Operator Manual v1.2.0*