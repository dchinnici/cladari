# Cladari Instruction Manual

This manual walks you through day‑to‑day usage, environment setup, database tasks, Tailscale access, and how dev vs prod modes differ.

If you're looking for database models, API endpoints, and system history, see also: `plantDB/OPERATOR_MANUAL.md`.

## 1) Mental Model

- Web UI: a Next.js app that serves pages (UI) and routes (API) under `plantDB/src/app`.
- Database: SQLite by default (`plantDB/prisma/dev.db`) managed via Prisma; easy to migrate to Postgres later.
- Scripts: run from the repo root to start/stop servers, manage Prisma, and expose over Tailscale.

## 2) Prerequisites

- Node.js 18+ and npm
- (Optional) Tailscale CLI for tailnet access and Serve
- (Optional) Postgres if/when you migrate

## 3) Install & Build

- Install once: `cd plantDB && npm i && npx prisma generate && cd ..`
- Dev server (hot reload): `./scripts/dev`
- Prod server (optimized): `./scripts/start`
- Stop background servers: `./scripts/stop`

## 4) Dev vs Prod

- Dev (./scripts/dev)
  - Hot reload for quick iteration
  - Ideal for editing UI/logic and verifying changes
  - Slightly slower runtime due to live recompiles
- Prod (./scripts/start)
  - Builds optimized assets, no hot reload
  - More stable for daily data entry and demos
  - Recommended when focusing on content rather than code

Both modes talk to the same default SQLite database unless you change `DATABASE_URL`.

## 5) Access via Tailscale

- Direct over tailnet: `http://f1:3000` (MagicDNS) or `http://<ts-ip>:3000`
- HTTPS via Tailscale Serve (auto‑enabled in background by default)
  - Dev BG: `./scripts/dev --bg`
  - Prod BG: `./scripts/start --bg`
  - Manual control: `./scripts/ts-serve --status | --off | --port 3000`
- Disable Serve when starting: add `--no-ts` to `dev`/`start`

## 6) Using the Web UI

- Plants list: browse, search, filter, and open a plant detail
- Create Plant: on `/plants` use the Add Plant modal; confirm via toast
- Plant detail tabs:
  - Overview: edit species, hybrid, cost, health
  - Care & Notes: structured care notes saved as JSON in `notes`
  - EC & pH: add solution measurements (EC / pH / TDS)
  - Morphology: traits (leaf/spadix/spathe/growth) upserted per trait
  - Photos: (stub) shows metadata; upload to be implemented
  - Breeding: parentage and cross IDs (`crossId`)
  - Care Logs: append activities with optional EC/pH input/output
- Batch Care: apply one action to multiple plants with EC/pH input/output
- Dashboard: species/complex distribution, top vendors, elite lines, recent activity

## 7) Database Tasks (Prisma)

From repo root using the helper script:

- Generate client: `./scripts/db generate`
- Migrate: `./scripts/db migrate --name my_change`
- Studio: `./scripts/db studio`
- Push (no migration): `./scripts/db push`
- Import Excel -> SQLite dev DB: `./scripts/db import`

SQLite database lives at `plantDB/prisma/dev.db`. Back it up periodically by copying the file.

## 8) Postgres + pgvector (Optional)

- Use the Postgres schema when ready: `plantDB/prisma/schema.postgres.prisma`
- Commands with `--pg`:
  - `./scripts/db generate --pg`
  - `./scripts/db migrate --pg --name init`
- Set `DATABASE_URL` to a Postgres DSN in `plantDB/.env`
- Add vector columns via SQL (example: `ALTER TABLE "Genetics" ADD COLUMN traitEmbedding vector(768);`)
- After migration, update code to store/read real JSON (no stringify/parse) for fields marked `Json`

## 9) Health Check

- `./scripts/health --host f1` checks `/`, `/api/plants`, `/api/dashboard/stats`, and DB connectivity
- Use before sharing links or when starting background servers

## 10) Troubleshooting

- Prisma can't find schema:
  - Use `./scripts/db generate` (script points to `plantDB/prisma/schema.prisma`)
- Fonts download errors offline:
  - Already disabled; layout uses system font; builds should work without network
- Tailscale DNS name not resolving:
  - Enable MagicDNS or use the device's Tailscale IP
- Migration failed due to trait duplicates:
  - We included a dedupe script at `plantDB/scripts/dedupe-traits.js`. Ask if you want a root wrapper.

## 11) Scripts Reference

- `./scripts/dev [--bg] [--port N] [--host 0.0.0.0] [--no-ts]`
  - Start dev; when `--bg`, auto‑enables Tailscale Serve
- `./scripts/start [--bg] [--port N] [--host 0.0.0.0] [--no-ts]`
  - Build and start prod; when `--bg`, auto‑enables Tailscale Serve
- `./scripts/stop`
  - Stop background dev/prod servers
- `./scripts/db <generate|migrate|push|studio|import|use-pg> [--pg]`
  - Prisma helper; `--pg` toggles to Postgres schema
- `./scripts/ts-serve [--port N] [--status|--off]`
  - Enable/inspect/disable Tailscale Serve
- `./scripts/health [--host f1] [--port 3000] [--url http://...] [--timeout N]`
  - HTTP + DB checks

## 12) What Changed (Highlights)

- Unified app under `plantDB/` with root scripts
- Schema/API/UI aligned for measurements, traits, breeding, and photos
- Added POST /api/plants and Create Plant modal
- Rebranded UI to Cladari; added toasts; removed Google Fonts network dependency
- Added Postgres schema and migration plan; left SQLite as the default for simplicity

## 13) Next Steps

- Photo upload flow (including storage and EXIF parsing)
- Optional: move to Postgres + pgvector for richer analytics and ML embeddings
- Add more validations and tests

