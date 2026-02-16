# Performance Testing Guide

## What Changed

### Phase 1: Critical Fixes (6-8 second improvement expected)

1. **✅ Enabled Supabase Image Transformations** (`src/lib/photo-url.ts`)
   - List view now requests 300px thumbnails via `/render/image/` endpoint
   - Detail view still loads full-resolution via `/object/` endpoint
   - Expected: ~50KB per thumbnail vs 5-40MB originals

2. **✅ Added React Query Client-Side Caching** (`src/app/plants/page.tsx`, `src/app/providers.tsx`)
   - Plants list data cached for 30 seconds
   - Cache retained in memory for 5 minutes
   - Back navigation now instant (loads from cache)
   - No refetch on window focus (only on visibility change)

### Phase 2: Moderate Optimizations (1-2 second improvement expected)

3. **✅ Optimized Plants List API Query** (`src/app/api/plants/route.ts`)
   - Using `select` instead of `include` for 70% payload reduction
   - Removed: measurements, traits, floweringCycles (not used on list page)
   - Kept: 10 care logs (required for dynamic threshold calculation)
   - Photos limited to 1 per plant (cover photo or first photo)
   - Batch signed URL generation (parallel instead of sequential)

4. **✅ Fixed Scroll Restoration Timing** (`src/app/plants/page.tsx`)
   - Using `requestAnimationFrame` instead of `setTimeout(100)`
   - Waits for data load and DOM render before scrolling
   - No more premature scroll attempts

### Phase 3: Infrastructure (10-50ms improvement expected)

5. **✅ Added Vercel Region Configuration** (`vercel.json`)
   - Deployed to `cle1` (Cleveland) - closest to Supabase `us-east-2` (Ohio)
   - Reduces cross-region latency from ~20ms to <10ms

---

## Pre-Testing Checklist

Before testing, ensure:

```bash
# 1. Check if Supabase Pro plan has /render/ endpoint enabled
# Visit: https://wtvydonwfnypzzeizptw.supabase.co/project/settings/storage
# Verify: Image transformations are enabled

# 2. Build and deploy to Vercel
vercel --prod

# 3. Verify environment variables exist
vercel env ls
# Should see: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
```

---

## Testing Protocol

### Test 1: Image Transformation Verification

**Expected:** List view uses `/render/image/` URLs with `?width=300`

1. Open Chrome DevTools → Network tab
2. Navigate to `/plants` page
3. Filter by "render" in Network tab
4. **✅ Success:** Image requests show URLs like:
   ```
   https://wtvydonwfnypzzeizptw.supabase.co/storage/v1/render/image/public/cladari-photos/{path}?width=300&quality=80
   ```
5. **❌ Failure:** If still seeing `/object/` URLs:
   - Check Supabase Pro plan has image transformations enabled
   - Verify `photo-url.ts` changes deployed correctly
   - Check browser console for errors

### Test 2: Initial Load Time

**Expected:** <2 seconds on Fast 3G, <1 second on regular connection

1. Chrome DevTools → Network tab → Throttling: "Fast 3G"
2. Hard refresh (`Cmd+Shift+R`) to bypass cache
3. Navigate to `/plants` page
4. Record time from navigation to full render

**Baseline (before fixes):** 7-10 seconds
**Target (after fixes):** <2 seconds

**Measurements:**
- DOMContentLoaded: _____ ms
- Load: _____ ms
- Largest Contentful Paint (LCP): _____ ms

### Test 3: Payload Size Reduction

**Expected:** ~50-100KB total (was 500KB-2MB)

1. Network tab → Clear
2. Navigate to `/plants` page
3. Filter by "plants" (the API endpoint)
4. Check response size

**Baseline:** ~500KB-2MB
**Target:** ~50-100KB
**Actual:** _____ KB

### Test 4: Back Navigation (Instant Restore)

**Expected:** Instant scroll restoration, no loading spinner

1. Navigate to `/plants` page
2. Scroll down to plant #40
3. Click any plant to open detail page
4. Click back button or browser back

**✅ Success indicators:**
- Scroll position restored to plant #40 instantly
- No "Loading plants..." message
- No network request (cached)
- Filters, sort, search preserved

**❌ Failure indicators:**
- Scroll jumps to top
- Loading spinner appears
- Fresh API request in Network tab

### Test 5: Dynamic Threshold Calculation

**Expected:** Dynamic thresholds still work (care logs loaded correctly)

