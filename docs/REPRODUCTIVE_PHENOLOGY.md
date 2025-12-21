# Reproductive Phenology Tracking - Implementation Guide
**Date:** October 18, 2025 (Updated: December 21, 2025)
**Status:** Phase 2 IN PROGRESS - Event-Log Approach Added
**Feature:** Track flowering cycles and fertility windows for breeding optimization

---

## 🆕 Event-Log Approach (v1.7.5 - December 2025)

In addition to the comprehensive FloweringCycle model, v1.7.5 introduced a simpler **event-log approach** via Quick Actions. This addresses the friction of filling out complex forms during care routines.

### Quick Actions: Flower Button

Located in the **Overview tab** of Plant Detail pages:

```
┌──────────────────────────────────────────────┐
│ Quick Actions                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │  Care  │ │ Flower │ │  Note  │ │ Photo  │ │
│ │   💧   │ │   🌸   │ │   📝   │ │   📷   │ │
│ └────────┘ └────────┘ └────────┘ └────────┘ │
└──────────────────────────────────────────────┘
```

### Flowering Event Picker Modal

One-tap event logging with 5 key stages:

```
┌─────────────────────────────────────────────┐
│ Log Flowering Event                         │
│                                              │
│ What did you notice?                        │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 🌱 Bud Emerging                         │ │
│ │ 🌸 Spathe Opening                       │ │
│ │ 💧 Female Receptive                     │ │
│ │ 🌾 Pollen Visible                       │ │
│ │ ✂️ Finished/Cut                         │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Date: [2025-12-21]                          │
│ Notes: [Optional notes...]                  │
│                                              │
│ [Cancel]                    [Save]          │
└─────────────────────────────────────────────┘
```

### How Events Are Stored

Events save to the **PlantJournal** with:
- `entryType: 'flowering'`
- `metadata.floweringEventType`: One of `bud_emerging`, `spathe_opening`, `female_receptive`, `pollen_visible`, `finished`
- `metadata.date`: Selected date
- `metadata.notes`: Optional notes

```typescript
// Example journal entry
{
  id: "clxxx123...",
  plantId: "plant-uuid",
  entryType: "flowering",
  description: "Flowering: Spathe Opening",
  metadata: {
    floweringEventType: "spathe_opening",
    date: "2025-12-21",
    notes: "Beautiful pink spathe, slightly larger than previous bloom"
  },
  timestamp: "2025-12-21T15:30:00.000Z"
}
```

### Benefits of Event-Log Approach

1. **Low friction**: Tap what you see, no form-filling required
2. **Real-time logging**: Captures events as they happen during care routines
3. **Flexible**: Don't need all dates upfront (add events as you notice them)
4. **Journal integration**: Events appear in unified timeline
5. **Searchable**: Can filter Journal by 'flowering' entryType
6. **AI-accessible**: Claude can read flowering history via semantic search

### When to Use Which Approach

| Approach | Best For | Pros | Cons |
|----------|----------|------|------|
| **Event Log** (Quick Actions) | Day-to-day observations | Low friction, real-time | Less structured data |
| **FloweringCycle Model** | Detailed cycle tracking | Structured, enables predictions | More form-filling |

**Recommendation**: Use Event Log for quick observations, create FloweringCycle records for important breeding crosses where you need precise timing data.

---

## ✅ What's Been Implemented (Original FloweringCycle Model)

