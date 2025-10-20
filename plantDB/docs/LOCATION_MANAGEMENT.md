# Location Management System - Implementation Guide
**Date:** October 18, 2025
**Status:** COMPLETE
**Feature:** Comprehensive environmental location tracking with advanced metrics

---

## ✅ What's Been Implemented

### Database Schema (Location Model)
```prisma
model Location {
  id              String   @id @default(cuid())
  name            String   @unique
  type            String   // greenhouse, tent, indoor, outdoor

  zone            String?  // A1, B2, etc.
  shelf           String?
  position        String?

  // Environmental conditions
  lightLevel      String?  // low, medium, high, grow_light
  humidity        Float?   // percentage (RH)
  temperature     Float?   // celsius

  // Advanced environmental metrics
  dli             Float?   // Daily Light Integral (mol/m²/day) - typically 10-20 for anthuriums
  vpd             Float?   // Vapor Pressure Deficit (kPa) - optimal 0.8-1.2 for anthuriums
  pressure        Float?   // Atmospheric pressure (hPa/mbar)
  co2             Float?   // CO2 concentration (ppm) - ambient ~400, enriched ~800-1200

  // Lighting setup
  growLights      String?  // JSON: [{type, wattage, spectrum, distance, photoperiod}]
  photoperiod     String?  // Light schedule (e.g., "16/8", "12/12")

  // Ventilation & air flow
  airflow         String?  // none, low, medium, high, automated
  fanSpeed        String?  // CFM or percentage

  capacity        Int?
  currentOccupancy Int     @default(0)

  plants          Plant[]

  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([name])
}
```

### API Endpoints

**GET /api/locations** - Retrieve all locations
```typescript
// Returns array with plant counts
[
  {
    id: "clxxx...",
    name: "Greenhouse A",
    type: "greenhouse",
    zone: "A",
    humidity: 80,
    temperature: 24,
    dli: 18,
    vpd: 1.0,
    co2: 800,
    photoperiod: "16/8",
    capacity: 50,
    _count: { plants: 67 }
  }
]
```

**POST /api/locations** - Create new location
```typescript
{
  name: "Advanced Growth Tent",
  type: "tent",
  zone: "AGT-1",
  lightLevel: "grow_light",
  humidity: 75,
  temperature: 24,
  dli: 18,
  vpd: 1.0,
  pressure: 1013,
  co2: 800,
  growLights: "2x Quantum Board LEDs, 240W each, Samsung LM301H",
  photoperiod: "16/8",
  airflow: "automated",
  fanSpeed: "200 CFM",
  capacity: 15,
  notes: "Optimized for rapid growth"
}
```

**PATCH /api/locations/[id]** - Update location
```typescript
// Update any fields
{
  humidity: 78,
  temperature: 25,
  dli: 19,
  notes: "Increased DLI for faster growth"
}
```

**DELETE /api/locations/[id]** - Remove location
- ✅ Protected: Cannot delete if plants are assigned
- ✅ Returns error: "Cannot delete location with X plant(s) assigned"

**PATCH /api/plants/[id]/location** - Update plant's location
```typescript
{
  locationId: "newLocationId",
  oldLocationId: "previousLocationId"  // Optional, for occupancy tracking
}
```

---

## 🎯 What This Enables

### 1. Environmental Monitoring
Track comprehensive environmental conditions for each growing area:
- **Basic:** Temperature, humidity, light level
- **Advanced:** DLI, VPD, atmospheric pressure, CO₂
- **Equipment:** Grow lights, fans, airflow systems

### 2. Plant Organization
- Assign plants to specific locations via dropdown
- Track capacity vs current occupancy
- Prevent overcrowding with capacity limits
- View all plants in a location

### 3. Performance Optimization
```
Example: Greenhouse A Analysis
- 67 plants currently
- Conditions: 80% RH, 24°C, DLI 18 mol/m²/day
- VPD: 1.0 kPa (optimal range for anthuriums)
- Result: Plants showing excellent growth rates

Compare to Greenhouse B:
- 0 plants
- Conditions: 75% RH, 22°C, no DLI tracking
- Ready for expansion with optimized setup
```

