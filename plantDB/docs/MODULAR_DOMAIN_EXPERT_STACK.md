# Modular Domain Expert Stack Pattern

**Version:** 1.0.0
**Created:** November 17, 2025
**Status:** Implemented with PlantDB/Sovria Integration

---

## Executive Summary

The **Modular Domain Expert Stack** is an architectural pattern that enables AI systems to leverage specialized domain knowledge through independent, composable modules. Rather than training one massive model on everything, we create focused expert systems that communicate via standardized protocols.

PlantDB's integration with Sovria demonstrates this pattern in production, establishing a blueprint for adding unlimited domain expertise to AI systems.

---

## Core Concept

```
Traditional Approach:
┌─────────────────────────────┐
│   Monolithic AI Model       │
│  (Tries to know everything) │
└─────────────────────────────┘
        ↓ Problems:
    • Jack of all trades
    • Hard to update domains
    • Training complexity
    • Hallucination risk

Modular Domain Expert Approach:
┌─────────────────────────────┐
│    Sovria (Orchestrator)    │
└─────────────┬───────────────┘
              │ MCP Protocol
    ┌─────────┴─────────┬─────────┬─────────┐
    ↓                   ↓         ↓         ↓
┌───────┐         ┌───────┐ ┌───────┐ ┌───────┐
│PlantDB│         │Health │ │Finance│ │  ...  │
│Expert │         │Expert │ │Expert │ │Expert │
└───────┘         └───────┘ └───────┘ └───────┘
    ↓ Benefits:
    • Deep domain expertise
    • Independent updates
    • Clear responsibilities
    • Verifiable accuracy
```

---

## Architecture Pattern

### 1. Domain Expert Module

Each domain expert:
- **Owns its data**: Complete sovereignty over domain-specific information
- **Defines tools**: Exposes capabilities via MCP protocol
- **Maintains schema**: Controls data structure and validation
- **Handles logic**: Implements domain-specific algorithms

Example: PlantDB
```typescript
// PlantDB owns botanical data
Database: 70 plants, 474 care logs, 506 photos

// PlantDB defines tools
Tools: [
  search_plants,     // Semantic search
  predict_care,      // ML predictions
  diagnose_symptoms, // Health analysis
  get_plant_details  // Information retrieval
]

// PlantDB maintains schema
Schema: Plant, CareLog, Photo, Trait, Genetics...

// PlantDB handles logic
Logic: EC/pH analysis, substrate health, care scheduling
```

### 2. Orchestrating AI (Sovria)

The orchestrator:
- **Routes queries**: Determines which expert(s) to consult
- **Combines responses**: Merges multi-domain information
- **Maintains context**: Tracks conversation and user state
- **Generates insights**: Creates cross-domain correlations

Example flow:
```
User: "Why am I buying so many plants lately?"
         ↓
Sovria: Checks multiple experts
         ├─ PlantDB: Recent acquisitions (5 in last month)
         ├─ Health: Stress levels elevated
         ├─ Calendar: Work deadline approaching
         └─ Finance: Spending increase in hobbies category
         ↓
Sovria: "You've acquired 5 plants this month, correlating with
         elevated stress (HRV down 15%) and approaching deadlines.
         This matches your pattern of stress-shopping plants."
```

### 3. Communication Protocol (MCP)

The Model Context Protocol provides:
- **Standardized interface**: Consistent tool definition format
- **Type safety**: Schema validation with Zod/JSON Schema
- **Async operation**: Non-blocking communication
- **Error handling**: Graceful degradation

```json
{
  "tool": "search_plants",
  "description": "Natural language plant search",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {"type": "string"},
      "limit": {"type": "number", "default": 10}
    }
  }
}
```

---

## Implementation Guide

### Step 1: Define Domain Boundaries

Questions to answer:
- What data does this domain own?
- What questions should it answer?
- What actions can it perform?
- How does it relate to other domains?

PlantDB example:
- **Owns**: Plant records, care logs, photos
- **Answers**: Care schedules, health diagnosis, breeding advice
- **Performs**: Search, predict, diagnose, retrieve
- **Relates**: Plant stress ↔ owner stress, acquisitions ↔ finances

### Step 2: Design Tool Interface

Each tool needs:
```typescript
interface MCPTool {
  name: string;           // Unique identifier
  description: string;    // What it does
  inputSchema: Schema;    // Parameter validation
  handler: Function;      // Implementation
}
```

Example tool:
```typescript
{
  name: "predict_care",
  description: "Predict optimal care schedule",
  inputSchema: {
    plantId: z.string(),
    careType: z.enum(["water", "feed", "all"])
  },
  handler: async (params) => {
    // Domain logic here
    return prediction;
  }
}
```

### Step 3: Implement MCP Server

Basic structure:
```typescript
class DomainExpertMCP {
  // Define available tools
  tools = [/* tool definitions */];

  // Handle tool requests
  async handleRequest(tool, params) {
    const handler = this.tools[tool].handler;
    return await handler(params);
  }

  // Start server
  listen() {
    // MCP protocol implementation
  }
}
```

### Step 4: Register with Orchestrator

Add to Sovria config:
```json
{
  "mcpServers": {
    "domain-name": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"],
      "env": {
        "API_BASE": "http://localhost:PORT"
      }
    }
  }
}
```

### Step 5: Test Integration

