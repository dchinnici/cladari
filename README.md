# Cladari Plant Management System

**Version 1.6.3** | Production plant database for breeding programs

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
│   ├── prisma/           # Database schema & SQLite
│   ├── src/app/          # App Router pages & API
│   ├── src/components/   # React components
│   ├── src/lib/          # Business logic
│   └── docs/             # Technical documentation
├── mcp-server/           # AI integration (MCP protocol)
├── ai/                   # [submodule] Botanical AI service
├── scripts/              # Dev/prod server scripts
└── CLAUDE.md             # AI assistant context
```

## Current Features (v1.6.x)

- **Plant Management**: 70 plants, photos, care logging, health tracking
- **Breeding Pipeline**: Cross → Harvest → SeedBatch → Seedling → Plant
- **AI Assistant**: Claude Opus 4 with photo analysis, HITL quality scoring
- **Environmental**: SensorPush integration, weather data, VPD tracking
- **Care System**: EC/pH monitoring, batch operations, quick care
- **QR Labels**: Zebra printer support, mobile quick-log workflow

## Recent Updates

| Version | Highlights |
|---------|------------|
| 1.6.3 | HITL quality scoring, cross-plant context isolation |
| 1.6.2 | Plant detail UX redesign (5 tabs), orphan photo recovery |
| 1.6.1 | SensorPush + Weather integrations |
| 1.6.0 | AI chat logging, unified journal |

## Essential Commands

| Command | Description |
|---------|-------------|
| `./scripts/dev` | Start dev server (hot reload) |
| `./scripts/stop` | Stop background servers |
| `./scripts/db studio` | Visual database editor |
| `./scripts/db generate` | Regenerate Prisma client |

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Full project context & strategic direction
- **[plantDB/CHANGELOG.md](plantDB/CHANGELOG.md)** - Version history
- **[plantDB/docs/](plantDB/docs/)** - Technical documentation

## Access

- **Local**: http://localhost:3000
- **Tailscale**: http://f1:3000
- **Public Site**: https://cladari.ai

---

*Private project - Fort Lauderdale, FL*
