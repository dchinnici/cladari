# Next Session Plan: Plant Detail Page Refactor

**Created:** December 10, 2025
**Status:** READY TO IMPLEMENT
**Priority:** HIGH - UX improvement, reduces tabs from 9 to 5

---

## Overview

Consolidate the plant detail page tabs from 9 scattered views into 5 focused tabs that match actual usage patterns.

## Current State (9 tabs)

```
1. overview        - Basic plant info
2. recommendations - Care Schedule (ML predictions)
3. care            - Care & Notes (static fields: soil, light, temp, etc.)
4. morphology      - Morphological traits
5. flowering       - Flowering cycles (KEEP AS IS)
6. photos          - Photo gallery (KEEP AS IS)
7. breeding        - Genetics/lineage
8. logs            - Care log history
9. ai              - AI Assistant
```

## Target State (5 tabs)

```
1. overview  - CONSOLIDATED: Health metrics + AI + Quick actions + Plant details
2. journal   - NEW: Unified timeline (care logs + notes + morphology + measurements)
3. photos    - UNCHANGED
4. flowering - UNCHANGED
5. genetics  - RENAMED from "breeding"
```

---

## Tab 1: Overview (Consolidated)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ [Cover Photo]  ANT-2025-0036            │
│                Hybrid Name · Section     │
│                📍 BALCONY · 🩺 Healthy    │
├─────────────────────────────────────────┤
│ HEALTH METRICS                          │
│ ┌─────────┬─────────┬─────────────────┐ │
│ │Substrate│ Water   │ Growth          │ │
│ │ 78/100  │ 5 days  │ +2 leaves/mo    │ │
│ │ ▼ drift │ avg 6d  │ stable          │ │
│ └─────────┴─────────┴─────────────────┘ │
│                                         │
│ ⚠️ pH drifting acidic (6.1→5.8 over 3wk)│
│ 💧 Water due in ~2 days                 │
├─────────────────────────────────────────┤
│ EC/pH TRENDS              [Last 30 days]│
│ In:  EC 1.1 → 1.1  pH 5.9 → 5.9 (stable)│
│ Out: EC 1.3 → 1.5  pH 6.1 → 5.8 (⚠️ pH) │
│ Δ:   +0.2 → +0.4  (salt accumulation)   │
├─────────────────────────────────────────┤
│ AI ASSISTANT          [Deep analysis ☐] │
│ ┌─────────────────────────────────────┐ │
│ │ Ask about this plant...             │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ QUICK ACTIONS                           │
│ [💧 Water] [🧪 Feed] [📝 Note] [📷 Photo]│
├─────────────────────────────────────────┤
│ PLANT DETAILS                    [Edit] │
│ Acquired: Dec 2024 · NSE · $150         │
│ Substrate: Dave 4.0 (repotted Oct 2025) │
│ Pot: 4" nursery → 5" azalea             │
│ Notes: General notes here...            │
└─────────────────────────────────────────┘
```

### Components to Integrate

1. **Health Metrics Section** (NEW)
   - Substrate health score from `/lib/care/ecPhUtils.ts`
   - Watering pattern from ML predictions
   - EC/pH trends with delta analysis
   - Alerts from `UpcomingCare` component's `health.alerts`

2. **AI Assistant** (MOVE from `ai` tab)
   - Embed `AIAssistant` component directly
   - Compact mode for overview (expandable)

3. **Quick Actions** (NEW)
   - Water button → opens care log modal with watering pre-selected
   - Feed button → opens care log modal with feeding pre-selected
   - Note button → opens journal entry modal
   - Photo button → opens photo upload modal

4. **Plant Details** (MERGE from `care` tab)
   - Static fields: soil mix, light, temp, humidity
   - Acquisition info
   - General notes
   - Edit button to toggle edit mode

### Data Sources

```typescript
// ML Predictions (from /api/ml/predict-care)
interface MLPredictions {
  watering: { nextDate, daysUntil, confidence, interval, trend, history }
  health: { trajectory, currentScore, substrateHealthScore, riskFactors, alerts }
}

