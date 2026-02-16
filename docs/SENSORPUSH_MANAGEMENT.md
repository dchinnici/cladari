# SensorPush Management Guide

## 🔧 Safe Sensor Renaming Process

**Good news:** PlantDB uses **permanent sensor IDs**, not names. You can rename sensors freely in SensorPush without breaking historical data!

### How It Works

```typescript
// PlantDB architecture
Location.sensorPushId = "12345678.987654321"  // ✅ Stable ID (never changes)
SensorPush API response = { id: "12345678.987654321", name: "Balcony" }  // Name fetched live
```

**Historical data is keyed by ID** → Renaming doesn't break anything ✅

---

## 📝 Renaming to Numbers (Step-by-Step)

### **Step 1: Rename in SensorPush App**

1. Open SensorPush mobile app
2. For each sensor, tap Settings → Rename
3. Change to numbers: `1`, `2`, `3`, etc.
4. Save

### **Step 2: Update PlantDB**

**Option A: Automatic (Wait for Cron)**
- Daily cron job runs at 6am EST
- Fetches latest sensor names automatically

**Option B: Manual Trigger**
```bash
# Visit in browser or curl:
https://www.cladari.ai/api/sensorpush/sync
```

### **Step 3: Verify**

1. Visit: https://www.cladari.ai/locations
2. Check that sensor-linked locations show new names
3. Historical environmental data should still work

### **Step 4: Label Hardware**

Print number labels (1, 2, 3) and affix to physical sensors.

---

## 🧪 Filtering Test Data

### Automatic Filtering (Now Enabled)

PlantDB automatically excludes obviously invalid readings:
- **Temperatures <45°F** → Fridge/freezer tests
- **Temperatures >110°F** → Malfunction or outdoor summer extremes

**Impact:** AI no longer sees 30°F readings as plant stress events ✅

---

### Manual Exclusion Periods

For known test periods, you can manually blacklist date ranges:

**Edit:** `src/app/api/chat/route.ts`

**Find:**
```typescript
const SENSOR_EXCLUSION_PERIODS: Record<string, Array<{ start: Date; end: Date; reason: string }>> = {
  // Example: Fridge/freezer sensor identification tests
  // '12345678.987654321': [
  //   {
  //     start: new Date('2024-01-15T00:00:00Z'),
  //     end: new Date('2024-01-15T23:59:59Z'),
  //     reason: 'Fridge/freezer sensor ID test'
  //   }
  // ]
};
```

**Add your sensor test period:**
```typescript
const SENSOR_EXCLUSION_PERIODS: Record<string, Array<{ start: Date; end: Date; reason: string }>> = {
  '12345678.987654321': [  // Replace with actual sensor ID
    {
      start: new Date('2025-12-01T00:00:00Z'),
      end: new Date('2025-12-01T23:59:59Z'),
      reason: 'Fridge/freezer sensor ID test - moved sensors'
    }
  ]
};
```

**To find your sensor ID:**
```bash
# Visit:
https://www.cladari.ai/api/sensorpush/sensors

# Response shows:
{
  "12345678.987654321": {
    "id": "12345678.987654321",
    "name": "1",  // Your new name
    ...
  }
}
```

---

## 🔍 Troubleshooting

### "AI still sees old sensor name"

**Cause:** Cached sensor name from previous sync
**Fix:** Trigger manual sync or wait for next cron (6am EST)

```bash
curl https://www.cladari.ai/api/sensorpush/sync
```

---

### "AI sees 30°F readings as cold stress"

**Cause:** Historical test data predates filtering
**Fix 1:** Automatic filtering now enabled (future queries only)
**Fix 2:** Add manual exclusion period (see above) for historical cleanup

---

### "Historical environmental data disappeared"

**Cause:** Sensor ID changed (shouldn't happen, but check)
**Fix:**

1. Check Location model `sensorPushId` field:
   ```bash
   # Prisma Studio:
   npm run db:studio
   # Verify Location → sensorPushId matches current sensor ID
   ```

2. Get current sensor IDs:
   ```bash
   curl https://www.cladari.ai/api/sensorpush/sensors
   ```

3. If ID changed, manually update Location model:
   ```sql
   UPDATE Location
   SET sensorPushId = 'new-id'
   WHERE name = 'Balcony';
   ```

---

## 📊 Verifying Data Integrity

### Check Sensor Linkage

```bash
# List all sensors with locations
curl https://www.cladari.ai/api/sensorpush/sensors

# Should show:
{
  "sensors": [
    {
      "id": "12345678.987654321",
      "name": "1",
      "linkedLocation": "Balcony",
      "lastReading": {...}
    }
  ]
}
```

### Check Environmental History

Visit plant detail page → AI Assistant → Ask:
```
What's the environmental history for this plant?
```

AI should:
- ✅ Show temperature ranges (no 30°F outliers)
- ✅ Display correct sensor name (after sync)
- ✅ Include historical data from before rename

---

## 🚀 Best Practices

### Sensor Naming Strategy

**Recommended:** Use numbers (1, 2, 3) for hardware identification

**Why:**
- Easy to label physical hardware
- Language-agnostic
- No confusion with location names
- Simple to reference

**Mapping:**
```
Sensor 1 → Balcony (via PlantDB Location model)
Sensor 2 → Grow Tent
Sensor 3 → Anthurium Shelf
```

PlantDB shows: **"Balcony (Sensor: 1)"** in UI

---

### Testing New Sensors

**Before connecting to plants:**

1. Run calibration test (fridge/freezer)
2. Note test date/time
3. Map sensor to location in PlantDB
4. Add exclusion period for test data (optional)

**Example:**
```typescript
const SENSOR_EXCLUSION_PERIODS = {
  '12345678.987654321': [
    {
      start: new Date('2025-12-01T10:00:00Z'),
      end: new Date('2025-12-01T12:00:00Z'),
      reason: 'Initial calibration test'
    }
  ]
};
```

---

## 🔧 Advanced: Bulk Rename Script

If you have many sensors, you can batch rename via SensorPush API:

```typescript
// scripts/rename-sensors.ts
import { getSensors } from '@/lib/sensorpush';

const RENAME_MAP: Record<string, string> = {
  '12345678.987654321': '1',
  '23456789.876543210': '2',
  '34567890.765432109': '3',
};

async function renameSensors() {
  const sensors = await getSensors();

  for (const [sensorId, newName] of Object.entries(RENAME_MAP)) {
    // Note: SensorPush API doesn't support programmatic renames
    // Must be done manually in app
    console.log(`Sensor ${sensorId}: "${sensors[sensorId]?.name}" → "${newName}"`);
  }
}
```

**Unfortunately, SensorPush API doesn't support renaming.** Must be done manually in mobile app.

---

## 📝 Change Log

**2025-02-16** - Automatic anomaly filtering added
**2025-02-16** - Manual exclusion periods system added
**2025-12-XX** - Initial SensorPush integration
