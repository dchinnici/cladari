# 🌿 Cladari

**Professional Anthurium Breeding & Collection Management Platform**

A production-grade web application for managing high-value Anthurium collections with comprehensive tracking of genetics, morphology, care schedules, breeding programs, and AI-assisted plant health analysis.

[![Version](https://img.shields.io/badge/version-1.7.8-green.svg)](https://github.com/yourusername/cladari)
[![Status](https://img.shields.io/badge/status-production-brightgreen.svg)](https://www.cladari.ai)
[![Live](https://img.shields.io/badge/live-www.cladari.ai-blue.svg)](https://www.cladari.ai)

---

## ✨ Key Features

### 🌱 Plant Management
- **Unique ID System** - ANT-YYYY-#### accession numbers
- **Complete Lineage Tracking** - Sexual and asexual propagation
- **13 Anthurium Sections** - Full taxonomic support
- **Financial Valuation** - Acquisition cost and market value tracking

### 🧬 Breeding Pipeline
- **Cross Tracking** - CLX-YYYY-### notation with female × male parents
- **Category Detection** - INTRASPECIFIC, INTERSPECIFIC, INTERSECTIONAL
- **Seed Batches** - Germination tracking with environmental conditions
- **Clone Batches** - TC, division, cutting, offset management
- **Graduation Workflow** - Seedlings and clones promote to Plant records

### 🤖 AI-Powered Analysis
- **Claude Opus 4 Integration** - Extended thinking for complex diagnoses
- **Photo Analysis** - Multi-image health assessments with 4 quick-action modes
- **Environmental Correlation** - SensorPush data integrated into AI context
- **Semantic Search** - Cross-collection knowledge base via pgvector embeddings
- **HITL Quality Scoring** - Human feedback loop for ML training

### 📊 Environmental Monitoring
- **SensorPush Integration** - Live temperature, humidity, VPD tracking
- **Weather API** - Open-Meteo integration for outdoor context
- **Stress Detection** - Automated alerts for environmental extremes
- **Location Management** - Per-location sensor assignments

### 🧪 Substrate Health
- **EC/pH Tracking** - Input/output measurements per watering
- **Drift Detection** - Trend analysis for substrate aging
- **Automated Alerts** - Critical thresholds for pH and EC
- **Dynamic Care Thresholds** - Plant-specific watering schedules based on history

### 📸 Photo Documentation
- **Multi-photo Upload** - Batch processing with EXIF extraction
- **9 Photo Types** - Whole plant, leaf, petiole, spathe, spadix, etc.
- **Context Classification** - Dynamic intent tagging (emergent, damage, pest evidence)
- **Supabase Storage** - Cloud-hosted with signed URLs

### 🏷️ QR Code & Printing
- **Plant Tags** - One-click Zebra label printing
- **Location Tags** - QR codes for batch care workflows
- **Quick Care Flow** - Scan → log care in 5 seconds

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15.5.6 (App Router) |
| **Database** | Supabase PostgreSQL + Prisma ORM |
| **Auth** | Supabase Auth (Google OAuth) |
| **Storage** | Supabase Storage |
| **AI** | Claude Opus 4 via Anthropic API |
| **Embeddings** | BGE-base-en-v1.5 (768d) + pgvector |
| **Hosting** | Vercel (Production) |
| **Sensors** | SensorPush API integration |
| **Weather** | Open-Meteo API |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (for database, auth, storage)
- Anthropic API key (for AI features)

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/cladari.git
cd cladari

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your environment variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - DATABASE_URL (Supabase connection string)
# - ANTHROPIC_API_KEY

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

### Access Points
- **Development**: http://localhost:3000
- **Production**: https://www.cladari.ai
- **Database UI**: `npx prisma studio`

---

## 📁 Project Structure

```
cladari/
├── prisma/
│   └── schema.prisma          # Database schema (Postgres)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # REST API endpoints
│   │   │   ├── chat/          # AI chat (Opus 4 + context)
│   │   │   ├── ml/            # ML endpoints (semantic-search, diagnose)
│   │   │   └── sensorpush/    # Environmental monitoring
│   │   ├── plants/            # Plant management UI
│   │   ├── breeding/          # Breeding pipeline UI
│   │   └── batches/           # Clone batch management
│   ├── components/            # React components
│   └── lib/
│       ├── ml/                # ML modules (embeddings, predictors)
│       ├── care-thresholds.ts # Dynamic watering thresholds
│       └── sensorpush.ts      # SensorPush API client
├── scripts/                   # Migration and automation
└── docs/                      # Technical documentation
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | AI context and development notes |
| [OPERATOR_MANUAL.md](OPERATOR_MANUAL.md) | End-user guide |
| [docs/CLADARI_ENGINEER_MANUAL.md](docs/CLADARI_ENGINEER_MANUAL.md) | Technical reference |
| [docs/ML_VISION_PIPELINE.md](docs/ML_VISION_PIPELINE.md) | ML architecture plans |

---

## 🎯 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **1.7.8** | Dec 2025 | AI quick actions, photo context classification, dynamic thresholds |
| **1.7.7** | Dec 2025 | Enhanced stress analysis, Opus 4 restoration |
| **1.7.6** | Dec 2025 | Monorepo consolidation, print proxy via Tailscale |
| **1.7.5** | Dec 2025 | Unified breed UI, flowering events |
| **1.7.4** | Dec 2025 | Production deployment, Google OAuth |
| **1.7.0** | Dec 2025 | Supabase migration (SQLite → Postgres) |

See [CHANGELOG.md](CHANGELOG.md) for full history.

---

## 🔮 Roadmap

### Current Focus
- **Temporal Segmentation** - LocationHistory for AI epoch boundaries
- **SensorPush Optimization** - Daily aggregate caching for true min/max

### Planned
- **ML Vision Pipeline** - SAM2 + DINOv2 for morphological analysis
- **Voice Memo Import** - Whisper transcription for hands-free logging
- **Taxon Reference System** - Verified specimen database for AI comparison

---

## 🤝 About

Cladari is built for serious Anthurium breeders and collectors who need:
- **Rich documentation** over quick features
- **Data integrity** for breeding verification
- **AI assistance** grounded in actual collection data

This is the reference implementation of the **Stream Protocol** for biological provenance verification.

---

## 📄 License

Private project - All rights reserved

---

**Happy Growing! 🌱**
