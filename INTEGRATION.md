# PlantDB & Sovria Integration Guide

## Overview

This document outlines the integration architecture between PlantDB (botanical intelligence database) and Sovria (personal AI consciousness system). The integration enables natural language interaction with plant data, predictive care recommendations, and cross-domain correlations between botanical and personal life data.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│                  (Natural Language)                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Sovria AI System                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Llama 3.3 70B (Fine-tuned with LoRA)          │   │
│  │ • PostgreSQL + pgvector (32K+ embeddings)       │   │
│  │ • Semantic search & correlation engine          │   │
│  │ • Multi-modal data processing                   │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol
┌────────────────────────▼────────────────────────────────┐
│                 PlantDB MCP Server                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Tools:                                           │   │
│  │ • search_plants - Natural language search       │   │
│  │ • predict_care - ML-powered care schedules     │   │
│  │ • diagnose_symptoms - Health analysis          │   │
│  │ • get_plant_details - Plant information        │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼────────────────────────────────┐
│                    PlantDB Backend                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Next.js 15 + TypeScript                       │   │
│  │ • 20+ REST API endpoints                        │   │
│  │ • ML modules (embeddings, diagnosis, predictor) │   │
│  │ • Prisma ORM with optimized queries            │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                Supabase PostgreSQL                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • 70+ plants with ANT-2025-XXXX IDs             │   │
│  │ • 900+ care logs with EC/pH tracking            │   │
│  │ • 700+ photos on Supabase Storage               │   │
│  │ • Trait observations + ChatLog embeddings       │   │
│  │ • PlantJournal unified activity log             │   │
│  │ • pgvector for semantic search (768d)           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Integration Phases

### Phase 1: MCP Integration (Current)
**Status:** ✅ Implemented

**Components:**
- PlantDB MCP Server (`/plantDB/mcp-server/`)
- 4 core tools for plant interaction
- Direct API communication

**Capabilities:**
- Natural language plant search
- Care predictions
- Health diagnosis
- Plant information retrieval

### Phase 2: Vector Database Integration ✅ COMPLETE
**Status:** ✅ Implemented (v1.7.1)

**Components:**
- PostgreSQL (Supabase) - migrated from SQLite
- pgvector extension - enabled and active
- Embedding generation pipeline - BGE-base-en-v1.5 (768d)
- Semantic search API - quality-weighted retrieval

**Capabilities:**
- Semantic similarity search across AI consultations
- ChatLog embeddings with HITL quality weighting
- Auto-chunking on ## headers with type classification
- Cross-collection knowledge retrieval for AI context

### Phase 3: Specialist AI Models (Future)
**Status:** 📋 Designed

**Components:**
- Fine-tuned Llama 3.3 LoRA adapters
- Botanist specialist model
- Chemist specialist model
- Vision analysis model

**Capabilities:**
- Expert-level botanical advice
- EC/pH optimization
- Disease/pest diagnosis
- Breeding recommendations

## Setup Instructions

### 1. PlantDB MCP Server Setup

```bash
# Navigate to MCP server directory
cd /Users/davidchinnici/cladari/plantDB/mcp-server

# Install dependencies (already done)
npm install

# Build the server
npm run build

# Test the server (optional)
npm run test
```

### 2. Sovria Configuration

Add to Sovria's MCP configuration file (typically `~/.config/claude/claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "plantdb": {
      "command": "node",
      "args": ["/Users/davidchinnici/cladari/plantDB/mcp-server/dist/index.js"],
      "env": {
        "PLANTDB_API_BASE": "http://localhost:3000/api"
      }
    }
  }
}
```

For development with hot reload:

```json
{
  "mcpServers": {
    "plantdb": {
      "command": "tsx",
      "args": ["/Users/davidchinnici/cladari/plantDB/mcp-server/index.ts"],
      "env": {
        "PLANTDB_API_BASE": "http://localhost:3000/api"
      }
    }
  }
}
```

### 3. Ensure PlantDB is Running

```bash
# Navigate to PlantDB
cd /Users/davidchinnici/cladari/plantDB

# Start the development server
DATABASE_URL="file:./prisma/dev.db" npm run dev
```

The server should be accessible at `http://localhost:3000`

## Data Flow Examples

### Example 1: Plant Care Query

```
User → Sovria: "Which plants need water today?"
         ↓
Sovria → MCP: callTool("predict_care", {careType: "water"})
         ↓
MCP → PlantDB API: POST /api/ml/predict-care
         ↓
PlantDB → Database: Query care logs, calculate intervals
         ↓
PlantDB → MCP: {plants: [...], predictions: [...]}
         ↓
MCP → Sovria: Structured care data
         ↓
Sovria → User: "3 plants need water today:
                - ANT-2025-0042 (NSE Dressleri) - 7 days since last water
                - ANT-2025-0015 (RA8 Hybrid) - 8 days since last water
                - ANT-2025-0024 (Crystallinum) - Critical, showing stress"
```

