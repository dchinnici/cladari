# ML Vision Pipeline - Design Document

**Created:** December 10, 2025
**Status:** QUEUED - Separate workstream
**Priority:** HIGH - Foundational infrastructure
**Estimated Effort:** 40-80 hours

---

## Purpose

Build a rigorous computer vision pipeline for morphological analysis, not "good enough" similarity search. This is verification infrastructure aligned with the Stream Protocol thesis.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE 1: SEGMENTATION                        │
├─────────────────────────────────────────────────────────────────┤
│  Model: SAM2 or SegGPT                                          │
│  Input: Raw plant photos                                        │
│  Output: Per-organ masks (leaf, stem, spathe, spadix, root)     │
│          with confidence scores                                 │
│  Why: Can't analyze "leaf venation" if looking at background    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               STAGE 2: FEATURE EXTRACTION                       │
├─────────────────────────────────────────────────────────────────┤
│  Per segment, run multiple extractors:                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   DINOv2    │  │ Florence-2  │  │  Custom CNN (future)    │  │
│  │             │  │             │  │                         │  │
│  │ Fine-grained│  │ Structured  │  │ Trained on YOUR labeled │  │
│  │ visual      │  │ attributes  │  │ traits over time        │  │
│  │ features    │  │ (color,     │  │                         │  │
│  │ (texture,   │  │ shape,      │  │ Requires: 6+ months of  │  │
│  │ pattern)    │  │ damage)     │  │ verified observations   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  Output: Feature vectors + structured attributes per organ      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               STAGE 3: TEMPORAL ALIGNMENT                       │
├─────────────────────────────────────────────────────────────────┤
│  - Match same leaf across photos by position/shape              │
│  - Track: growth rate, color change, damage progression         │
│  - Handle: new leaves emerging, old leaves senescing            │
│                                                                 │
│  Output: Leaf-level timeline (not just plant-level)             │
│                                                                 │
│  Example: "Leaf #3 on ANT-2025-0046 grew 2.3cm over 6 weeks,    │
│           color shifted from burgundy to green by week 4"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           STAGE 4: CROSS-COLLECTION REASONING                   │
├─────────────────────────────────────────────────────────────────┤
│  - Compare feature vectors across verified specimens            │
│  - Cluster by morphology                                        │
│  - Flag outliers (potential mislabeling, unique traits)         │
│  - Reference YOUR trait observations as ground truth            │
│                                                                 │
│  Output: "This leaf pattern clusters with your healthy          │
│          Colón form specimens, not your RA8"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           STAGE 5: KNOWLEDGE GRAPH INTEGRATION                  │
├─────────────────────────────────────────────────────────────────┤
│  - Link embeddings to structured DB (traits, care, lineage)     │
│  - Store in pgvector when Postgres migration happens            │
│  - Queryable associations:                                      │
│                                                                 │
│    "Show leaves with this venation from Tezula stock"           │
│    "Find plants with similar damage to ANT-2025-0048"           │
│    "Which F1s inherited the quilted texture?"                   │
│                                                                 │
│  Output: Embeddings that MEAN something in your domain          │
└─────────────────────────────────────────────────────────────────┘
```

---

## What This Enables

### Verification Queries
- "Is this really a Colón form?" → Compare to verified Colón specimens
- "Is this damage or variegation?" → Check progression + compare to known patterns
- "Which of my paps are actually the same clone?" → Morphological clustering

### Breeding Intelligence
- "Which F1s inherited the mother's venation pattern?"
- "Do vigorous seedlings share visual traits?"
- "Predict spathe color from juvenile leaf characteristics"

### Provenance Support
- Visual fingerprinting for authentication
- Detect photo reuse/fraud across the community
- Document trait progression for buyers

---

## Technical Requirements

### Hardware
- RTX 4090 on F2 (24GB VRAM) - sufficient for all models
- Storage for embeddings: ~1KB per image per model
- Processing time: estimate 2-5 seconds per photo per stage

### Models to Evaluate
| Model | Purpose | VRAM | Notes |
|-------|---------|------|-------|
| SAM2 | Segmentation | ~4GB | Facebook's Segment Anything v2 |
| SegGPT | Segmentation | ~6GB | Alternative, more flexible |
| DINOv2 ViT-L | Features | ~2GB | Self-supervised, excellent for fine-grained |
| Florence-2-large | Attributes | ~4GB | Microsoft, good at structured output |
| CLIP ViT-L/14 | Baseline | ~2GB | For comparison, general similarity |

### Database Changes Needed
- `PhotoSegment` table - store per-organ crops and masks
- `SegmentEmbedding` table - vectors per segment per model
- `LeafTimeline` table - temporal tracking of individual organs
- Postgres + pgvector migration (prerequisite or concurrent)

---

## Implementation Phases

### Phase 1: Segmentation Foundation (10-15 hours)
- Set up SAM2 on F2
- Process all existing photos
- Store segments in new table
- Manual verification UI for segment quality

### Phase 2: Feature Extraction (15-20 hours)
- Run DINOv2 + Florence-2 on segments
- Store embeddings
- Build similarity search API
- Basic "find similar" UI

### Phase 3: Temporal Alignment (10-15 hours)
- Leaf matching algorithm across photos
- Timeline visualization per plant
- Growth rate calculations

### Phase 4: Cross-Collection Intelligence (10-15 hours)
- Clustering algorithms
- Outlier detection
- Integration with existing health metrics
- Dashboard widgets for insights

### Phase 5: Knowledge Graph (10-15 hours)
- Link embeddings to traits, lineage, care
- Query interface
- Breeding prediction experiments

---

## Dependencies

- [ ] Postgres migration (for pgvector)
- [ ] F2 environment setup (Python, CUDA, models)
- [ ] 6+ months of trait observations for custom model training
- [ ] Photo organization (current 578 photos, growing)

---

## Success Metrics

1. **Segmentation accuracy**: >95% correct organ isolation
2. **Similarity relevance**: Visual search returns morphologically similar plants
3. **Temporal tracking**: Can follow individual leaf across 3+ photos
4. **Clustering validity**: Verified clones cluster together
5. **Breeding insight**: At least one non-obvious pattern discovered

---

## Not In Scope (Yet)

- Real-time video analysis
- Mobile inference
- Public API / community features
- DNA correlation (until MinION data available)

---

## References

- SAM2: https://github.com/facebookresearch/segment-anything-2
- DINOv2: https://github.com/facebookresearch/dinov2
- Florence-2: https://huggingface.co/microsoft/Florence-2-large
- pgvector: https://github.com/pgvector/pgvector

---

*This is foundational infrastructure for the Stream Protocol thesis - verification through continuous visual narrative, not point-in-time snapshots.*