// EC/pH Utils (from /lib/care/ecPhUtils.ts)
calculateSubstrateHealth(careLogs) → { score, factors, trend }
calculateECTrend(careLogs) → { direction, delta }
calculatePHTrend(careLogs) → { direction, delta }
```

---

## Tab 2: Journal (New Unified Timeline)

### Layout Structure

```
┌─────────────────────────────────────────┐
│ FILTERS: [All] [Care] [Notes] [Morph] [Meas]│
├─────────────────────────────────────────┤
│ Dec 10 - 💧 Watered (baseline feed)     │
│          EC 1.1/5.9 → 1.5/5.8           │
│          [Edit] [Delete]                │
├─────────────────────────────────────────┤
│ Dec 8 - 📝 Note                         │
│         New leaf unfurling, velvety     │
│         texture, dark green             │
├─────────────────────────────────────────┤
│ Dec 5 - 📏 Measurement                  │
│         8 leaves, 12" span, 6" petiole  │
├─────────────────────────────────────────┤
│ Dec 3 - 🌸 Morphology                   │
│         Spathe: deep red                │
│         Spadix: cream → pink            │
├─────────────────────────────────────────┤
│ [+ Add Entry]                           │
│ Type: [Care ▾] [Note ▾] [Morph ▾] [Meas ▾]│
└─────────────────────────────────────────┘
```

### Entry Types

1. **Care** - Existing care logs (watering, feeding, repotting, treatment)
2. **Notes** - Free-form journal entries (good for pgvector later)
3. **Morphology** - Trait observations (leaf, spathe, spadix, etc.)
4. **Measurements** - Growth data (leaf count, span, petiole length)

### Implementation Notes

- All entries stored in unified timeline (or virtual merge of existing tables)
- Filter buttons toggle visibility by type
- Each entry type has its own modal for adding
- Chronological sort (newest first)
- Edit/Delete buttons on each entry

### Database Consideration

Two approaches:
1. **Virtual merge** - Query existing tables (CareLog, Measurement, Trait) and merge in UI
2. **PlantJournal table** - Already exists, could be the unified store

Recommend: Start with virtual merge (no schema changes), migrate to unified PlantJournal later if needed.

---

## Tab 3: Photos (UNCHANGED)

Keep existing photo gallery functionality.

---

## Tab 4: Flowering (UNCHANGED)

Keep existing flowering cycle tracking.

---

## Tab 5: Genetics (RENAMED)

Rename from "breeding" to "genetics" for clarity. Keep existing content:
- Female/male parent links
- Clone source
- Generation (F1, F2, etc.)
- Breeding record link
- Target traits

---

## Files to Modify

### Primary File
- `src/app/plants/[id]/page.tsx` - Main refactor target (~3100 lines currently)

### Components to Create/Modify
- `src/components/plant/HealthMetrics.tsx` - NEW: Health dashboard widget
- `src/components/plant/JournalTab.tsx` - NEW: Unified journal timeline
- `src/components/plant/QuickActions.tsx` - NEW: Action buttons row
- `src/components/AIAssistant.tsx` - May need compact/embedded mode

### Existing Components to Reuse
- `src/components/care/UpcomingCare.tsx` - ML predictions source
- `src/lib/care/ecPhUtils.ts` - EC/pH calculations
- `src/lib/care/recommendations.ts` - Care recommendations

---

## Implementation Order

1. **Update tabs array** (5 min)
   - Change from 9 tabs to 5
   - Rename breeding → genetics

2. **Create HealthMetrics component** (30 min)
   - Extract ML prediction display from UpcomingCare
   - Add EC/pH trend display
   - Add alerts section

3. **Refactor Overview tab** (45 min)
   - Add HealthMetrics section
   - Move AIAssistant inline
   - Add QuickActions row
   - Merge plant details from care tab

4. **Create Journal tab** (45 min)
   - Filter buttons component
   - Timeline display (virtual merge of existing data)
   - Entry type icons
   - Add entry modal with type selector

5. **Wire up journal icon** (10 min)
   - Header journal icon → opens Journal tab
   - Or opens add entry modal directly

6. **Test & polish** (30 min)
   - Verify all ML data displays
   - Test quick actions
   - Test journal filters
   - Mobile responsive check

---

## Questions for User

1. **Journal entry modal** - Should the "Add Entry" button open:
   - A single modal with type dropdown? (simpler)
   - Or switch between specialized modals? (current approach)

2. **Compact AI mode** - For overview embed, should AI:
   - Start collapsed with "Ask AI" button to expand?
   - Always show input field?
   - Show last response summary?

3. **Quick Actions** - Which actions to include?
   - Water, Feed, Note, Photo (proposed)
   - Add: Measurement, Morphology observation?

---

## Success Criteria

- [ ] Tabs reduced from 9 to 5
- [ ] Health metrics visible on overview without clicking
- [ ] AI assistant accessible from overview
- [ ] Journal shows unified timeline with filters
- [ ] Quick actions allow one-click care logging
- [ ] All existing functionality preserved
- [ ] Mobile responsive

---

## Related Files Reference

```
src/app/plants/[id]/page.tsx          # Main file to refactor
src/components/care/UpcomingCare.tsx  # ML predictions component
src/components/AIAssistant.tsx        # AI chat component
src/lib/care/ecPhUtils.ts             # EC/pH calculations
src/lib/care/recommendations.ts       # Care recommendations
src/lib/timezone.ts                   # Date handling
```

---

**Ready to implement when context is fresh.**