### Database Schema (FloweringCycle Model)
```prisma
model FloweringCycle {
  id              String   @id @default(cuid())
  plant           Plant    @relation(fields: [plantId], references: [id])
  plantId         String

  // Cycle tracking - Anthurium spadix stages
  spatheEmergence DateTime?  // When spathe first appears
  femaleStart     DateTime?  // Female receptive begins (stigmas receptive)
  femaleEnd       DateTime?  // Female receptive ends
  maleStart       DateTime?  // Male pollen production begins
  maleEnd         DateTime?  // Male pollen ends
  spatheClose     DateTime?  // Spathe closes/cycle complete

  // Pollen management
  pollenCollected Boolean @default(false)
  pollenQuality   String?  // abundant, moderate, sparse, poor
  pollenStored    Boolean @default(false)  // Refrigerated for later use
  pollenStorageDate DateTime?  // When pollen was collected/stored

  // Outcome tracking
  crossesAttempted String @default("[]")  // JSON: [{crossId, date, success}]
  seedsProduced   Int?

  // Environmental conditions during cycle
  temperature     Float?   // Average temp during cycle
  humidity        Float?   // Average humidity during cycle

  // Metadata
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now())

  @@index([plantId])
  @@index([femaleStart])
  @@index([maleStart])
  @@index([spatheEmergence])
}
```

### API Endpoints

**POST /api/plants/[id]/flowering** - Create or update flowering cycle
```typescript
// Create new cycle
{
  spatheEmergence: "2025-10-18",
  femaleStart: "2025-10-20",
  femaleEnd: "2025-10-22",
  maleStart: "2025-10-23",
  maleEnd: "2025-10-25",
  pollenCollected: true,
  pollenQuality: "abundant",
  pollenStored: true,
  pollenStorageDate: "2025-10-23",
  notes: "First flowering for this plant"
}
```

**GET /api/plants/[id]/flowering** - Retrieve all flowering cycles
```typescript
// Returns array of cycles ordered by spatheEmergence desc
[
  {
    id: "clxxx...",
    plantId: "cmgs...",
    spatheEmergence: "2025-10-18T00:00:00.000Z",
    femaleStart: "2025-10-20T00:00:00.000Z",
    femaleEnd: "2025-10-22T00:00:00.000Z",
    maleStart: "2025-10-23T00:00:00.000Z",
    maleEnd: "2025-10-25T00:00:00.000Z",
    pollenCollected: true,
    pollenQuality: "abundant",
    pollenStored: true,
    pollenStorageDate: "2025-10-23T00:00:00.000Z",
    notes: "First flowering for this plant",
    createdAt: "2025-10-18T...",
    updatedAt: "2025-10-18T..."
  }
]
```

**PATCH /api/plants/[id]/flowering/[cycleId]** - Update specific cycle
```typescript
// Update existing cycle (e.g., add end dates, update notes)
{
  femaleEnd: "2025-10-22",
  maleEnd: "2025-10-25",
  spatheClose: "2025-10-26",
  notes: "Updated with completion dates"
}
```

**DELETE /api/plants/[id]/flowering/[cycleId]** - Remove cycle if logged in error

---

## 🎯 What This Enables

### 1. Breeding Window Optimization
```
Scenario: You want to cross RA6 × RA8

RA6: Female receptive Oct 20-22
RA8: Male pollen ready Oct 21-23

✅ Overlap: Oct 21-22 (optimal breeding window)

Action: System alerts you to collect RA8 pollen on Oct 21
        and pollinate RA6 before Oct 22
```

### 2. Cycle Prediction (Future with AI)
```sql
-- Analyze historical cycles
SELECT
  AVG(julianday(maleStart) - julianday(femaleStart)) as avg_gap_days,
  AVG(julianday(spatheClose) - julianday(spatheEmergence)) as avg_cycle_length
FROM FloweringCycle
WHERE plantId = 'ANT-2025-0042'
  AND spatheClose IS NOT NULL;

-- Result: This plant averages 3 days between female/male phases
          and 7-day total cycle length

→ Next spathe emergence: Predict female day 1-2, male day 4-5
```

### 3. Pollen Inventory Management
```
Pollen Stored:
- RA6 (abundant quality) - stored 10/15/25
- RA8 (moderate quality) - stored 10/18/25
- OG5 (poor quality) - stored 09/30/25

Active Female Phases:
- RA5: Female receptive now (Oct 18-20)

→ Recommendation: Use fresh RA8 pollen on RA5
→ Warning: OG5 pollen may be degraded (18 days old)
```

