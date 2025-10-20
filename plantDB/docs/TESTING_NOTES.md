# Cladari PlantDB - Testing Notes & Bug Tracking
**Date Started:** October 18, 2025
**Purpose:** Track issues found during real-world use and testing

---

## ✅ Issues Fixed (October 18, 2025)

### 1. Morphology Save Button Not Working
**Symptom:** Clicking "Save Morphology" returned 500 error
**Cause:** Database missing UNIQUE constraint on Trait table
**Error:** `ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint`
**Fix:** Added unique index on (plantId, category, traitName)
```sql
CREATE UNIQUE INDEX Trait_plantId_category_traitName_key
ON Trait(plantId, category, traitName);
```
**Status:** ✅ FIXED - Morphology saves now work correctly

### 2. Size Measurements Too Vague
**Symptom:** "Leaf Size" and "Mature Size" were free text, leading to inconsistent entries
**Issue:** No standard units (cm vs inches), no reference scale
**Fix:** Converted to dropdowns with both metric and imperial measurements
- **Leaf Size:** Very Small to Giant (with cm/in ranges)
- **Mature Size:** Miniature to Giant (with cm/ft ranges)
**Status:** ✅ FIXED - Standardized size options with dual units

---

## 🐛 Known Issues (To Be Fixed)

### Priority: HIGH

#### Issue #1: [Describe next issue found]
**Symptom:**
**Cause:**
**Steps to Reproduce:**
1.
2.
3.
**Expected:**
**Actual:**
**Workaround:**
**Status:**

---

## 📝 Enhancement Requests

### From Testing (October 18, 2025)

#### Enhancement #1: [Describe enhancement idea]
**Current Behavior:**
**Desired Behavior:**
**Rationale:**
**Priority:**
**Phase:**

---

## ✨ Small Improvements Noticed

### UX Improvements
- [Add notes about UI/UX improvements noticed during testing]

### Data Entry Improvements
- [Add notes about data entry workflow improvements]

### Performance Issues
- [Add notes about any slow pages or operations]

---

## 🧪 Testing Checklist

### Core Functionality
- [x] View plant list (sorted alphabetically)
- [x] View individual plant details
- [x] Edit plant overview (with new dropdowns)
- [x] Edit plant morphology (with botanical dropdowns)
- [x] Save morphology (fixed constraint error)
- [ ] Add care log
- [ ] Add measurement
- [ ] View breeding records
- [ ] View dashboard statistics

### Data Validation
- [x] Section dropdown (13 Anthurium sections)
- [x] Health Status dropdown
- [x] Propagation Type dropdown
- [x] Generation dropdown
- [x] Breeder Code dropdown
- [x] Leaf Shape dropdown (12 botanical terms)
- [x] Leaf Texture dropdown (11 options)
- [x] Spathe Shape dropdown (6 options)
- [x] Growth Rate dropdown (5 options)
- [x] Leaf Size dropdown (6 size ranges with cm/in)
- [x] Mature Size dropdown (6 size ranges with cm/ft)

### Edge Cases
- [ ] Plant with no name (hybridName or species)
- [ ] Plant with no vendor
- [ ] Plant with no location
- [ ] Plant with no breeding records
- [ ] Plant with no photos
- [ ] Plant with no care logs
- [ ] Very long plant names
- [ ] Special characters in names

### API Endpoints
- [x] GET /api/plants (list all)
- [x] GET /api/plants/[id] (single plant)
- [x] PATCH /api/plants/[id] (update plant)
- [x] POST /api/plants/[id]/traits (save morphology)
- [ ] POST /api/plants (create new plant)
- [ ] POST /api/plants/[id]/care-logs
- [ ] POST /api/plants/[id]/measurements
- [ ] GET /api/dashboard/stats

### Performance
- [ ] Page load time (plants list)
- [ ] Plant detail page load time
- [ ] API response times
- [ ] Database query optimization
- [ ] Large dataset handling (100+ plants)

---

## 💡 Testing Best Practices

### When Testing New Features:
1. Test with real data (not dummy data)
2. Try edge cases (empty fields, very long text, special characters)
3. Test on different screen sizes (desktop, tablet, mobile)
4. Check browser console for errors (F12 → Console)
5. Check server logs (.next-dev.log)
6. Try to break it intentionally
7. Document every weird behavior

### Before Marking "Done":
- [ ] Feature works as intended
- [ ] No console errors
- [ ] No server errors in logs
- [ ] Data saves correctly to database
- [ ] UI updates properly after save
- [ ] Works on mobile (if applicable)
- [ ] Documented any limitations

---

## 🔄 Testing Workflow

1. **Use the system daily** - Real usage finds real bugs
2. **Document immediately** - Don't wait, add to this file right away
3. **Reproduce the bug** - Make sure it's consistent
4. **Check logs** - Server logs often reveal the issue
5. **Fix or defer** - Fix critical bugs immediately, defer enhancements to phases
6. **Test the fix** - Verify the bug is actually resolved
7. **Git commit** - Commit working fixes with clear messages

---

## 📊 Testing Statistics

**Total Issues Found:** 2
**Issues Fixed:** 2
**Issues Open:** 0
**Enhancement Requests:** 0

**System Stability:** 🟢 GOOD
**Data Integrity:** 🟢 GOOD
**User Experience:** 🟢 GOOD

---

## 🎯 Next Testing Focus

### Immediate (Today/Tomorrow):
- [ ] Test care log creation
- [ ] Test measurement creation
- [ ] Verify all dropdowns save correctly
- [ ] Test mobile responsiveness
- [ ] Create a new plant from scratch

### This Week:
- [ ] Add 10 more plants to test with larger dataset
- [ ] Test breeding record creation
- [ ] Test vendor management
- [ ] Test location management
- [ ] Export data to CSV (when implemented)

### Phase 2 Testing (Weeks 3-4):
- [ ] Photo upload
- [ ] QR code generation
- [ ] Mobile PWA workflow
- [ ] Sensor integration

---

**Last Updated:** October 18, 2025
**Next Review:** Daily during active development

**Remember:** Every bug found is a feature improved. Document everything!
