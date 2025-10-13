#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Import tool implementations
import { registerCreateWebsetTool } from "./tools/createWebset.js";
import { registerListWebsetsTool } from "./tools/listWebsets.js";
import { registerGetWebsetTool } from "./tools/getWebset.js";
import { registerUpdateWebsetTool } from "./tools/updateWebset.js";
import { registerDeleteWebsetTool } from "./tools/deleteWebset.js";
import { registerListItemsTool } from "./tools/listItems.js";
import { registerCreateEnrichmentTool } from "./tools/createEnrichment.js";
import { registerCreateMonitorTool } from "./tools/createMonitor.js";
import { log } from "./utils/logger.js";

// Configuration schema for the EXA API key and tool selection
export const configSchema = z.object({
  exaApiKey: z.string().optional().describe("Exa AI API key for websets operations"),
  enabledTools: z.array(z.string()).optional().describe("List of tools to enable (if not specified, all tools are enabled)"),
  debug: z.boolean().default(false).describe("Enable debug logging")
});

// Export stateless flag for MCP
export const stateless = true;

// Tool registry for managing available tools
const availableTools = {
  'create_webset': { name: 'Create Webset', description: 'Create a new webset collection', enabled: true },
  'list_websets': { name: 'List Websets', description: 'List all websets', enabled: true },
  'get_webset': { name: 'Get Webset', description: 'Get details about a specific webset', enabled: true },
  'update_webset': { name: 'Update Webset', description: 'Update webset metadata', enabled: true },
  'delete_webset': { name: 'Delete Webset', description: 'Delete a webset', enabled: true },
  'list_webset_items': { name: 'List Items', description: 'List items in a webset', enabled: true },
  'create_enrichment': { name: 'Create Enrichment', description: 'Add data enrichment to webset', enabled: true },
  'create_monitor': { name: 'Create Monitor', description: 'Create automated webset monitor', enabled: true },
};  

/**
 * Exa Websets MCP Server
 * 
 * This MCP server integrates Exa's Websets API with Claude and other MCP-compatible clients.
 * Websets enable building, maintaining, and enriching collections of web entities like companies,
 * people, and research papers.
 * 
 * The server provides tools that enable:
 * - Creating and managing webset collections
 * - Searching for and verifying entities
 * - Extracting custom data with AI-powered enrichments
 * - Automating updates with scheduled monitors
 * - Managing webhooks for real-time notifications
 */

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  try {
    if (config.debug) {
      log("Starting Websets MCP Server in debug mode");
    }

    // Create MCP server
    const server = new McpServer({
      name: "websets-server",
      title: "Exa Websets",
      version: "1.0.0"
    });
    
    log("Server initialized with modern MCP SDK and Smithery CLI support");

    // Helper function to check if a tool should be registered
    const shouldRegisterTool = (toolId: string): boolean => {
      if (config.enabledTools && config.enabledTools.length > 0) {
        return config.enabledTools.includes(toolId);
      }
      return availableTools[toolId as keyof typeof availableTools]?.enabled ?? false;
    };

    // Register tools based on configuration
    const registeredTools: string[] = [];
    
    if (shouldRegisterTool('create_webset')) {
      registerCreateWebsetTool(server, config);
      registeredTools.push('create_webset');
    }
    
    if (shouldRegisterTool('list_websets')) {
      registerListWebsetsTool(server, config);
      registeredTools.push('list_websets');
    }
    
    if (shouldRegisterTool('get_webset')) {
      registerGetWebsetTool(server, config);
      registeredTools.push('get_webset');
    }
    
    if (shouldRegisterTool('update_webset')) {
      registerUpdateWebsetTool(server, config);
      registeredTools.push('update_webset');
    }
    
    if (shouldRegisterTool('delete_webset')) {
      registerDeleteWebsetTool(server, config);
      registeredTools.push('delete_webset');
    }
    
    if (shouldRegisterTool('list_webset_items')) {
      registerListItemsTool(server, config);
      registeredTools.push('list_webset_items');
    }
    
    if (shouldRegisterTool('create_enrichment')) {
      registerCreateEnrichmentTool(server, config);
      registeredTools.push('create_enrichment');
    }
    
    if (shouldRegisterTool('create_monitor')) {
      registerCreateMonitorTool(server, config);
      registeredTools.push('create_monitor');
    }
    
    if (config.debug) {
      log(`Registered ${registeredTools.length} tools: ${registeredTools.join(', ')}`);
    }
    
    // Return the server object (Smithery CLI handles transport)
    return server.server;
    
  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
