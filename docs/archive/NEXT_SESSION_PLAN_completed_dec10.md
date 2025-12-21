# Plant Detail Page Refactor

**Created:** December 10, 2025
**Status:** COMPLETED
**Completed:** December 10, 2025

---

## Summary

Successfully refactored the plant detail page from 9 scattered tabs into 5 focused tabs:

### Tab Structure Change

| Before (9 tabs) | After (5 tabs) |
|-----------------|----------------|
| overview | **overview** (consolidated: health + AI + quick actions + details) |
| recommendations | → merged into overview (HealthMetrics) |
| care | → merged into overview (Plant Details section) |
| morphology | → merged into journal |
| flowering | **flowering** (unchanged) |
| photos | **photos** (unchanged) |
| breeding | **lineage** (renamed, enhanced) |
| logs | → merged into journal |
| ai | → moved to overview |
| — | **journal** (NEW: unified timeline) |

---

## Components Created

1. **`src/components/plant/HealthMetrics.tsx`**
   - Displays ML predictions (substrate health, watering schedule, trajectory)
   - Shows alerts and risk factors
   - EC/pH trend visualization

2. **`src/components/plant/QuickActions.tsx`**
   - Water, Feed, Note, Photo buttons
   - One-click access to common actions

3. **`src/components/plant/JournalTab.tsx`**
   - Unified timeline for care logs, notes, morphology, measurements
   - Filter buttons to show/hide entry types
   - Edit/delete actions on care logs

4. **`src/components/plant/JournalEntryModal.tsx`**
   - Single modal with type selector
   - Forms for care, note, morphology, measurement entries
   - Activity-specific fields (EC/pH, repotting details, pest info, etc.)

5. **`src/components/plant/LineageTab.tsx`**
   - Ancestry section (parents, clone source, breeding record origin)
   - Progeny section (offspring, clones)
   - Breeding participation (crosses as female/male parent)
   - Placeholder for future family tree visualization

---

## Key Changes

### Overview Tab Now Contains:
- Health Metrics (ML predictions, substrate health, alerts)
- AI Assistant (embedded, always visible)
- Quick Actions (Water, Feed, Note, Photo buttons)
- Plant Details (location, cost, acquisition, vendor, breeder, etc.)

### Journal Tab Features:
- Unified timeline of all plant events
- Filter by type: Care, Notes, Morphology, Measurements
- Edit/delete existing care logs
- Add entry button with type selection

### Lineage Tab (renamed from "breeding"):
- Clear distinction between RELATIONAL data (family tree) vs OBSERVATION data (journal)
- Shows ancestry, progeny, and breeding participation
- Links to related plants and breeding records

---

## File Changes

- `src/app/plants/[id]/page.tsx` - Reduced from 3140 to 2834 lines
- Created 5 new component files in `src/components/plant/`
- Removed `UpcomingCare` import (functionality moved to HealthMetrics)

---

## Design Decisions

1. **Lineage vs Genetics**: Chose "Lineage" because it's about family tree relationships, not DNA traits. Genetics would imply observable characteristics (which is morphology).

2. **Morphology in Journal**: Morphology observations are time-series data (traits can change with maturity), so they belong in the journal rather than as static fields.

3. **Single modal with type selector**: Simpler than maintaining multiple specialized modals. Type selector at top of modal allows quick switching.

4. **AI in Overview**: Most valuable when easily accessible, not hidden in separate tab.

---

## Future Enhancements

1. **Family tree visualization** - Interactive cladogram showing plant's position in breeding program
2. **Dedicated Notes modal** - Currently uses care log modal with 'other' type
3. **pgvector embeddings** - Journal entries are good candidates for semantic search

---

## Testing

- TypeScript: No errors
- Dev server: Compiles and runs successfully
- All tabs render correctly
- Quick actions open appropriate modals
- Journal filters work
- Lineage displays ancestry/progeny correctly
