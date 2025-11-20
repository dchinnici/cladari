# Cladari Plant Management (plantDB)

Cladari is a web UI + database for tracking anthurium plants: profiles, care logs, EC/pH measurements, morphology traits, breeding records, vendors, and analytics.

This repo contains a ready‑to‑run Next.js app (in `plantDB/`) plus root‑level helper scripts so you can start, stop, and manage the database without remembering Prisma commands.

## TL;DR

- Start dev server (hot reload): `./scripts/dev` then open `http://localhost:3000`
- Start prod server (optimized): `./scripts/start`
- Stop background servers: `./scripts/stop`
- Health check: `./scripts/health --host f1`
- Prisma helpers: `./scripts/db <generate|migrate|studio|import|use-pg>`
- Tailscale Serve (optional HTTPS): `./scripts/ts-serve --port 3000`

## Repository Layout

- `plantDB/` – the Next.js app root (UI + API + Prisma)
  - `src/app/` – pages, API routes, UI
  - `src/components/AIAssistant.tsx` – AI chat component
  - `prisma/schema.prisma` – SQLite dev schema (active)
  - `prisma/schema.postgres.prisma` – Postgres + JSON (+ pgvector ready) schema
  - `OPERATOR_MANUAL.md` – app overview and technical manual
- `ai/` – [submodule: cladari-ai] botanical AI service
  - Flask API server + LLM routing
  - Connects to F2 GPU for Mistral-Nemo/PLLaMa
  - See: https://github.com/dchinnici/cladari-ai
- `scripts/` – root helpers you run from the repo root
  - `dev`, `start`, `stop` – run/stop the server (dev/prod)
  - `db` – Prisma helper (generate/migrate/studio/import/use-pg)
  - `ts-serve` – expose the app via Tailscale Serve
  - `health` – quick HTTP + DB health check

## Quickstart

1) Clone with submodules
```bash
git clone --recurse-submodules git@github.com:dchinnici/cladari.git
cd cladari
```

2) Install dependencies
```bash
cd plantDB && npm i && npx prisma generate && cd ..
```

3) Start AI service (optional, for AI Assistant features)
```bash
cd ai && ./start.sh &  # Runs on port 8091
cd ..
```

4) Start PlantDB
```bash
./scripts/dev  # Dev server with hot reload
# OR
./scripts/start  # Production build
```

5) Access
- PlantDB: `http://localhost:3000` (or `http://f1:3000` on tailnet)
- AI Server: `http://localhost:8091`

## AI Integration

The AI Assistant is embedded in PlantDB:
- **Plant Detail Pages**: "AI Assistant" tab for plant-specific queries
- **Plant List**: Floating AI button (green circle) for collection queries
- **Smart Routing**: Database queries use real data, botanical queries use LLM
- **F2 GPU**: Connects to Mistral-Nemo-12B on F2 when available
- **Local Fallback**: Works without F2 for basic queries

See `ai/README.md` for full AI service documentation.

## Database

- Default: SQLite in `plantDB/prisma/dev.db` (simple and durable for local use)
- Prisma client is generated from `plantDB/prisma/schema.prisma`
- Common tasks (from repo root):
  - Generate client: `./scripts/db generate`
  - Apply migrations: `./scripts/db migrate --name my_change`
  - Prisma Studio: `./scripts/db studio`
  - Import Excel data: `./scripts/db import`

## Postgres + pgvector (Optional)

- A Postgres‑compatible schema is included: `plantDB/prisma/schema.postgres.prisma`
- When ready:
  - Provision Postgres and enable `CREATE EXTENSION IF NOT EXISTS vector;`
  - `./scripts/db generate --pg`
  - `./scripts/db migrate --pg --name init`
  - Point `DATABASE_URL` to your Postgres DSN in `plantDB/.env`
  - (Optional) add vector columns via SQL migration, e.g. `ALTER TABLE "Genetics" ADD COLUMN traitEmbedding vector(768);`

## Web UI Highlights

- Plants list and detail view (overview, care, EC/pH, morphology, photos, breeding, logs)
- Batch care: apply an action to many plants with EC/pH inputs/outputs
- Dashboard: distribution by complex, top vendors, elite lineages, activity
- Create Plant modal, toasts for success/errors, mobile‑friendly

## Health Check

- `./scripts/health --host f1` verifies HTTP endpoints and DB connectivity
- Useful when starting background servers or exposing over Tailscale

## Documentation

- How‑to manual: `docs/INSTRUCTION_MANUAL.md`
- Technical operator manual (database, models, APIs): `plantDB/OPERATOR_MANUAL.md`

## Troubleshooting

- Prisma schema not found: run from repo root with `./scripts/db generate` (the script points Prisma to the correct schema path)
- Fonts or build failing offline: we disabled Google Fonts; builds should work without network
- Tailscale name resolution: ensure MagicDNS is enabled; otherwise use your Tailscale IP

## License

Private. Do not distribute.