1. Navigate to `/plants` page
2. Find a plant with 3+ watering events
3. **✅ Success:** Card shows `(~4.2d avg)` hint
4. **❌ Failure:** If hint missing, care logs not loading

### Test 6: Image Size by Context

**Expected:** Different sizes for different views

1. Plants list view → Check image URLs → Should have `?width=300`
2. Plant detail page → Check image URLs → Should use `/object/` (full size)

---

## Performance Metrics

### Before Optimizations

| Metric | Value |
|--------|-------|
| Initial load time | 7-10 seconds |
| Back navigation | 1-3 seconds (full reload) |
| Plants API payload | 500KB-2MB |
| Image size (list) | 5-40MB each (full resolution) |
| Scroll restoration | Broken (jumps to top) |

### After Optimizations (Target)

| Metric | Value |
|--------|-------|
| Initial load time | <2 seconds (Fast 3G) |
| Back navigation | Instant (<100ms, cached) |
| Plants API payload | 50-100KB |
| Image size (list) | ~50KB each (300px thumbnails) |
| Scroll restoration | Works perfectly |

### Actual Results (Fill in after testing)

| Metric | Value | Notes |
|--------|-------|-------|
| Initial load time | _____ seconds | _____ |
| Back navigation | _____ ms | _____ |
| Plants API payload | _____ KB | _____ |
| Image size (list) | _____ KB | _____ |
| Scroll restoration | ✅ / ❌ | _____ |

---

## Troubleshooting

### Issue: Images still full-size (not using /render/)

**Check:**
1. Supabase plan has image transformations enabled
2. `photo-url.ts` deployed with new code
3. Browser cache cleared (hard refresh)
4. Check Network tab for actual URLs being requested

**Fix:**
```bash
# Verify Supabase Storage settings
# Project Settings → Storage → Image Transformations: Enabled

# Redeploy if needed
vercel --prod --force
```

### Issue: Back navigation not instant

**Check:**
1. React Query provider in `providers.tsx`
2. `useQuery` hook in `plants/page.tsx`
3. Cache settings: `staleTime: 30s`, `gcTime: 5min`
4. No console errors blocking render

**Fix:**
```bash
# Check React Query DevTools in browser
# Verify cache is being populated
# Check for React errors in console
```

### Issue: Dynamic thresholds not showing

**Check:**
1. API query includes `careLogs` (should have 10 items)
2. Network tab shows care logs in `/api/plants` response
3. Plants have at least 3 watering events

**Fix:**
- Verify `careLogs` not removed from API query
- Check `care-thresholds.ts` for errors

### Issue: Scroll restoration jumps to top

**Check:**
1. `requestAnimationFrame` in scroll restoration effect
2. Effect waits for `!isLoading && plants.length > 0`
3. SessionStorage has scroll position saved

**Fix:**
- Check browser console for React warnings
- Verify scroll position saved before navigation

---

## Production Deployment

```bash
# 1. Build locally to catch errors
npm run build

# 2. Deploy to production
vercel --prod

# 3. Monitor Vercel deployment logs
# Visit: https://vercel.com/your-project/deployments

# 4. Test on production URL
# Open: https://www.cladari.ai/plants

# 5. Monitor Vercel Analytics
# Check: LCP, FCP, CLS metrics in Vercel dashboard
```

---

## Rollback Plan

If issues arise in production:

```bash
# 1. Revert to previous deployment
vercel rollback

# 2. Or revert specific files
git revert HEAD~5..HEAD  # Revert last 5 commits
git push origin main
vercel --prod
```

---

## Success Criteria

All must pass:

- ✅ Initial load time: <2 seconds (Fast 3G)
- ✅ Back navigation: Instant (<100ms)
- ✅ Image URLs use `/render/` with width parameter
- ✅ API payload: <150KB
- ✅ Scroll restoration: Works on back navigation
- ✅ Dynamic thresholds: Still display correctly
- ✅ No console errors
- ✅ No broken images

---

## Next Steps After Verification

Once all tests pass:

1. **Monitor production metrics** for 24-48 hours
2. **Document actual performance gains** in CHANGELOG.md
3. **Update CLAUDE.md** with completed performance work
4. **Consider additional optimizations:**
   - Service worker cache for transformed images
   - Prefetch next/prev plant pages
   - Virtual scrolling for 100+ plants
   - Image placeholders during load (blur-up)

---

## Notes

- Image transformations require **Supabase Pro plan** ($25/month)
- Free tier uses `/object/` endpoint (no transformations)
- If on free tier, consider client-side lazy loading instead
- React Query cache persists across navigation, not page refresh