### 4. LLM-Powered Breeding Suggestions
```javascript
// Future integration
sovria.query("Which plants should I prioritize crossing this week?")

Response:
"Based on flowering cycles:
- RA6 and RA8 are syncing fertility windows (Oct 20-23)
- This is a priority cross in your breeding goals
- RA6 pollen from last cycle is still viable (stored 10/15)
- Recommend: Cross RA6♀ × RA8♂ on Oct 21"
```

---

## 🖥️ UI Implementation

### Plant Detail Page - Flowering Tab
```
┌─────────────────────────────────────────────────────────┐
│ Flowering Cycles             [Log Flowering Event]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ October 18, 2025                          [Edit]        │
│ Cycle ID: clxxx123                                      │
│                                                          │
│ Female Phase:              Male Phase:                  │
│ Start: 10/20/25           Start: 10/23/25              │
│ End: 10/22/25              End: 10/25/25                │
│                                                          │
│ Pollen:                    Cycle Closed:                │
│ Collected - Quality:       10/26/25                     │
│ abundant (Stored)                                       │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│ Notes: First flowering for this plant                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ September 15, 2025                        [Edit]        │
│ Cycle ID: clxxx456                                      │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Log Flowering Event Modal
```
┌─────────────────────────────────────────┐
│ Log Flowering Event                     │
│                                         │
│ Spathe Emergence Date: [10/18/2025]    │
│ When the spathe first emerged           │
│                                         │
│ Female Phase Start:  [10/20/2025]      │
│ Stigmas receptive                       │
│                                         │
│ Female Phase End:    [10/22/2025]      │
│                                         │
│ Male Phase Start:    [10/23/2025]      │
│ Pollen production begins                │
│                                         │
│ Male Phase End:      [10/25/2025]      │
│                                         │
│ Spathe Closed:       [10/26/2025]      │
│ When the flowering cycle completed      │
│                                         │
│ ─────── Pollen Management ─────────    │
│                                         │
│ ☑ Pollen Collected                     │
│                                         │
│ Pollen Quality:  [Abundant ▼]          │
│                                         │
│ ☑ Pollen Stored (refrigerated)        │
│                                         │
│ Storage Date:    [10/23/2025]          │
│                                         │
│ Notes: [Optional notes...]             │
│                                         │
│ [Save Cycle]  [Cancel]                 │
└─────────────────────────────────────────┘
```

---

## 📊 Use Cases

### Scenario 1: Tracking First Flowering
```
Day 1 (Oct 18): Notice spathe emerging on ANT-2025-0042
→ Log event: spatheEmergence = 10/18

Day 3 (Oct 20): Stigmas look receptive
→ Edit cycle: femaleStart = 10/20

Day 5 (Oct 22): Female phase ending, checking for pollen
→ Edit cycle: femaleEnd = 10/22

Day 6 (Oct 23): Pollen visible on spadix
→ Edit cycle: maleStart = 10/23, pollenCollected = true,
              pollenQuality = abundant, pollenStored = true,
              pollenStorageDate = 10/23

Day 8 (Oct 25): Male phase complete
→ Edit cycle: maleEnd = 10/25

Day 9 (Oct 26): Spathe closing
→ Edit cycle: spatheClose = 10/26

Result: Complete cycle documented, pollen stored for future crosses
```

### Scenario 2: Coordinating Multiple Plants
```
RA6: Female receptive Oct 20-22
RA8: Female receptive Oct 18-20, Male ready Oct 22-24
RA5: Male ready Oct 19-21

Breeding Plan:
1. Oct 19: RA8♀ × RA5♂ (fresh pollen)
2. Oct 21: RA6♀ × RA5♂ (fresh pollen)
3. Oct 23: Store RA8♂ pollen for future use

