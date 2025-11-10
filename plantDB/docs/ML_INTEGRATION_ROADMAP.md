# PlantDB + F1sovria ML Integration Roadmap

## Vision: Breeding Intelligence System

Transform PlantDB from a data tracker into an AI-powered breeding intelligence system that predicts care needs, discovers hidden patterns, and distinguishes complex diagnoses like thrip damage from manganese lockout.

---

## Current State (November 2025)

### PlantDB Assets
- **71 plants** with comprehensive tracking
- **315 care logs** across the collection
- **63 photos** with EXIF metadata
- **28 trait observations**
- **8 flowering cycles** documented
- **5 environmental locations** with DLI, VPD, CO₂ metrics
- **SQLite database** with Next.js API

### F1sovria AI Infrastructure (Ready to Deploy)
- **PostgreSQL 15 + pgvector**: 32,777 embeddings, 2ms queries
- **Semantic search**: 85-90% accuracy, production-tested
- **Llama 3.3 70B**: Fine-tuned with LoRA adapters
- **F1 Server**: M3 Ultra for real-time inference
- **F2 Server**: RTX 4090 for heavy ML processing
- **Proven pipelines**: Multi-modal data ingestion

---

## Phase 1: Foundation (Weeks 1-2)

### Goal: Semantic Search & Basic ML

#### What You'll Be Able to Do:
```
Query: "Show me velvety dark plants that are struggling"
Result: ANT-2025-0042 (85% match) - velvety, dark form, health: stressed
        ANT-2025-0019 (72% match) - velvety texture, declining vigor
```

#### Implementation Steps:

1. **PostgreSQL + pgvector Setup**
```bash
# Install PostgreSQL 15 with pgvector
brew install postgresql@15
brew services start postgresql@15
psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

2. **Prisma Schema Extension**
```prisma
model PlantVector {
  id              String   @id @default(cuid())
  plantId         String   @unique
  plant           Plant    @relation(fields: [plantId], references: [id])

  // Embeddings
  traitEmbedding  Unsupported("vector(384)")?  // Text traits
  photoEmbedding  Unsupported("vector(768)")?  // Visual features
  careEmbedding   Unsupported("vector(384)")?  // Care patterns

  // Metadata
  lastUpdated     DateTime @default(now())

  @@index([traitEmbedding], type: Hnsw)
}
```

3. **Port Embedding Generation from F1sovria**
```typescript
// src/lib/ml/embeddings.ts
import { pipeline } from '@xenova/transformers';

export class EmbeddingService {
  private encoder;

  async initialize() {
    this.encoder = await pipeline('feature-extraction',
      'Xenova/all-MiniLM-L6-v2');
  }

  async generateTraitEmbedding(traits: string[]): Promise<number[]> {
    const text = traits.join(' ');
    const output = await this.encoder(text);
    return Array.from(output.data);
  }
}
```

4. **Semantic Search Endpoint**
```typescript
// src/app/api/search/semantic/route.ts
export async function POST(request: Request) {
  const { query } = await request.json();

  // Generate query embedding
  const queryEmbedding = await embedder.encode(query);

  // Vector similarity search
  const results = await prisma.$queryRaw`
    SELECT plantId,
           1 - (traitEmbedding <=> ${queryEmbedding}::vector) as similarity
    FROM PlantVector
    ORDER BY similarity DESC
    LIMIT 10
  `;

  return NextResponse.json(results);
}
```

---

## Phase 2: Multi-Factor Care Prediction (Weeks 3-4)

### Goal: Distinguish Complex Diagnoses

#### Example Diagnosis Flow:
```
Input:
- Photo showing stippling on leaves
- Current EC: 2.2, pH: 6.3
- VPD: 1.6 kPa (high)
- DLI: 18 mol/m²/day
- Last fertilized: 3 days ago
- No visible pests

ML Analysis:
├── Pattern Recognition: Stippling pattern analysis
├── Environmental Correlation: High VPD + High EC
├── Historical Matching: 15 similar cases found
├── Pest Probability: Visual analysis shows no thrips
└── Diagnosis: 85% Manganese lockout, 10% Calcium deficiency, 5% Thrips