### 4. Equipment Tracking
Document lighting and ventilation setups:
```
Growth Tent 1:
- Lights: 2x Quantum Board LEDs, 240W each, Samsung LM301H
- Photoperiod: 16/8 (16 hours on, 8 hours off)
- Airflow: Automated exhaust fans
- Fan Speed: 200 CFM
- CO₂: Enriched to 800 ppm
```

---

## 🖥️ User Interface

### Navigation
**Top Navigation Bar → "Locations"**
- Accessible from any page
- Positioned between "Plants" and "Breeding"

### Locations Page (`/locations`)

#### Location Cards Grid
```
┌─────────────────────────────────────────────┐
│ 🏡 Greenhouse A                    [Edit] [X]│
│ greenhouse                                   │
│                                              │
│ Zone: A                                      │
│ Light: Grow Light                            │
│ RH: 80%                                      │
│ Temp: 24°C                                   │
│ DLI: 18 mol/m²/day                          │
│ VPD: 1.0 kPa                                │
│ CO₂: 800 ppm                                │
│ Light schedule: 16/8                         │
│ Plants: 67 / 50                              │
│                                              │
│ ────────────────────────────────────────    │
│ Notes: Primary breeding greenhouse           │
└─────────────────────────────────────────────┘
```

### Location Form Modal
Organized in collapsible sections:

**Basic Information**
- Location Name (required)
- Type: Greenhouse / Growth Tent / Indoor / Outdoor
- Zone, Shelf, Position (organizational)
- Light Level: Low / Medium / High / Grow Light

**Basic Environmental Conditions**
- Humidity (RH %)
- Temperature (°C)

**Advanced Metrics (Optional)**
- DLI (mol/m²/day) - with hint "10-20 typical"
- VPD (kPa) - with hint "0.8-1.2 optimal"
- Pressure (hPa/mbar)
- CO₂ (ppm) - with hint "~400 ambient"

**Lighting Setup (Optional)**
- Photoperiod (e.g., "16/8" or "12/12")
- Airflow: None / Low / Medium / High / Automated
- Grow Lights Info (textarea for detailed description)
- Fan Speed (CFM or percentage)

**Capacity & Notes**
- Capacity (number of plants)
- Notes (general observations)

### Plant Detail Page Integration
**Overview Tab → Location Field**
- Dropdown selector showing all available locations
- Displays current location with plant count
- Changes save immediately
- Success toast notification on update

Example:
```
Location: [Greenhouse A (67 plants)  ▼]
          Greenhouse B (0 plants)
          Growth Tent 1 (5 plants)
          Indoor Cabinet (2 plants)
          No location
```

---

## 📊 Use Cases

### Scenario 1: Setting Up New Greenhouse
```
Create Location:
Name: Greenhouse C - High Performance
Type: Greenhouse
Zone: C

Basic Environmental:
- Humidity: 80%
- Temperature: 26°C

Advanced Metrics:
- DLI: 20 mol/m²/day
- VPD: 1.1 kPa
- CO₂: 1000 ppm (enriched)

Lighting:
- Photoperiod: 16/8
- Grow Lights: "6x Quantum Board LEDs, 480W total, full spectrum,
                Samsung LM301H diodes, mounted 18 inches above benches"
- Airflow: Automated
- Fan Speed: "300 CFM exhaust + 150 CFM circulation"

Capacity: 100 plants
Notes: "Optimized for rapid vegetative growth of F1 hybrids"

Result: Ready to receive plants with fully documented conditions
```

