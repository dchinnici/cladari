
┌─────────────────────────────────────────────────────────────────┐
│                      Consumer Mobile App                         │
│                   (React Native + Expo)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │Dashboard│ │My Plants│ │Care Log │ │Insights │               │
│  │(Whoop-  │ │         │ │(Quick   │ │(Weekly  │               │
│  │ style)  │ │         │ │ entry)  │ │ report) │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST/GraphQL
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cladari API (Shared Backend)                  │
│                    (Next.js API or separate Node/FastAPI)        │
│  ├── Auth (Clerk / Supabase)                                    │
│  ├── Multi-tenant data layer                                    │
│  ├── Subscription management (RevenueCat / Stripe)              │
│  └── AI/ML endpoints (care prediction, health scoring)          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL (Multi-tenant)                           │
│  ├── Users, Organizations                                        │
│  ├── Plants (adapted from your Prisma schema)                   │
│  ├── CareLogs, Measurements, Health Scores                      │
│  └── Subscriptions, Feature Flags                               │
└─────────────────────────────────────────────────────────────────┘



cladari/
├── apps/
│   ├── admin/        ← Current PlantDB (your power-user tool)
│   ├── api/          ← Shared backend
│   └── mobile/       ← React Native consumer app
├── packages/
│   ├── database/     ← Prisma schema (shared)
│   ├── types/        ← Shared TypeScript types
│   └── utils/        ← Shared utilities
└── turbo.json        ← Turborepo config