Output:
"Stippling likely caused by Manganese lockout due to:
- High EC (2.2) creating nutrient antagonism
- High VPD (1.6) increasing transpiration stress
- Recent fertilization may have increased salt buildup

Recommended actions:
1. Flush with pH 5.8 water to reduce EC to 1.5
2. Increase humidity to lower VPD to 1.0
3. Apply foliar Mn spray at 0.5%
4. Monitor recovery over 5-7 days

Similar cases showed 90% recovery with this protocol."
```

#### Implementation:

1. **Care Prediction Model**
```python
# ml/care_predictor.py
import xgboost as xgb
import pandas as pd

class CarePredictor:
    def __init__(self):
        self.model = xgb.XGBRegressor()

    def train(self, care_logs, outcomes):
        features = self.extract_features(care_logs)
        self.model.fit(features, outcomes)

    def predict_next_care(self, plant_data):
        features = self.extract_current_features(plant_data)
        days_until_water = self.model.predict(features)
        confidence = self.calculate_confidence(features)
        return {
            'days_until_water': days_until_water,
            'confidence': confidence,
            'factors': self.explain_prediction(features)
        }
```

2. **Diagnosis Engine**
```typescript
// src/lib/ml/diagnosis.ts
export class DiagnosisEngine {
  async analyze(symptoms: Symptoms): Promise<Diagnosis> {
    const patterns = await this.analyzeVisualPatterns(symptoms.photo);
    const environmental = this.correlateEnvironment(symptoms.environment);
    const historical = await this.findSimilarCases(symptoms);

    const diagnosis = this.combineProbabilities({
      visual: patterns,
      environmental: environmental,
      historical: historical
    });

    return {
      primary: diagnosis[0],
      alternatives: diagnosis.slice(1, 3),
      confidence: this.calculateConfidence(diagnosis),
      recommendations: this.generateTreatmentPlan(diagnosis[0])
    };
  }
}
```

---

## Phase 3: Hidden Insight Discovery (Months 2-3)

### Goal: Surface Non-Obvious Patterns

#### Examples of Discoveries:

1. **Genetic × Environmental Interactions**
```
Discovery: "RA8 genetics show 40% higher crystalline expression
          when grown at VPD 0.8-1.0 vs 1.2-1.4"

Impact: Adjust environment per genetic line
```

2. **Cross-Correlation Patterns**
```
Discovery: "Plants acquired during your high-stress work periods
          (from Sovria data) have 30% lower 6-month survival"

Impact: Time acquisitions better
```

3. **Breeding Insights**
```
Discovery: "Second-generation crosses (F2) from vigorous F1 mothers
          show 25% better pest resistance"

Impact: Select F1 mothers based on vigor scores
```

#### Implementation:

```python
# ml/insight_discovery.py
class InsightDiscovery:
    def __init__(self, f2_connection):
        self.f2 = f2_connection
        self.discoveries = []

    async def run_correlation_analysis(self):
        # Ship data to F2 for GPU processing
        await self.f2.send_batch({
            'plants': self.get_all_plants(),
            'care_logs': self.get_all_care(),
            'environment': self.get_environment_history(),
            'genetics': self.get_genetic_data()
        })

        # F2 runs correlation discovery
        correlations = await self.f2.discover_correlations()

        # Filter for statistical significance
        significant = [c for c in correlations if c.p_value < 0.05]

        # Generate human-readable insights
        for correlation in significant:
            insight = self.explain_correlation(correlation)
            if self.is_actionable(insight):
                self.discoveries.append(insight)

        return self.discoveries
```

---

## Phase 4: Full Intelligence Integration (Months 3-6)

### Goal: Autonomous Breeding Intelligence

#### Capabilities:

1. **Breeding Outcome Prediction**
```
Query: "What if I cross ANT-2025-0042 × ANT-2025-0019?"

Prediction:
- 85% chance of velvety texture (both parents express)
- 60% chance of crystalline midrib (RA8 genetics)
- 40% chance of dark form (recessive, one parent)
- Expected vigor score: 3.8/5
- Estimated market value: $180-250
- Success probability: 75%
```

2. **Environmental Optimization**
```
Current: DLI 12, VPD 1.2, EC 1.8
Recommendation: "Increase DLI to 16 (+33%) and reduce VPD to 0.9
                 to optimize for crystalline expression in RA8 genetics.
                 Expected 20% improvement in growth rate."