Validation queries:
```
# Information retrieval
"Show me all [domain entities]"

# Search/filter
"Find [entities] with [criteria]"

# Prediction/analysis
"What [future state] for [entity]?"

# Cross-domain
"How does [domain1] relate to [domain2]?"
```

---

## Real-World Example: PlantDB + Sovria

### Current Implementation

**PlantDB Domain Expert**
- 70 plants tracked
- 474 care events logged
- 506 photos documented
- 4 MCP tools exposed

**Integration Results**
```
Query: "Which plants need water?"
Time: <300ms
Accuracy: Based on real care history

Query: "Find velvety plants"
Time: <200ms
Results: Semantic matching on traits

Query: "Diagnose yellow leaves"
Time: <400ms
Output: Differential diagnosis with confidence
```

### Scaling Pattern

Adding new domain (e.g., Nutrition):
```
Week 1: Define nutrition domain
        - Meals, ingredients, macros
        - Health goals, restrictions

Week 2: Create MCP server
        - meal_search, nutrition_analysis
        - meal_planning, grocery_list

Week 3: Integrate with Sovria
        - Configure MCP
        - Test queries

Week 4: Cross-domain insights
        - "How does nutrition affect plant care?"
        - "Correlation between protein and breeding success?"
```

---

## Benefits Over Monolithic Approach

### 1. Expertise Depth
- **Monolithic**: Shallow knowledge across all domains
- **Modular**: Deep expertise in each domain

### 2. Maintainability
- **Monolithic**: Retrain entire model for updates
- **Modular**: Update single domain independently

### 3. Verification
- **Monolithic**: Black box predictions
- **Modular**: Traceable to specific expert

### 4. Scalability
- **Monolithic**: Exponential complexity growth
- **Modular**: Linear complexity per domain

### 5. Reliability
- **Monolithic**: One failure affects everything
- **Modular**: Graceful degradation

---

## Common Patterns

### Pattern 1: Search Expert
```typescript
tools: [
  "search_entities",  // Full-text/semantic
  "filter_by",       // Specific criteria
  "get_by_id",       // Direct lookup
  "list_all"         // Pagination support
]
```

### Pattern 2: Analytics Expert
```typescript
tools: [
  "calculate_metrics",  // Domain KPIs
  "trend_analysis",    // Time series
  "predict_future",    // Forecasting
  "detect_anomalies"   // Outlier detection
]
```

### Pattern 3: Action Expert
```typescript
tools: [
  "create_entity",     // Add new
  "update_entity",     // Modify
  "delete_entity",     // Remove
  "execute_workflow"   // Complex operations
]
```

### Pattern 4: Knowledge Expert
```typescript
tools: [
  "explain_concept",   // Domain education
  "diagnose_issue",    // Problem solving
  "recommend_action",  // Best practices
  "validate_plan"      // Sanity checking
]
```

---

## Anti-Patterns to Avoid

### ❌ Data Centralization
Don't move all data to orchestrator. Let experts own their data.

### ❌ Over-Generic Tools
Don't create "do_everything" tools. Keep them focused.

### ❌ Synchronous Blocking
Don't wait for slow experts. Use async patterns.

### ❌ Tight Coupling
Don't let experts depend on each other directly.

### ❌ Missing Context
Don't forget to pass relevant context between experts.

---

## Future Directions

### Near Term (3-6 months)
- Standardize tool patterns across domains
- Create tool discovery mechanism
- Implement caching layer
- Add performance monitoring

### Medium Term (6-12 months)
- Visual tool builder interface
- Automatic API → MCP generation
- Cross-expert transactions
- Federated learning patterns

### Long Term (1-2 years)
- Marketplace for domain experts
- Plug-and-play expert modules
- Automatic expert selection
- Self-organizing expert networks

---

## Getting Started Checklist

- [ ] Identify your domain boundaries
- [ ] Define 3-5 initial tools
- [ ] Create MCP server boilerplate
- [ ] Implement tool handlers
- [ ] Write tool tests
- [ ] Configure orchestrator
- [ ] Test integration queries
- [ ] Document tool usage
- [ ] Monitor performance
- [ ] Iterate on tool design

---

## Resources

### Reference Implementation
- PlantDB MCP Server: `/plantDB/mcp-server/`
- Integration Guide: `/plantDB/INTEGRATION.md`
- Sovria Config: `~/f1sovria/`

### Documentation
- MCP Protocol: https://modelcontextprotocol.io/
- PlantDB Architecture: `/plantDB/docs/CLADARI_ENGINEER_MANUAL.md`
- Sovria Architecture: `~/f1sovria/docs/`

### Tools & Libraries
- `@modelcontextprotocol/sdk` - MCP implementation
- `zod` - Schema validation
- `tsx` - TypeScript execution
- `prisma` - Database ORM

---

## Conclusion

The Modular Domain Expert Stack pattern enables:
- **Deep expertise** without model bloat
- **Independent evolution** of domains
- **Clear responsibilities** and ownership
- **Scalable architecture** for unlimited domains

PlantDB's successful integration with Sovria proves this pattern works in production. Each new domain expert adds focused capabilities without increasing system complexity.

**This is the future of AI systems**: Not one model that knows everything poorly, but an orchestrated network of experts that each excel in their domain.

Start with one domain. Master it. Then add another.

The stack grows with your needs.