# Deferred Tasks: Production Deployment Roadmap

**Created:** December 20, 2025
**Target:** Alpha users (5-10 breeders/researchers) by end of Q1 2025
**Context:** Solo dev, balancing velocity with security

---

## Priority Tiers

| Tier | Meaning | When to Address |
|------|---------|-----------------|
| **P0 - CRITICAL** | Security vulnerabilities, data exposure | Before ANY public deploy |
| **P1 - HIGH** | Functional blockers for multi-user | Before alpha user onboarding |
| **P2 - MEDIUM** | Quality/reliability improvements | During alpha, before scaling |
| **P3 - LOW** | Nice-to-have, optimization | Post-alpha based on feedback |

---

## P0 - CRITICAL (Must Fix Before Public Deploy)

### Security Vulnerabilities

| Task | File | Status | Effort | Notes |
|------|------|--------|--------|-------|
| Add auth to care-logs POST | `src/app/api/plants/[id]/care-logs/route.ts` | ✅ DONE | 10 min | Added getUser() auth + ownership check (Dec 20) |
| Add auth to sensors GET | `src/app/api/sensorpush/sensors/route.ts` | ✅ DONE | 10 min | Added getUser() auth check (Dec 20) |
| Fix Zebra shell injection | `src/app/api/print/zebra/route.ts` | ✅ DONE | 20 min | Replaced execAsync with spawn() + stdin pipe (Dec 20) |
| Add cron secret to sensor sync | `src/app/api/sensorpush/sync/route.ts` | ✅ DONE | 15 min | Added CRON_SECRET header check + user auth fallback (Dec 20) |

**P0 Complete!** All critical security fixes applied (Dec 20, 2025)

---

## P1 - HIGH (Before Alpha Users)

### Multi-User Security

| Task | File | Status | Effort | Notes |
|------|------|--------|--------|-------|
| Validate ownership in batch-care | `src/app/api/batch-care/route.ts` | ✅ DONE | 30 min | Added auth + ownership verification for all plantIds (Dec 20) |
| Add locationId ownership check | `src/app/api/chat/route.ts` | ✅ DONE | 20 min | Added auth + locationId ownership check (Dec 20) |
| Add auth to sensorpush sync POST | `src/app/api/sensorpush/sync/route.ts` | ✅ DONE | 15 min | Added auth + location ownership to POST/DELETE (Dec 20) |

### Multi-Tenant Infrastructure

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Multi-tenant SensorPush credentials | 🟡 TODO | 2-4 hrs | Currently uses single global SENSORPUSH_EMAIL/PASSWORD |
| Row Level Security policies | 🟡 PREPARED | 1 hr | Scripts exist in `scripts/setup-rls-policies.sql`, need to apply |

### Error Handling

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Wrap ML predictor calls in try-catch | 🟡 TODO | 30 min | Recommendations endpoint can 500 if predictor throws |
| Add input validation to chat API | 🟡 TODO | 30 min | No schema validation on messages/plantContext |
| Standardize Prisma error responses | 🟡 TODO | 1 hr | Return 409 for unique constraint, 404 for not found, etc. |

**Total P1 effort: ~6-8 hours**

---

## P2 - MEDIUM (During Alpha, Before Scaling)

### API Quality

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Create Zod schemas for inputs | 🔵 TODO | 4 hrs | plants, care-logs, breeding records |
| Add rate limiting middleware | 🔵 TODO | 4 hrs | Protect expensive operations (semantic search, chat) |
| Migrate pages to useApi hook | 🔵 TODO | 6 hrs | Consistent error handling, retries |
| Standardize date handling | 🔵 TODO | 2 hrs | Multiple approaches in codebase |

### Data Quality

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Move rain thresholds to DB config | 🔵 TODO | 2 hrs | Currently hardcoded in wateringPredictor.ts |
| Add JSON.parse error handling | 🔵 TODO | 1 hr | Several routes lack try-catch around JSON.parse |
| Randomize temp file names | 🔵 TODO | 30 min | Photo upload uses predictable paths |