### Example 2: Symptom Diagnosis

```
User → Sovria: "My plant has yellowing leaves with brown tips"
         ↓
Sovria → MCP: callTool("diagnose_symptoms", {
                symptoms: ["yellowing leaves", "brown tips"],
                environmental: {temperature: 72, humidity: 60}
              })
         ↓
MCP → PlantDB API: POST /api/ml/diagnose
         ↓
PlantDB → ML Module: Analyze symptoms + environment + history
         ↓
PlantDB → MCP: {
           primary: "Manganese lockout",
           alternatives: ["Thrip damage", "Low humidity"],
           confidence: 0.85,
           treatment: "Flush with pH 5.8 water..."
         }
         ↓
Sovria → User: "This appears to be Manganese lockout (85% confidence)
                caused by high pH (6.5) blocking nutrient uptake.
                Treatment: Flush with pH 5.8 water, reduce EC to 1.5..."
```

### Example 3: Cross-Domain Correlation (Future)

```
User → Sovria: "How does my sleep affect my plant care?"
         ↓
Sovria → Query both systems:
         - Sovria: Sleep data from health tracking
         - PlantDB: Care consistency metrics
         ↓
Sovria → Correlation Analysis:
         - 8+ hours sleep → 95% on-time care
         - <6 hours sleep → 60% on-time care
         - Poor sleep weeks → More pest issues
         ↓
Sovria → User: "Your plant care is strongly correlated with sleep:
                - Well-rested (8+ hrs): 95% care consistency
                - Sleep-deprived (<6 hrs): 60% care consistency
                - Pest issues spike during poor sleep weeks"
```

## API Endpoints

### PlantDB REST API

The MCP server communicates with these endpoints:

#### Core Plant Operations
- `GET /api/plants` - List all plants
- `GET /api/plants/{id}` - Get plant details
- `POST /api/plants` - Create plant
- `PUT /api/plants/{id}` - Update plant
- `DELETE /api/plants/{id}` - Delete plant

#### Care Management
- `GET /api/plants/{id}/care-logs` - Get care history
- `POST /api/plants/{id}/care-logs` - Log care activity
- `POST /api/batch-care` - Batch care operations

#### Photo Management
- `GET /api/plants/{id}/photos` - Get plant photos
- `POST /api/photos` - Upload photo
- `DELETE /api/photos/{id}` - Delete photo

#### ML/AI Endpoints
- `POST /api/ml/semantic-search` - Natural language search
- `POST /api/ml/predict-care` - Care predictions
- `POST /api/ml/diagnose` - Symptom diagnosis
- `GET /api/plants/{id}/recommendations` - ML-powered recommendations

#### Analytics
- `GET /api/dashboard/stats` - Collection statistics
- `GET /api/dashboard/care-queue` - Care queue status
- `GET /api/plants/export` - Export data (CSV/SQL)

## Database Schema Highlights

### ML-Ready Fields

```typescript
// PlantJournal - Unified activity log for ML training
{
  id: String,
  createdAt: DateTime,
  activityType: String,  // 'care', 'observation', 'photo', etc.
  plantId: String,
  description: String,    // Natural language description
  metadata: JSON,         // Structured data
  embedding: Bytes,       // Vector embedding (384d)
  userId: String
}

// Photos - With AI analysis placeholder
{
  id: String,
  plantId: String,
  url: String,
  thumbnailUrl: String,
  category: String,       // 'whole_plant', 'leaf', 'spathe', etc.
  metadata: JSON,         // EXIF data
  aiAnalysis: JSON,       // Placeholder for vision model output
  createdAt: DateTime
}

// Genetics - With trait predictions
{
  id: String,
  plantId: String,
  parentage: JSON,
  crossNotation: String,
  generation: String,
  traitPredictions: JSON, // ML model predictions
  breedingNotes: String
}
```

## Environment Variables

### PlantDB
```bash
# Database (Supabase PostgreSQL - CURRENT)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# API Configuration
NEXT_PUBLIC_API_URL="https://www.cladari.ai"  # Production
# NEXT_PUBLIC_API_URL="http://localhost:3000"  # Development
```

### MCP Server
```bash
# PlantDB API endpoint
PLANTDB_API_BASE="http://localhost:3000/api"
```

### Sovria
```bash
# Vector database
PGVECTOR_URL="postgresql://..."

# Model servers
F1_SERVER="http://f1.local:8000"  # M3 Ultra for inference
F2_SERVER="http://f2.local:8001"  # RTX 4090 for training
```