### Scenario 2: Moving Plants for Optimal Conditions
```
Problem: Young seedlings struggling in high-light greenhouse

Analysis:
- Current: Greenhouse A (DLI 18, high light)
- Young plants need: Lower DLI (10-12)
- Available: Indoor Cabinet (DLI not tracked, but lower light)

Action:
1. Go to each seedling's plant detail page
2. Change location dropdown to "Indoor Cabinet"
3. System automatically:
   - Updates plant's location
   - Decrements Greenhouse A occupancy
   - Increments Indoor Cabinet occupancy
4. Document in Indoor Cabinet notes: "Acclimating 15 seedlings"

Result: Plants moved to appropriate light levels, tracked automatically
```

### Scenario 3: Environmental Correlation Analysis
```sql
-- Future Analytics: Which conditions produce best growth?

SELECT
  l.name,
  l.dli,
  l.vpd,
  l.co2,
  AVG(m.vigorScore) as avg_vigor,
  COUNT(DISTINCT p.id) as plant_count
FROM Location l
JOIN Plant p ON p.locationId = l.id
JOIN Measurement m ON m.plantId = p.id
WHERE m.measurementDate > datetime('now', '-30 days')
  AND l.dli IS NOT NULL
GROUP BY l.id
ORDER BY avg_vigor DESC;

-- Result: Identify optimal DLI/VPD/CO₂ combinations
```

### Scenario 4: Capacity Planning
```
Query Locations:
- Greenhouse A: 67/50 plants (OVER CAPACITY ⚠️)
- Greenhouse B: 0/40 plants (available)
- Growth Tent 1: 5/15 plants (available)

Action Plan:
1. Move 20 plants from Greenhouse A to Greenhouse B
2. Optimize spacing in Greenhouse A
3. Reserve Growth Tent 1 for upcoming F1 seedlings

System Benefits:
- Visual warnings for overcrowding
- Easy batch movement tracking
- Capacity forecasting for breeding program
```

---

## 🔮 Future Enhancements

### Real-Time Sensor Integration
```typescript
// Connect IoT sensors to update location data
POST /api/locations/[id]/sensors
{
  temperature: 24.3,
  humidity: 79.5,
  co2: 810,
  timestamp: "2025-10-18T16:00:00Z"
}

// Historical tracking for trend analysis
GET /api/locations/[id]/history?metric=temperature&days=7
```

### Environmental Alerts
```
Alert Triggers:
- VPD outside optimal range (< 0.8 or > 1.2 kPa)
- Temperature extremes (< 18°C or > 30°C)
- CO₂ depletion (< 350 ppm)
- Humidity too low (< 60%)

Notification:
"⚠️ Greenhouse A: VPD 0.6 kPa (below optimal 0.8-1.2)"
```

### Location Analytics Dashboard
```
┌─────────────────────────────────────────────┐
│ Environmental Performance Overview          │
├─────────────────────────────────────────────┤
│                                              │
│ Best Performing Location (Vigor Score):     │
│ → Greenhouse A (avg 4.8/5)                  │
│   Conditions: 80% RH, 24°C, DLI 18, VPD 1.0 │
│                                              │
│ Optimization Recommendations:                │
│ → Growth Tent 1: Increase CO₂ to 800 ppm   │
│ → Indoor Cabinet: Add DLI tracking          │
│                                              │
│ Capacity Utilization:                        │
│ → Greenhouse A: 134% (overcrowded)          │
│ → Greenhouse B: 0% (ready for expansion)    │
└─────────────────────────────────────────────┘
```

### Sovria Integration
```javascript
// Future: Ask Sovria for location recommendations
sovria.query("Where should I put my rare A. crystallinum hybrid?")

Response:
"Based on your location data, I recommend Greenhouse A:
- DLI 18 mol/m²/day matches crystallinum requirements
- VPD 1.0 kPa is ideal for velvet-leaf species
- Current temp 24°C is perfect
- However, it's at 134% capacity - consider Greenhouse B after
  you replicate these exact conditions (currently at 75% RH, 22°C)."
```

---

## 🧪 Testing Checklist