System tracks:
- Which crosses were attempted
- Which pollen was used when
- Success/failure rates over time
```

### Scenario 3: Using Stored Pollen
```
Oct 15: RA6 produces abundant pollen
→ Store in refrigerator

Oct 20: RA8 enters female phase (unexpected early flowering)
→ No other males ready

Query pollen inventory:
- RA6 pollen available (stored 5 days ago)
- Quality: abundant
- Viability: Good (Anthurium pollen viable 7-10 days refrigerated)

Action: Use RA8 pollen on RA8 (cross attempted)
→ Log in crossesAttempted field
→ Track success in breeding records
```

---

## 🔮 Future Enhancements (Phase 2+)

### Dashboard Fertility Widget
```
┌─────────────────────────────────────────┐
│ Active Fertility Windows                │
├─────────────────────────────────────────┤
│ 🟢 RA6 (ANT-2025-0042)                 │
│    Female receptive: 2 days remaining   │
│                                         │
│ 🔵 RA8 (ANT-2025-0038)                 │
│    Male pollen ready: 1 day remaining   │
│                                         │
│ ⚠️  Priority: Cross RA6 × RA8 today!   │
│                                         │
│ 📦 Stored Pollen (3 batches)           │
│    RA5 (Oct 12) - expires in 3 days    │
└─────────────────────────────────────────┘
```

### Cycle Prediction API
```typescript
GET /api/plants/[id]/flowering/predict

Response:
{
  nextCycleEstimate: "2025-11-15",
  confidence: 0.85,
  avgCycleInterval: 28.5, // days
  avgCycleLength: 7.2, // days
  basedOnCycles: 4
}
```

### Breeding Recommendations
```typescript
GET /api/breeding/recommendations

Response:
[
  {
    cross: "RA6 × RA8",
    priority: "high",
    reason: "Fertility windows syncing Oct 20-22",
    femaleReady: "2025-10-20",
    maleReady: "2025-10-22",
    pollenAvailable: true,
    breedingGoalMatch: true
  }
]
```

### Environmental Correlation
```sql
-- Future: Correlate flowering with environmental factors
SELECT
  fc.id,
  fc.spatheEmergence,
  AVG(s.temperature) as avg_temp,
  AVG(s.humidity) as avg_humidity
FROM FloweringCycle fc
JOIN SensorData s ON s.locationId = p.locationId
  AND s.timestamp BETWEEN fc.spatheEmergence - INTERVAL 7 DAY
                      AND fc.spatheEmergence
WHERE fc.plantId = 'xxx'
GROUP BY fc.id;

-- Find optimal conditions for inducing flowering
```

---

## 🧪 Testing Checklist

### Backend (Complete) ✅
- [x] POST creates new flowering cycle
- [x] GET retrieves all cycles for plant
- [x] PATCH updates specific cycle
- [x] DELETE removes cycle
- [x] Cycles ordered by spatheEmergence desc
- [x] All date fields handled correctly
- [x] Boolean fields (pollenCollected, pollenStored) work
- [x] Optional fields can be null

### Frontend (Complete) ✅
- [x] Flowering tab appears on plant detail page
- [x] "Log Flowering Event" button opens modal
- [x] Modal form includes all fields
- [x] Date pickers work correctly
- [x] Checkbox logic for pollen management
- [x] Conditional fields (pollen quality, storage date) show/hide
- [x] Save creates new cycle
- [x] Edit button loads existing cycle into form
- [x] Update modifies existing cycle
- [x] Timeline displays all cycles chronologically
- [x] Empty state shows helpful message
- [x] Mobile responsive

### Data Integrity 📋
- [ ] Dates validate correctly (femaleEnd > femaleStart)
- [ ] Cannot delete cycle with associated breeding records
- [ ] Pollen storage date cannot be before collection
- [ ] Cycle length calculations accurate

---

## 📈 Analytics Opportunities

### Cycle Statistics
```sql
-- Average days between female and male phases by plant
SELECT
  p.plantId,
  AVG(julianday(fc.maleStart) - julianday(fc.femaleStart)) as avg_gap