## Testing Integration

### 1. Manual Testing via Sovria

Once configured, test with these queries:
```
"Show me all my plants"
"Which plants need water?"
"Search for velvety plants"
"Diagnose yellowing leaves on my Crystallinum"
"What's the value of my collection?"
"Show me plants in the grow tent"
```

### 2. Automated Testing

```bash
# Run MCP server tests
cd /Users/davidchinnici/cladari/plantDB/mcp-server
npm run test
```

### 3. API Testing

```bash
# Test PlantDB API directly
curl http://localhost:3000/api/plants

# Test ML endpoints
curl -X POST http://localhost:3000/api/ml/semantic-search \
  -H "Content-Type: application/json" \
  -d '{"query": "velvety leaves", "limit": 5}'
```

## Monitoring & Debugging

### Check MCP Server Logs
```bash
# MCP uses stderr for logs (stdout for communication)
tsx index.ts 2> server.log
```

### Enable Debug Mode
```bash
export DEBUG=mcp:*
npm run dev
```

### Common Issues & Solutions

#### Issue: MCP server not connecting
- Check PlantDB is running: `curl http://localhost:3000/api/plants`
- Verify MCP config path is absolute
- Check node/tsx is in PATH

#### Issue: No results from searches
- Ensure database has data (70 plants expected)
- Check API endpoints are accessible
- Verify PLANTDB_API_BASE environment variable

#### Issue: Predictions not working
- ML modules use heuristics currently (not ML models yet)
- Ensure sufficient care history exists
- Check environmental data is present

## Future Enhancements

### Near Term (1-3 months)
- [ ] PostgreSQL migration for multi-user support
- [ ] Vector embeddings for all plants
- [ ] Semantic search across traits
- [ ] Basic correlation analysis

### Medium Term (3-6 months)
- [ ] Fine-tuned botanist model
- [ ] EC/pH optimization model
- [ ] Photo analysis with vision models
- [ ] Cross-domain life correlations

### Long Term (6-12 months)
- [ ] Consumer app deployment
- [ ] Multi-user authentication
- [ ] Social features
- [ ] Marketplace integration
- [ ] Research publication pipeline

## Security Considerations

### Current State (Development)
- Local-only access
- No authentication required
- Single-user mode

### Production Requirements
- [ ] Add JWT authentication
- [ ] Implement rate limiting
- [ ] Add user isolation
- [ ] Secure photo storage (CDN/S3)
- [ ] API key management
- [ ] HTTPS enforcement

## Performance Metrics

### Current Performance
- Plant list load: <200ms
- Plant detail load: <150ms
- Photo upload: <1s
- Search query: <300ms
- Care prediction: <100ms

### Optimization Targets
- Vector search: <50ms (with pgvector)
- ML inference: <100ms (with caching)
- Photo analysis: <2s (with vision model)
- Batch operations: <500ms for 20 plants

## Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Test with MCP server
4. Update documentation
5. Submit PR

### Code Standards
- TypeScript with strict mode
- Prisma for database operations
- Zod for validation
- ESLint + Prettier formatting

## Resources

### Documentation
- PlantDB: `/Users/davidchinnici/cladari/plantDB/README.md`
- MCP Server: `/Users/davidchinnici/cladari/plantDB/mcp-server/README.md`
- ML Roadmap: `/Users/davidchinnici/cladari/plantDB/docs/ML_INTEGRATION_ROADMAP.md`
- Vision: `/Users/davidchinnici/cladari/plantDB/docs/VISION_AND_PIPELINE.md`

### Related Projects
- Sovria: `~/f1sovria/`
- MCP Protocol: https://modelcontextprotocol.io/
- Anthropic Claude: https://claude.ai/

### Support
- GitHub Issues: Create in respective repositories
- Direct Contact: Through project channels

---

## Summary

The PlantDB-Sovria integration creates a unique botanical intelligence system that combines:
- **Domain expertise** (PlantDB's structured botanical data)
- **AI capabilities** (Sovria's LLM and vector search)
- **Personal context** (Cross-domain life correlations)
- **Local control** (F1/F2 servers, no cloud dependency)

This integration is **not just connecting two systems** - it's creating a new category of personal AI that understands both your botanical collection and your life context, enabling insights that neither system could provide alone.

**Current Status:** Phase 2 complete (v1.7.5). Production deployment live at www.cladari.ai.
**Next Step:** Phase 3 - Specialist AI models and advanced ML features.

### v1.7.5 Updates (December 2025)
- Supabase PostgreSQL with pgvector enabled
- Semantic search across AI consultations
- Production deployment on Vercel
- Google OAuth authentication
- ~700 photos on Supabase Storage