### AI Intelligence (Temporal Segmentation)

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| LocationHistory model | 🔵 TODO | 3 hrs | Track plant moves between locations over time |
| Epoch boundary detection | 🔵 TODO | 2 hrs | Flag repots/treatments as discontinuities in trend analysis |
| AI context injection for epochs | 🔵 TODO | 2 hrs | "Plant was repotted Dec 13, analyze in two epochs" |
| Chart event annotations | 🔵 TODO | 3 hrs | Vertical markers for repots, treatments, moves on insight graphs |
| Substrate mix correlation | 🔵 TODO | 2 hrs | Track which mix (4.0 vs 4.5) affects pH drift rates |

**Why this matters:** AI currently treats all data as one continuous timeline. A plant that was in a humid grow tent (0.3 VPD) then moved to a dry bathroom gets analyzed as if it experienced "stress events" when the damage was actually from the opposite condition. Repots reset substrate health, but AI sees it as one trend. This ~10-12 hour feature block unlocks significantly more accurate environmental correlation.

### Monitoring

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Add structured logging | 🔵 TODO | 4 hrs | Currently using console.log/error |
| Add API response time tracking | 🔵 TODO | 2 hrs | Identify slow endpoints |
| Error aggregation (Sentry/LogRocket) | 🔵 TODO | 2 hrs | Catch production errors |

**Total P2 effort: ~25-30 hours**

---

## P3 - LOW (Post-Alpha Based on Feedback)

### Performance

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Add React.memo to expensive components | 🔵 TODO | 4 hrs | HealthMetrics, JournalTab |
| Lazy load heavy components | 🔵 TODO | 2 hrs | AIAssistant, modal forms |
| Optimize Prisma queries | 🔵 TODO | 4 hrs | Add select() to reduce payload size |

### Compliance

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| GDPR data export endpoint | 🔵 TODO | 4 hrs | User can download all their data |
| GDPR data deletion endpoint | 🔵 TODO | 4 hrs | User can request account deletion |
| Audit logging for mutations | 🔵 TODO | 8 hrs | Who changed what, when |

### Testing

| Task | Status | Effort | Notes |
|------|--------|--------|-------|
| Add unit tests for ML modules | 🔵 TODO | 8 hrs | statisticalAnalyzer, wateringPredictor |
| Add E2E tests for critical flows | 🔵 TODO | 12 hrs | Plant CRUD, care logging, auth |
| Add API integration tests | 🔵 TODO | 8 hrs | All endpoints |

**Total P3 effort: ~50+ hours**

---

## Pre-Deploy Checklist

### Before Vercel Deploy ✅ COMPLETE (Dec 20, 2025)
- [x] All P0 tasks complete
- [x] Environment variables configured in Vercel
- [x] Custom domain configured (www.cladari.ai)
- [x] Google OAuth configured and working
- [ ] Supabase RLS policies applied (scripts ready, not yet applied)
- [x] CORS settings for production domain

### Before Alpha User Invites (IN PROGRESS)
- [x] P0 tasks complete
- [ ] All P1 tasks complete (multi-tenant SensorPush, RLS policies remain)
- [ ] User onboarding flow tested
- [ ] Data isolation verified (create test user, verify they can't see your data)
- [ ] Basic error tracking in place (Sentry?)
- [ ] Support channel established (Discord? Email?)

### Before Public Launch
- [ ] All P2 tasks complete
- [ ] Rate limiting active
- [ ] Monitoring dashboards
- [ ] Backup/restore tested
- [ ] Privacy policy and ToS

---

## Quick Reference: Files to Audit Before Deploy

```
src/
├── app/api/
│   ├── plants/[id]/care-logs/route.ts  # P0: Add auth
│   ├── sensorpush/
│   │   ├── sensors/route.ts            # P0: Add auth
│   │   └── sync/route.ts               # P0: Cron secret, P1: Auth
│   ├── batch-care/route.ts             # P1: Ownership validation
│   ├── chat/route.ts                   # P1: locationId ownership
│   └── print/zebra/route.ts            # P0: Shell injection
├── middleware.ts                        # Review protected paths
└── lib/
    └── ml/wateringPredictor.ts         # P2: DB config for thresholds
```

---

## Notes

- **Gemini identified:** Single-tenant SensorPush as architectural blocker
- **Claude identified:** Shell injection, care-logs auth, batch ownership
- **Both identified:** Missing auth on sensorpush endpoints
- **Deferred by design:** Audit logging, GDPR, rate limiting (not critical for 5-10 trusted alpha users)

---

*Last updated: December 22, 2025*