```

3. **Pest/Disease Vision**
```python
# ml/vision/pest_detector.py
from ultralytics import YOLO

class PestDetector:
    def __init__(self):
        self.model = YOLO('anthurium_pests_v1.pt')

    def analyze_photo(self, image_path):
        results = self.model(image_path)

        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                detections.append({
                    'pest_type': self.class_names[box.cls],
                    'confidence': box.conf,
                    'location': box.xyxy,
                    'severity': self.assess_severity(box)
                })

        return self.generate_treatment_plan(detections)
```

---

## Data Requirements Timeline

### Current Data (What You Have):
- ✅ 315 care logs (enough for basic patterns)
- ✅ 71 plants (enough for semantic search)
- ⚠️ 63 photos (need 200+ for vision models)
- ⚠️ 28 traits (need 100+ for trait predictions)

### 3-Month Target:
- 1,000 care logs (14 per plant)
- 500 photos (7 per plant)
- 200 trait observations
- 20 completed breeding cycles

### 6-Month Target:
- 2,500 care logs
- 1,500 photos
- 500 trait observations
- 50 breeding cycles with F1 outcomes

---

## F1/F2 Server Architecture

```
PlantDB (User Interface)
    ↓
F1 Server (M3 Ultra) - Real-time
├── API endpoints
├── Semantic search (<50ms)
├── Quick predictions
├── LLM insights (Llama 3.3)
└── Vector queries (pgvector)
    ↓
F2 Server (RTX 4090) - Background
├── Model training (weekly)
├── Correlation discovery (nightly)
├── Photo analysis (YOLOv8)
├── Breeding predictions (Neural Net)
└── Deep pattern mining
    ↓
Insights surfaced in PlantDB UI
```

---

## Integration with Sovria

### MCP Server Approach:
```typescript
// plantdb-mcp-server.ts
export class PlantDBMCPServer {
  tools = {
    'search_plants': this.semanticSearch,
    'predict_care': this.predictCare,
    'analyze_symptoms': this.diagnose,
    'suggest_breeding': this.suggestCross
  }

  async handleRequest(tool: string, params: any) {
    return this.tools[tool](params);
  }
}
```

### Sovria Can Then:
- Access plant data during conversations
- Correlate health data with plant performance
- Surface insights like "Your plants do better when you sleep well"
- Provide contextual breeding advice

---

## Quick Start Commands

```bash
# When ready to start ML integration:

# 1. Install dependencies
npm install @xenova/transformers pgvector

# 2. Set up PostgreSQL
brew install postgresql@15
createdb plantdb_ml
psql plantdb_ml -c "CREATE EXTENSION vector;"

# 3. Generate embeddings for existing plants
npm run ml:generate-embeddings

# 4. Start ML API
npm run ml:server

# 5. Test semantic search
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "velvety dark struggling plants"}'
```

---

## Success Metrics

### Phase 1 (Semantic Search):
- Search relevance >80%
- Query time <100ms
- User adoption >50%

### Phase 2 (Care Prediction):
- Prediction accuracy >70%
- Diagnosis confidence >80%
- False positive rate <10%

### Phase 3 (Insights):
- 1+ actionable insight per week
- Correlation significance p<0.05
- User validates >60% of insights

### Phase 4 (Full Integration):
- Breeding predictions >75% accurate
- Care automation reduces losses by 30%
- Time to diagnosis <30 seconds

---

## Risk Mitigation

1. **Data Quality**: Validation at ingestion
2. **Model Drift**: Weekly retraining on F2
3. **False Positives**: Confidence thresholds
4. **Privacy**: All processing local (F1/F2)
5. **Fallback**: Feature flags for instant rollback

---

## Next Action

When you're ready to start (after collecting more data):

1. Run `./scripts/ml-setup.sh` (will create this)
2. Follow Phase 1 setup instructions
3. Start with semantic search
4. Gradually enable more features

The foundation is ready. Your F1sovria infrastructure + PlantDB data model = Breeding Intelligence System.

---

*Last Updated: November 10, 2025*
*Version: 1.0.0*
*Status: Roadmap - Ready for Implementation*