FROM FloweringCycle fc
JOIN Plant p ON p.id = fc.plantId
WHERE fc.femaleStart IS NOT NULL AND fc.maleStart IS NOT NULL
GROUP BY p.plantId
ORDER BY avg_gap;
```

### Pollen Quality by Plant
```sql
-- Which plants produce the best pollen?
SELECT
  p.plantId,
  p.breederCode,
  COUNT(*) as cycles,
  SUM(CASE WHEN fc.pollenQuality = 'abundant' THEN 1 ELSE 0 END) as abundant_count,
  ROUND(100.0 * SUM(CASE WHEN fc.pollenQuality = 'abundant' THEN 1 ELSE 0 END) / COUNT(*), 1) as abundant_pct
FROM FloweringCycle fc
JOIN Plant p ON p.id = fc.plantId
WHERE fc.pollenCollected = 1
GROUP BY p.plantId, p.breederCode
HAVING cycles >= 3
ORDER BY abundant_pct DESC;
```

### Breeding Success Correlation
```sql
-- Do abundant pollen cycles lead to more successful crosses?
-- (Future: when breeding records are linked)
SELECT
  fc.pollenQuality,
  COUNT(br.id) as total_crosses,
  SUM(CASE WHEN br.seedsProduced > 0 THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN br.seedsProduced > 0 THEN 1 ELSE 0 END) / COUNT(br.id), 1) as success_rate
FROM FloweringCycle fc
JOIN BreedingRecord br ON JSON_EXTRACT(fc.crossesAttempted, '$') LIKE '%' || br.id || '%'
GROUP BY fc.pollenQuality
ORDER BY success_rate DESC;
```

---

## 🎓 Botanical Background

### Anthurium Reproductive Biology
Anthuriums exhibit **protogyny** - the female phase (stigmas receptive) occurs BEFORE the male phase (pollen production). This prevents self-pollination and promotes genetic diversity.

**Typical Cycle:**
1. **Spathe Emergence** (Day 0): Spathe unfurls, spadix visible
2. **Female Phase** (Days 1-3): Stigmas receptive, shiny appearance
3. **Interim** (Days 3-4): Neither male nor female active
4. **Male Phase** (Days 4-6): Pollen release, often as tiny droplets
5. **Senescence** (Days 7-9): Spathe begins to close

**Temperature & Humidity Effects:**
- Higher humidity (70-80%) extends female receptivity
- Warmer temps (75-85°F) accelerate cycle progression
- Cooler temps can prolong individual phases

**Pollen Viability:**
- Fresh: Highest viability (hours)
- Refrigerated: 7-10 days at 40°F in sealed container
- Frozen: Months to years at -20°F with desiccant

---

## 🚀 Implementation Priority

### Phase 1.5 (COMPLETE) ✅
- Database schema
- API endpoints
- Basic UI (log, view, edit cycles)
- Pollen management tracking

### Phase 2 (Next Steps)
- Dashboard widget showing active fertility windows
- Pollen inventory page
- Cycle prediction based on historical data
- Email/push notifications for fertility windows

### Phase 3 (Future)
- LLM-powered breeding planner
- Environmental factor correlation
- Success rate tracking by pollen quality
- Sovria integration (correlate breeding with life events)

---

**Document Status:** 🟢 Phase 2 IN PROGRESS (Event-Log Approach Added)
**Last Updated:** December 21, 2025
**Next Review:** After Dashboard Fertility Widget implementation
**Priority:** HIGH - Foundational for breeding program optimization

**This is the breeding optimization tool that makes Cladari indispensable.**

### v1.7.5 Changes (December 2025)
- Added Event-Log approach via Quick Actions Flower button
- 5 one-tap flowering events
- Events save to PlantJournal with 'flowering' entryType
- Quick Actions reorganized: Care/Flower/Note/Photo
