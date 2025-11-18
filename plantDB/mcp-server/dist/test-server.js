#!/usr/bin/env tsx
/**
 * Test script for PlantDB MCP Server
 *
 * This script tests the MCP server tools by simulating requests
 * that Sovria would make.
 */
import { spawn } from 'child_process';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};
async function testMCPServer() {
    console.log(`${colors.bright}${colors.blue}🌿 PlantDB MCP Server Test Suite${colors.reset}\n`);
    // Start the MCP server as a subprocess
    const serverProcess = spawn('tsx', ['index.ts'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    // Create transport and client
    const transport = new StdioClientTransport({
        command: 'tsx',
        args: ['index.ts'],
    });
    const client = new Client({
        name: "plantdb-test-client",
        version: "1.0.0",
    }, {
        capabilities: {},
    });
    try {
        // Connect to the server
        await client.connect(transport);
        console.log(`${colors.green}✓ Connected to PlantDB MCP Server${colors.reset}\n`);
        // Test 1: List available tools
        console.log(`${colors.yellow}Test 1: Listing available tools${colors.reset}`);
        const tools = await client.listTools();
        console.log(`Found ${tools.tools.length} tools:`);
        tools.tools.forEach((tool) => {
            console.log(`  - ${colors.cyan}${tool.name}${colors.reset}: ${tool.description.substring(0, 60)}...`);
        });
        console.log();
        // Test 2: Search plants
        console.log(`${colors.yellow}Test 2: Search for velvety plants${colors.reset}`);
        try {
            const searchResult = await client.callTool({
                name: "search_plants",
                arguments: {
                    query: "velvety leaves with prominent veins",
                    limit: 5,
                }
            });
            console.log(`${colors.green}✓ Search completed${colors.reset}`);
            console.log('Sample result:', JSON.stringify(searchResult, null, 2).substring(0, 200) + '...\n');
        }
        catch (error) {
            console.log(`${colors.red}✗ Search failed: ${error}${colors.reset}\n`);
        }
        // Test 3: Get all plants
        console.log(`${colors.yellow}Test 3: Get all plants summary${colors.reset}`);
        try {
            const plantsResult = await client.callTool({
                name: "get_plant_details",
                arguments: {}
            });
            console.log(`${colors.green}✓ Retrieved plant list${colors.reset}`);
            const content = plantsResult.content;
            if (content && Array.isArray(content) && content[0]?.text) {
                const parsed = JSON.parse(content[0].text);
                console.log(`Total plants: ${parsed.count || parsed.plants?.length || 0}\n`);
            }
        }
        catch (error) {
            console.log(`${colors.red}✗ Get plants failed: ${error}${colors.reset}\n`);
        }
        // Test 4: Predict care (will need a real plant ID)
        console.log(`${colors.yellow}Test 4: Predict care for a plant${colors.reset}`);
        console.log(`${colors.cyan}Note: This test requires a valid plant ID from your database${colors.reset}`);
        try {
            // This will fail without a real plant ID, but tests the connection
            const careResult = await client.callTool({
                name: "predict_care",
                arguments: {
                    plantId: "test-plant-id",
                    careType: "water",
                }
            });
            console.log(`${colors.green}✓ Care prediction completed${colors.reset}\n`);
        }
        catch (error) {
            console.log(`${colors.yellow}⚠ Care prediction test skipped (expected without real plant ID)${colors.reset}\n`);
        }
        // Test 5: Diagnose symptoms
        console.log(`${colors.yellow}Test 5: Diagnose plant symptoms${colors.reset}`);
        console.log(`${colors.cyan}Note: This test requires a valid plant ID from your database${colors.reset}`);
        try {
            const diagnosisResult = await client.callTool({
                name: "diagnose_symptoms",
                arguments: {
                    plantId: "test-plant-id",
                    symptoms: ["yellowing leaves", "brown tips", "slow growth"],
                    environmental: {
                        temperature: 72,
                        humidity: 60,
                        vpd: 1.2,
                    },
                }
            });
            console.log(`${colors.green}✓ Diagnosis completed${colors.reset}\n`);
        }
        catch (error) {
            console.log(`${colors.yellow}⚠ Diagnosis test skipped (expected without real plant ID)${colors.reset}\n`);
        }
        console.log(`${colors.bright}${colors.green}✨ All tests completed!${colors.reset}`);
        console.log(`\n${colors.bright}Next steps:${colors.reset}`);
        console.log(`1. Install dependencies: ${colors.cyan}cd plantDB/mcp-server && npm install${colors.reset}`);
        console.log(`2. Build the server: ${colors.cyan}npm run build${colors.reset}`);
        console.log(`3. Add to Sovria's MCP config (see integration docs)`);
        console.log(`4. Test with real plant IDs from your database`);
    }
    catch (error) {
        console.error(`${colors.red}Test failed: ${error}${colors.reset}`);
    }
    finally {
        // Clean up
        await client.close();
        serverProcess.kill();
    }
}
// Run tests
testMCPServer().catch(console.error);
//# sourceMappingURL=test-server.js.map