#!/usr/bin/env node
/**
 * PlantDB MCP Server
 *
 * Provides MCP (Model Context Protocol) tools for Sovria to interact with PlantDB.
 * This enables natural language queries about plants, care predictions, and diagnoses
 * through the Sovria AI system.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
// PlantDB API base URL - adjust for production
const PLANTDB_API_BASE = process.env.PLANTDB_API_BASE || "http://localhost:3000/api";
// Tool parameter schemas
const SearchPlantsSchema = z.object({
    query: z.string().describe("Natural language search query for plants"),
    limit: z.number().optional().default(10).describe("Maximum number of results to return"),
});
const PredictCareSchema = z.object({
    plantId: z.string().describe("The plant ID (e.g., 'cm442ksae0002vfmg9o0p8lkb')"),
    careType: z.enum(["water", "feed", "all"]).optional().default("all")
        .describe("Type of care to predict"),
});
const DiagnoseSymptomsSchema = z.object({
    plantId: z.string().describe("The plant ID"),
    symptoms: z.array(z.string()).describe("List of observed symptoms"),
    environmental: z.object({
        temperature: z.number().optional(),
        humidity: z.number().optional(),
        vpd: z.number().optional(),
        dli: z.number().optional(),
    }).optional().describe("Current environmental conditions"),
});
const GetPlantDetailsSchema = z.object({
    plantId: z.string().optional().describe("The plant ID (if not provided, returns all plants)"),
    includeCareLogs: z.boolean().optional().default(false)
        .describe("Include recent care history"),
    includePhotos: z.boolean().optional().default(false)
        .describe("Include photo URLs"),
});
// Helper function to make API requests
async function fetchFromPlantDB(endpoint, options = {}) {
    const url = `${PLANTDB_API_BASE}${endpoint}`;
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!response.ok) {
            throw new Error(`PlantDB API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error(`Error fetching from PlantDB: ${error}`);
        throw error;
    }
}
// Tool implementations
async function searchPlants(params) {
    // Use the semantic search endpoint
    const results = await fetchFromPlantDB('/ml/semantic-search', {
        method: 'POST',
        body: JSON.stringify({
            query: params.query,
            limit: params.limit,
        }),
    });
    return {
        query: params.query,
        count: results.plants?.length || 0,
        plants: results.plants || [],
        confidence: results.confidence || null,
    };
}
async function predictCare(params) {
    // Use the ML care prediction endpoint
    const prediction = await fetchFromPlantDB('/ml/predict-care', {
        method: 'POST',
        body: JSON.stringify({
            plantId: params.plantId,
            careType: params.careType,
        }),
    });
    return {
        plantId: params.plantId,
        predictions: prediction.predictions || [],
        recommendations: prediction.recommendations || [],
        warnings: prediction.warnings || [],
        confidence: prediction.confidence || null,
    };
}
async function diagnoseSymptoms(params) {
    // Use the ML diagnosis endpoint
    const diagnosis = await fetchFromPlantDB('/ml/diagnose', {
        method: 'POST',
        body: JSON.stringify({
            plantId: params.plantId,
            symptoms: params.symptoms,
            environmental: params.environmental,
        }),
    });
    return {
        plantId: params.plantId,
        primaryDiagnosis: diagnosis.primary || null,
        alternatives: diagnosis.alternatives || [],
        confidence: diagnosis.confidence || null,
        treatment: diagnosis.treatment || null,
        preventiveMeasures: diagnosis.preventiveMeasures || [],
    };
}
async function getPlantDetails(params) {
    if (params.plantId) {
        // Get specific plant details
        const plant = await fetchFromPlantDB(`/plants/${params.plantId}`);
        // Optionally include care logs
        if (params.includeCareLogs) {
            const careLogs = await fetchFromPlantDB(`/plants/${params.plantId}/care-logs`);
            plant.recentCareLogs = careLogs.slice(0, 10); // Last 10 care logs
        }
        // Optionally include photos
        if (params.includePhotos) {
            const photos = await fetchFromPlantDB(`/plants/${params.plantId}/photos`);
            plant.photos = photos;
        }
        return plant;
    }
    else {
        // Get all plants (summary view)
        const plants = await fetchFromPlantDB('/plants');
        return {
            count: plants.length,
            plants: plants.map((p) => ({
                id: p.id,
                plantId: p.plantId,
                name: p.name,
                scientificName: p.scientificName,
                section: p.section,
                location: p.location?.name,
                lastWatered: p.lastCareLog?.createdAt,
                healthScore: p.healthScore,
                value: p.value,
            })),
        };
    }
}
// Create and configure the MCP server
async function main() {
    const server = new Server({
        name: "plantdb-mcp",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    // Register tool handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "search_plants",
                    description: "Search for plants using natural language queries. Supports searching by traits, appearance, care requirements, location, value, and more.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "Natural language search query",
                            },
                            limit: {
                                type: "number",
                                description: "Maximum number of results (default: 10)",
                                default: 10,
                            },
                        },
                        required: ["query"],
                    },
                },
                {
                    name: "predict_care",
                    description: "Predict optimal care schedule for a plant based on historical patterns, environmental conditions, and plant health.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            plantId: {
                                type: "string",
                                description: "The plant ID",
                            },
                            careType: {
                                type: "string",
                                enum: ["water", "feed", "all"],
                                description: "Type of care to predict (default: all)",
                                default: "all",
                            },
                        },
                        required: ["plantId"],
                    },
                },
                {
                    name: "diagnose_symptoms",
                    description: "Diagnose plant health issues based on symptoms and environmental conditions. Provides treatment recommendations.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            plantId: {
                                type: "string",
                                description: "The plant ID",
                            },
                            symptoms: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description: "List of observed symptoms",
                            },
                            environmental: {
                                type: "object",
                                properties: {
                                    temperature: { type: "number" },
                                    humidity: { type: "number" },
                                    vpd: { type: "number" },
                                    dli: { type: "number" },
                                },
                                description: "Current environmental conditions",
                            },
                        },
                        required: ["plantId", "symptoms"],
                    },
                },
                {
                    name: "get_plant_details",
                    description: "Get detailed information about a specific plant or all plants. Includes traits, care history, location, value, and more.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            plantId: {
                                type: "string",
                                description: "The plant ID (omit for all plants)",
                            },
                            includeCareLogs: {
                                type: "boolean",
                                description: "Include recent care history",
                                default: false,
                            },
                            includePhotos: {
                                type: "boolean",
                                description: "Include photo URLs",
                                default: false,
                            },
                        },
                    },
                },
            ],
        };
    });
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                case "search_plants": {
                    const params = SearchPlantsSchema.parse(args);
                    const results = await searchPlants(params);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(results, null, 2),
                            },
                        ],
                    };
                }
                case "predict_care": {
                    const params = PredictCareSchema.parse(args);
                    const prediction = await predictCare(params);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(prediction, null, 2),
                            },
                        ],
                    };
                }
                case "diagnose_symptoms": {
                    const params = DiagnoseSymptomsSchema.parse(args);
                    const diagnosis = await diagnoseSymptoms(params);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(diagnosis, null, 2),
                            },
                        ],
                    };
                }
                case "get_plant_details": {
                    const params = GetPlantDetailsSchema.parse(args);
                    const details = await getPlantDetails(params);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(details, null, 2),
                            },
                        ],
                    };
                }
                default:
                    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                throw new McpError(ErrorCode.InvalidParams, `Invalid parameters: ${error.errors.map(e => e.message).join(", ")}`);
            }
            throw error;
        }
    });
    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("PlantDB MCP Server running on stdio");
}
// Run the server
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map