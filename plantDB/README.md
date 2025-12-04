# 🌿 Cladari PlantDB

## Advanced Anthurium Collection Management System

A production-grade web application for managing high-value Anthurium collections with comprehensive tracking of genetics, morphology, care schedules, and breeding programs.

![Version](https://img.shields.io/badge/version-1.3.0-green.svg)
![Status](https://img.shields.io/badge/status-production-brightgreen.svg)
![Plants](https://img.shields.io/badge/plants-67+-blue.svg)
![Value](https://img.shields.io/badge/value-$11,469-yellow.svg)

---

## ✨ Features

### 📸 Photo Management
- **Multi-photo upload** with EXIF extraction
- **Cover photo selection** for plant cards
- **8 photo categories** including stem, catophyl, base
- **Automatic thumbnail generation**
- **Growth stage tracking**

### 🧪 EC/pH Monitoring
- **Input/output tracking** for substrate analysis
- **Automated health scoring** (0-100 scale)
- **Drift detection** and trend analysis
- **Critical alerts** for pH/EC issues
- **Paired reading analysis**

### 📦 Batch Operations
- **Quick Care (Cmd+K)** for rapid logging
- **Batch care** for multiple plants
- **Location-based operations**
- **Rain tracking** with amount/duration
- **Baseline feed automation**

### 🤖 AI Assistant Integration
- **Embedded AI chat** directly in PlantDB UI
- **Plant-specific context** on detail pages
- **F2 GPU-powered** Mistral-Nemo-12B (12B params)
- **Smart query routing** (database vs. knowledge)
- **Anti-hallucination** for collection queries
- **Floating assistant** on plant list page
- **Local fallback** for offline operation
- **Clean responses** (no system prompts visible)

Also includes:
- **MCP Server** for external AI integration
- **Vector embeddings** schema ready
- **Care prediction** algorithms

### 🧬 Breeding Pipeline (NEW v1.3.0)
- **Cross Tracking** - CLX-YYYY-### notation with female × male parents
- **Category Detection** - INTRASPECIFIC, INTERSPECIFIC, INTERSECTIONAL
- **Harvest Management** - Multiple berry harvests per cross
- **Seed Batches** - Germination tracking (SDB-YYYY-###)
- **Seedling Records** - Individual tracking (SDL-YYYY-####)
- **Selection Workflow** - GROWING → KEEPER/HOLDBACK/CULL
- **Graduation System** - Seedlings promote to Plant table

### 📊 Analytics Dashboard
- **Care queue** with priority sorting
- **Collection statistics** and value tracking
- **EC/pH trends** visualization
- **Vendor performance** metrics
- **Critical plant alerts**

### 🔒 Data Protection
- **Automated daily backups** to NAS
- **30-day snapshot retention**
- **Time Machine integration**
- **Export to CSV/SQL**
- **Photo backup included**

### 🌱 Core Plant Management
- **Plant Database** - Track accessions, lineage, genetics, breeding records
- **Smart Filtering & Sorting** - Adaptive care-based sorting, persistent filters
- **Location Management** - Monitor environmental conditions (DLI, VPD, CO₂)
- **Reproductive Phenology** - Track flowering cycles and fertility windows
- **Temporal Morphology** - Document phenotypic changes over time
- **Pest Management** - Discovery and treatment tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- macOS (optimized for Mac)
- 4GB RAM minimum

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/plantdb.git
cd plantDB

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Start development server
./scripts/dev --bg
```

### Access the Application

- **Main App**: http://localhost:3000
- **Database UI**: `npx prisma studio` → http://localhost:5555

---

## 📚 Documentation

- **[Operator Manual](OPERATOR_MANUAL.md)** - User guide for daily operations
- **[Engineer Manual](docs/CLADARI_ENGINEER_MANUAL.md)** - Technical documentation
- **[Integration Guide](INTEGRATION.md)** - Sovria AI integration via MCP
- **[MCP Server](mcp-server/README.md)** - Natural language interface
- **[Backup Setup](docs/BACKUP_SETUP.md)** - Automated backup configuration
- **[Location Management](docs/LOCATION_MANAGEMENT.md)** - Environmental tracking
- **[ML Integration Roadmap](docs/ML_INTEGRATION_ROADMAP.md)** - AI/ML plans
- **[Reproductive Phenology](docs/REPRODUCTIVE_PHENOLOGY.md)** - Breeding cycles

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **Database**: SQLite + Prisma ORM
- **UI**: Tailwind CSS + Glassmorphism
- **Language**: TypeScript
- **Icons**: Lucide React
- **Charts**: Recharts
- **Photos**: Sharp for image processing

---

## 📁 Project Structure

```
plantDB/
├── mcp-server/          # MCP server for Sovria integration
│   ├── index.ts        # MCP server implementation
│   ├── README.md       # MCP setup guide
│   └── dist/          # Compiled JavaScript
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db           # SQLite database
├── src/
│   ├── app/             # Next.js app routes
│   │   ├── plants/      # Plant management
│   │   ├── breeding/    # Breeding pipeline UI
│   │   ├── batch-care/  # Batch operations
│   │   ├── locations/   # Location management
│   │   └── api/        # API endpoints
│   ├── components/      # React components
│   │   └── care/       # Care-related components
│   └── lib/            # Utilities & helpers
│       ├── care/       # Care algorithms
│       └── ml/         # ML functions
├── public/
│   └── uploads/        # Photo storage
│       ├── photos/     # Original photos
│       └── thumbnails/ # Generated thumbnails
├── scripts/            # Automation scripts
├── docs/              # Documentation
└── backups/           # Backup directory
```

---

## 🤖 MCP Server Integration

PlantDB includes a Model Context Protocol (MCP) server that enables natural language interaction through Sovria AI:

### Available Tools
- **search_plants** - Natural language plant search ("Find velvety plants with red veins")
- **predict_care** - ML-powered care predictions ("Which plants need water today?")
- **diagnose_symptoms** - Plant health analysis ("Diagnose yellowing leaves")
- **get_plant_details** - Retrieve plant information and statistics

### Quick Setup
```bash
# Build MCP server
cd mcp-server && npm install && npm run build

# Add to Sovria config (~/.config/claude/claude_desktop_config.json)
{
  "mcpServers": {
    "plantdb": {
      "command": "node",
      "args": ["/path/to/plantDB/mcp-server/dist/index.js"]
    }
  }
}
```

### Example Queries
- "Which plants need water today?"
- "Show me my most valuable Anthuriums"
- "Diagnose the yellowing on my Crystallinum"
- "Search for plants with velvety leaves"

See [Integration Guide](INTEGRATION.md) for complete setup instructions.

---

## 🎯 Key Features in Detail

### Plant Management
- **Unique IDs**: ANT-2025-XXXX format
- **13 Anthurium sections**: Full taxonomic support
- **Parent/offspring tracking**: Complete lineage (sexual + asexual)
- **Morphological traits**: Detailed phenotyping
- **Financial valuation**: Market value tracking
- **Generation tracking**: F1, F2, S1, BC1, etc.

### Breeding Pipeline
- **Cross notation**: CLX-YYYY-### with female × male
- **Cross categories**: Auto-detected from parent sections
- **Harvest tracking**: Multiple harvests per cross
- **Seed batches**: SDB-YYYY-### with germination conditions
- **Seedling tracking**: SDL-YYYY-#### individual records
- **Selection status**: GROWING, KEEPER, HOLDBACK, CULL, GRADUATED
- **Graduation**: Promotes seedlings to full Plant records

### Care Tracking
- **Smart scheduling**: ML-powered predictions
- **Fertilizer management**: Baseline + incremental
- **Pest tracking**: Discovery to treatment
- **Repotting logs**: Substrate details included
- **Growth measurements**: Time-series data

### Photo System
- **Multi-upload**: Batch photo processing
- **EXIF extraction**: Camera metadata preserved
- **Cover selection**: Choose display photo
- **8 categories**: Comprehensive documentation
- **Auto-thumbnails**: Performance optimized

### EC/pH Analysis
- **Paired readings**: Input vs output analysis
- **Variance detection**: Salt buildup alerts
- **pH drift tracking**: Substrate aging monitor
- **Health scoring**: 0-100 substrate health
- **Trend visualization**: Historical patterns

### Environmental Monitoring
- **DLI tracking**: Daily light integral
- **VPD calculation**: Vapor pressure deficit
- **CO₂ monitoring**: PPM tracking
- **Temperature/humidity**: Full climate data
- **Equipment tracking**: Lights, fans, timers

---

## 📈 Performance Metrics

- **Plant list load**: <200ms
- **Photo upload**: <2s with thumbnails
- **Search response**: <50ms
- **Database size**: ~50MB
- **Photo storage**: ~2GB
- **Backup size**: ~2.5GB total

---

## ⌨️ Keyboard Shortcuts

- `Cmd+K` - Quick care modal
- `/` - Focus search (on plant list)
- `Esc` - Close modals
- `Enter` - Submit forms

---

## 🔧 Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
# Create migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Push schema changes (development)
npx prisma db push
```

### Building for Production
```bash
npm run build
npm start
```

### Backup Management
```bash
# Manual backup
./scripts/backup-to-nas.sh

# Check backup status
launchctl list | grep cladari

# View backup logs
tail -20 logs/backup.log
```

---

## 🐛 Recent Fixes (v1.2.0)

- ✅ **Dropdown z-index**: Menus now appear above cards
- ✅ **Timezone handling**: EST standardized across system
- ✅ **pH drift detection**: False positives eliminated
- ✅ **EC averaging**: Uses last 3 logs for accuracy
- ✅ **Pest status**: Only shows active issues
- ✅ **Repotting fields**: Proper editing behavior
- ✅ **Cover photo**: New selection feature added

---

## 📅 Roadmap

### Phase 2 (Q1 2026)
- [ ] QR code generation for plant labels
- [ ] Mobile PWA for field work
- [ ] SensorPush integration
- [ ] Darwin Core export format
- [ ] Advanced search filters
- [ ] Care calendar view

### Phase 3 (Q2 2026)
- [x] MCP server integration (✅ Completed Nov 2025)
- [ ] Vector search capabilities
- [ ] PostgreSQL migration (>1000 plants)
- [ ] Photo AI analysis
- [ ] Automated pest detection
- [ ] Growth prediction models

### Phase 4 (Q3 2026)
- [ ] Custom ML models
- [ ] Breeding recommendations AI
- [ ] Multi-user collaboration
- [ ] Marketplace features
- [ ] DNA sequence storage
- [ ] BLAST search integration

---

## 🤝 Contributing

This is currently a private project for managing a personal Anthurium collection. If you're interested in similar features for your collection, feel free to fork and adapt!

---

## 📄 License

Private project - All rights reserved

---

## 🙏 Acknowledgments

- Built for the Cladari Anthurium collection
- Inspired by botanical database standards
- Optimized for serious plant collectors
- Developed with assistance from Claude AI

---

## 📞 Support

For issues or questions:
1. Check the [Operator Manual](OPERATOR_MANUAL.md)
2. Review the [Engineer Manual](docs/CLADARI_ENGINEER_MANUAL.md)
3. Check logs: `tail -50 .next-dev.log`
4. Database issues: `npx prisma studio`

### Common Commands
```bash
# Start server
./scripts/dev --bg

# Stop server
./scripts/stop

# View database
npx prisma studio

# Check plant count
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Plant;"

# Export to CSV
curl http://localhost:3000/api/plants/export > plants.csv
```

---

## 🌟 Recent Updates

- **v1.3.0** - Complete breeding pipeline (Dec 2025)
- **v1.2.0** - Cover photo selection, bug fixes
- **v1.1.9** - Photo management system
- **v1.1.8** - EC/pH analysis system
- **v1.1.7** - Batch care & quick care
- **v1.1.6** - ML foundation & journal
- **v1.1.5** - Automated backups
- **v1.1.4** - Location management
- **v1.1.3** - Reproductive phenology
- **v1.1.2** - Temporal morphology
- **v1.1.1** - Data standardization

---

**Happy Growing! 🌱**

*Last Updated: December 4, 2025*