# Cladari Plant Management System

**Version 1.3.0** | Production-grade Anthurium collection & breeding database

## Quick Start

```bash
cd plantDB && npm i && npx prisma generate   # First time only
./scripts/dev                                 # Start dev server
# Open http://localhost:3000
```

## Repository Structure

```
cladari/
├── plantDB/              # Main Next.js application
│   ├── README.md         # Full app documentation
│   ├── OPERATOR_MANUAL.md # User guide
│   ├── CHANGELOG.md      # Version history
│   └── docs/             # Technical documentation
├── mcp-server/           # AI integration (MCP protocol)
├── ai/                   # [submodule] Botanical AI service
├── scripts/              # Dev/prod server scripts
└── CLAUDE.md             # AI assistant context
```

## Key Features

- **Plant Management**: 70+ plants with full CRUD, photos, care tracking
- **Breeding Pipeline (NEW v1.3.0)**: Cross → Harvest → SeedBatch → Seedling → Plant
- **Care System**: EC/pH monitoring, batch operations, quick care (Cmd+K)
- **Photo Management**: Cover selection, EXIF extraction, thumbnails
- **MCP Server**: Natural language queries via Sovria AI

## Essential Commands

| Command | Description |
|---------|-------------|
| `./scripts/dev` | Start dev server (hot reload) |
| `./scripts/stop` | Stop background servers |
| `./scripts/db studio` | Visual database editor |
| `./scripts/db generate` | Regenerate Prisma client |

## Documentation

All detailed documentation lives in `plantDB/`:
- **[README.md](plantDB/README.md)** - Full feature documentation
- **[OPERATOR_MANUAL.md](plantDB/OPERATOR_MANUAL.md)** - User guide
- **[docs/](plantDB/docs/)** - Technical deep-dives

## Access

- **Local**: http://localhost:3000
- **Tailscale**: http://f1:3000
- **Database UI**: `npx prisma studio` → http://localhost:5555

---

*Private project - All rights reserved*

