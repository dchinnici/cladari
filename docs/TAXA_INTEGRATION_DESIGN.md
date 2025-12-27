# Taxa Integration Design

**Status**: Infrastructure complete, integration design pending
**Created**: Dec 27, 2025
**Last Updated**: Dec 27, 2025

---

## What We Have

### Data Layer
- **TaxonReference table**: 154 species from IAS with full morphometric data
- **Embeddings**: 147 taxa with 768-dimensional BGE-base-en-v1.5 vectors
- **API endpoints**: `/api/taxa` (list), `/api/taxa/[species]` (detail)

### Embedding Content
Each taxon embedding is generated from a rich text representation combining:
- Header: `Anthurium {species} {authority}`
- Section classification
- Habit and distribution
- Morphometrics: blade length/width, spadix length, spathe dimensions
- Colors: spadix color, spathe color
- Blade characteristics: shape, basal veins, lateral veins
- Diagnostic traits (critical for species ID)
- Full description (truncated to 2000 chars)
- Taxonomic notes

---

## The Design Question

**Core tension**: How do we inject taxon reference data without causing hallucination?

### Risk: Single-Species Confirmation Bias
If we inject "here's the reference for papillilaminum" and ask "does this match?", Claude will:
- Find similarities to confirm the hypothesis
- Downplay discrepancies
- Fail to consider alternatives

This is especially problematic for:
- Misidentified plants
- Hybrids labeled as pure species
- Species outside our 147-taxa coverage

---

## Proposed Approaches

### Approach A: Context-Aware Injection

Parse the plant's species field to determine injection strategy:

```
Plant Entry: "papillilaminum"
  → Single species mode
  → Inject: papillilaminum reference + 2-3 similar taxa from same section
  → Prompt framing: "Validate against reference. Consider alternatives if traits don't match."

Plant Entry: "Regale × besseae" or "crystallinum x magnificum"
  → Hybrid mode
  → Parse parent species
  → Inject: All parent references
  → Semantic search: Top 3 similar taxa (for outlier detection)
  → Prompt framing: "Compare traits to each parent. Identify inheritance patterns.
                     Flag any traits suggesting additional ancestry."
```

**Implementation questions:**
1. How to detect hybrid notation? Options:
   - Contains `×` (multiplication sign)
   - Contains ` x ` (space-x-space)
   - Contains `hybrid`
   - Regex: `/\s*[×xX]\s*/` between capitalized words

2. What if a parent species isn't in TaxonReference?
   - Note missing reference in AI context
   - Fall back to semantic search for similar taxa
   - Or skip that parent entirely?

### Approach B: Always Comparative

Never inject a single "correct answer". Always present options:

```
For ANY plant (pure species or hybrid):
  → Semantic search: Top 5 taxa matching the plant's labeled species
  → Inject all 5 as "reference candidates"
  → Prompt: "Compare specimen against these candidates. Rank match quality."
```

**Pros**: Avoids confirmation bias entirely
**Cons**: More expensive (more context), may confuse for obvious pure species

### Approach C: Query-Triggered Injection

Only inject taxon data when the user asks species-related questions:

```
User: "Is this really a papillilaminum?"
  → Detect intent: species verification
  → Inject relevant taxa
  → Provide comparative analysis

User: "Why are the leaves yellowing?"
  → No taxon injection needed
  → Standard care/health analysis
```

**Pros**: Minimizes context bloat, targeted relevance
**Cons**: Requires intent detection, may miss opportunities

---

## Conservation Breeder Use Cases

Dave's specific needs (from Dec 27 conversation):

### Pure Species Validation
- "Does this specimen match the IAS reference for this species?"
- "Are there any discrepancies suggesting misidentification?"
- "What diagnostic traits confirm this identification?"

### Hybrid Trait Analysis
- "Which parent contributed which traits?"
- "What traits are dominant vs recessive?"
- "Are there outlier traits suggesting additional ancestry beyond labeled parents?"

### Breeding Research
- "What species in my collection could cross with this section?"
- "What morphological range exists for section Cardiolonchium?"
- "Which of my plants might be undocumented hybrids?"

---

## Open Questions

Before implementing, decide:

### 1. Hybrid Notation Parsing
What patterns do you use consistently?
- `×` (Unicode multiplication sign)?
- `x` or `X` (letter)?
- Written forms like "hybrid" or "cross"?
- Any other formats in your collection?

### 2. Missing Reference Handling
When a species isn't in our 147-taxa database:
- Silent fallback to semantic search?
- Explicit note: "No IAS reference available for {species}"?
- Both?

### 3. Injection Location
Where in the chat API should taxa context go?
- **System prompt**: Persistent reference throughout conversation
- **User message prefix**: Per-query context
- **Separate context block**: Like environmental data
- **Combination**: System = static reference, per-query = specific comparison

### 4. Performance Budget
How much context are we willing to add?
- Single taxon: ~500-4000 chars (varies by description length)
- 5 taxa comparison: ~2000-20000 chars
- This affects token cost and response latency

### 5. UI Surfacing
Should users see what taxa were injected?
- Transparent: "Comparing against: papillilaminum, crystallinum, ..."
- Hidden: Just happens in background
- On-demand: "Show references used"

---

## Implementation Sketch

If proceeding with Approach A (context-aware injection):

```typescript
// In chat/route.ts

async function getTaxaContext(plantContext: PlantContext): Promise<string | null> {
  const species = plantContext.species;
  if (!species) return null;

  // Detect hybrid
  const hybridMatch = species.match(/(.+?)\s*[×xX]\s*(.+)/);

  if (hybridMatch) {
    // Hybrid mode: fetch all parents
    const [_, parent1, parent2] = hybridMatch;
    const parents = await fetchTaxaBySpecies([parent1.trim(), parent2.trim()]);
    const similar = await semanticSearchTaxa(species, 3);
    return formatHybridContext(parents, similar);
  } else {
    // Single species mode
    const primary = await fetchTaxonBySpecies(species);
    const similar = await semanticSearchTaxa(species, 3);
    return formatSpeciesContext(primary, similar);
  }
}
```

---

## Related Files

- `prisma/schema.prisma` - TaxonReference model
- `scripts/scrape-ias-taxa.ts` - IAS data scraper
- `scripts/embed-taxa.ts` - Embedding generator
- `src/app/api/taxa/route.ts` - Taxa list API
- `src/app/api/taxa/[species]/route.ts` - Taxa detail API
- `src/app/api/chat/route.ts` - Chat API (integration point)
- `src/lib/ml/embeddings.ts` - Embedding service

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 27, 2025 | Deferred integration design | Need to think through hybrid handling and hallucination risks |

---

## Next Steps

1. **Decide on hybrid notation parsing** - Review actual plant entries in collection
2. **Choose injection approach** (A, B, C, or hybrid)
3. **Define prompt templates** for species validation vs hybrid analysis
4. **Implement and test** with representative plants from collection
5. **Iterate based on AI response quality**