### Backend ✅
- [x] GET /api/locations returns all locations with counts
- [x] POST /api/locations creates location with all metrics
- [x] PATCH /api/locations/[id] updates location
- [x] DELETE /api/locations/[id] removes location
- [x] DELETE protection prevents removal when plants assigned
- [x] PATCH /api/plants/[id]/location updates plant location
- [x] Occupancy tracking increments/decrements correctly
- [x] All numeric fields parse correctly (DLI, VPD, CO₂, etc.)

### Frontend ✅
- [x] Locations button appears in top navigation
- [x] Locations page displays all locations
- [x] Location cards show all metrics conditionally
- [x] "Add Location" button opens modal
- [x] Modal form includes all sections (basic, advanced, lighting)
- [x] Form validation for required fields (name, type)
- [x] Edit button loads existing location data
- [x] Update modifies existing location
- [x] Delete button removes location (with confirmation)
- [x] Delete protection shows error for locations with plants
- [x] Plant detail page shows location dropdown
- [x] Location dropdown populated with all locations
- [x] Changing location updates immediately
- [x] Success toast shows on location change
- [x] Modal is scrollable for long forms
- [x] Mobile responsive layout

### Data Integrity ✅
- [x] Location names must be unique
- [x] Cannot delete location with assigned plants
- [x] Numeric fields accept decimals (DLI, VPD, temp)
- [x] All advanced metrics are optional
- [x] Occupancy counts update on plant moves

---

## 📈 Environmental Metrics Reference

### Daily Light Integral (DLI)
**Units:** mol/m²/day
**Typical Values for Anthuriums:** 10-20 mol/m²/day
- Low light species: 10-12
- Medium light species: 12-16
- High light tolerance: 16-20

**Calculation:**
```
DLI = (PPFD × photoperiod hours × 3600) / 1,000,000
```

### Vapor Pressure Deficit (VPD)
**Units:** kPa (kilopascals)
**Optimal Range for Anthuriums:** 0.8-1.2 kPa
- VPD too low (< 0.6): Risk of fungal diseases
- VPD optimal (0.8-1.2): Maximum transpiration, nutrient uptake
- VPD too high (> 1.5): Plant stress, reduced growth

**Calculation:**
```
VPD = SVP - AVP
where:
SVP = Saturated Vapor Pressure at leaf temp
AVP = Actual Vapor Pressure (RH% × SVP)
```

### CO₂ Concentration
**Units:** ppm (parts per million)
**Typical Values:**
- Ambient outdoor: ~400 ppm
- Indoor without enrichment: 350-450 ppm
- CO₂ enrichment: 800-1200 ppm

**Benefits of Enrichment (800-1200 ppm):**
- 20-30% faster growth rates
- Increased photosynthesis
- Better stress tolerance
- Enhanced flower production

### Atmospheric Pressure
**Units:** hPa (hectopascals) or mbar (millibars)
**Typical Values:** 980-1040 hPa
- Standard: 1013.25 hPa (sea level)
- Higher elevation: Lower pressure
- Weather changes: ±20 hPa variation

**Impact on Plants:**
- Affects water uptake
- Influences transpiration rates
- Correlates with weather patterns

---

## 🚀 Implementation Priority

### Phase 1 (COMPLETE) ✅
- Database schema with comprehensive metrics
- API endpoints (CRUD + plant location assignment)
- Location management UI
- Plant detail page integration
- Navigation access

### Phase 2 (Future)
- Sensor integration for real-time data
- Historical environmental tracking
- Trend visualization charts
- Capacity planning dashboard

### Phase 3 (Future)
- Automated environmental alerts
- Correlation analysis (environment × plant performance)
- Sovria AI recommendations
- Equipment automation integration

---

**Document Status:** 🟢 Phase 1 COMPLETE
**Last Updated:** October 18, 2025
**Next Review:** After sensor integration implementation
**Priority:** HIGH - Core infrastructure for environmental optimization

**This is the environmental management foundation that enables data-driven growing decisions.**
