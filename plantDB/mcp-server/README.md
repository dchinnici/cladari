# PlantDB MCP Server

## Overview

This MCP (Model Context Protocol) server enables Sovria AI to interact with PlantDB's botanical intelligence. It provides natural language access to plant data, care predictions, and health diagnostics.

## Features

### Available Tools

1. **search_plants** - Natural language plant search
   - Search by traits, appearance, care requirements, location, value
   - Returns ranked results with confidence scores
   - Example: "Find velvety plants with red veins under $200"

2. **predict_care** - Optimal care schedule prediction
   - Predicts watering and feeding schedules
   - Based on historical patterns and environmental conditions
   - Returns days until next care, confidence, and warnings

3. **diagnose_symptoms** - Plant health diagnosis
   - Analyzes symptoms and environmental conditions
   - Distinguishes between similar issues (e.g., thrips vs nutrient deficiency)
   - Provides treatment recommendations and preventive measures

4. **get_plant_details** - Retrieve plant information
   - Get specific plant or all plants summary
   - Includes traits, care history, location, value
   - Optional photo URLs and care logs

## Installation

```bash
# Navigate to MCP server directory
cd plantDB/mcp-server

# Install dependencies
npm install

# Build the server
npm run build

# Test the server (optional)
npm run test
```

## Configuration

### Environment Variables

```bash
# PlantDB API base URL (default: http://localhost:3000/api)
export PLANTDB_API_BASE="http://localhost:3000/api"
```

### Adding to Sovria

Add the following to Sovria's MCP configuration (`~/.config/claude/claude_desktop_config.json` or similar):

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

### Alternative: Using tsx directly (development)

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

## Usage Examples

Once configured, you can ask Sovria questions like:

### Plant Search
- "Which plants need water today?"
- "Show me my most valuable Anthuriums"
- "Find plants with velvety leaves"
- "Which plants are in the grow tent?"

### Care Predictions
- "When should I water ANT-2025-0042?"
- "Which plants need feeding this week?"
- "What's the care schedule for my NSE Dressleri?"

### Health Diagnosis
- "My plant has yellowing leaves and brown tips, what's wrong?"
- "Diagnose the stippling on my Crystallinum"
- "Is this thrip damage or nutrient deficiency?"

### Plant Information
- "Show me details about ANT-2025-0015"
- "How many plants do I have?"
- "What's the total value of my collection?"
- "Show me recent care logs for the Dressleri hybrid"

## API Endpoints Used

The MCP server communicates with these PlantDB API endpoints:

- `POST /api/ml/semantic-search` - Natural language search
- `POST /api/ml/predict-care` - Care predictions
- `POST /api/ml/diagnose` - Health diagnosis
- `GET /api/plants` - List all plants
- `GET /api/plants/{id}` - Get plant details
- `GET /api/plants/{id}/care-logs` - Get care history
- `GET /api/plants/{id}/photos` - Get plant photos

## Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Run with hot reload
npm run dev

# Run tests
npm run test
```

### Testing the Server

The test script simulates Sovria making requests to the MCP server:

```bash
npm run test
```

This will:
1. Start the MCP server
2. Connect as a test client
3. List available tools
4. Test each tool with sample queries
5. Display results

### Debugging

Enable debug logging:

```bash
export DEBUG=mcp:*
npm run dev
```

Check server logs in stderr (MCP uses stdout for communication).

## Architecture

```
Sovria (AI System)
    ↓ MCP Protocol
PlantDB MCP Server (This Server)
    ↓ HTTP/REST
PlantDB API (Next.js Backend)
    ↓ Prisma ORM
SQLite Database (70 plants, 474 care logs, 506 photos)
```

## Integration Flow

1. **User Query** → Sovria receives natural language question
2. **Tool Selection** → Sovria identifies relevant PlantDB tool
3. **MCP Request** → Sovria calls tool via MCP protocol
4. **API Call** → MCP server translates to PlantDB API request
5. **Data Processing** → PlantDB processes request (ML models, database queries)
6. **Response** → Results flow back through MCP to Sovria
7. **Natural Language** → Sovria formats response for user

## Future Enhancements

### Phase 2: Vector Search Integration
- Direct pgvector queries for semantic similarity
- Cross-modal search (plants × life events)
- Trait embedding generation

### Phase 3: Specialist Models
- Botanist model for deep plant knowledge
- Chemist model for EC/pH analysis
- Vision model for photo diagnosis
- Breeding advisor for genetic predictions

## Troubleshooting

### Server Won't Start
- Check PlantDB is running: `cd ../.. && npm run dev`
- Verify API endpoint: `curl http://localhost:3000/api/plants`
- Check permissions: `chmod +x index.ts`

### No Results Returned
- Ensure PlantDB has data (70 plants expected)
- Check API base URL in environment
- Verify network connectivity to PlantDB

### MCP Connection Failed
- Check Sovria config path
- Verify node/tsx is in PATH
- Check server output in stderr

## Support

For issues or questions:
- PlantDB Issues: `/Users/davidchinnici/cladari/plantDB/`
- Sovria Integration: `~/f1sovria/`
- MCP Protocol: https://modelcontextprotocol.io/

## License

MIT - Part of the Cladari/PlantDB botanical intelligence system.