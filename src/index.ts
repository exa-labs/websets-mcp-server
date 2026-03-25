#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { log } from "./utils/logger.js";
import { initializeMcpServer } from "./mcp-handler.js";

// Configuration schema for the EXA API key and tool selection
export const configSchema = z.object({
  exaApiKey: z.string().optional().describe("Exa AI API key for websets operations"),
  enabledTools: z.union([
    z.array(z.string()),
    z.string()
  ]).optional().describe("List of tools to enable (comma-separated string or array)"),
  tools: z.union([
    z.array(z.string()),
    z.string()
  ]).optional().describe("List of tools to enable (comma-separated string or array) - alias for enabledTools"),
  debug: z.boolean().default(false).describe("Enable debug logging")
});

// Export stateless flag for MCP
export const stateless = true;

/**
 * Exa Websets MCP Server
 * 
 * This MCP server integrates Exa's Websets API with Claude and other MCP-compatible clients.
 * Websets enable building, maintaining, and enriching collections of web entities like companies,
 * people, and research papers.
 * 
 * This is the Smithery CLI entry point. For Vercel deployment, see api/mcp.ts
 */

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
  try {
    // Parse and normalize tool selection
    let parsedEnabledTools: string[] | undefined;

    const toolsParam = config.tools || config.enabledTools;

    if (toolsParam) {
      if (typeof toolsParam === 'string') {
        parsedEnabledTools = toolsParam
          .split(',')
          .map(tool => tool.trim())
          .filter(tool => tool.length > 0);
      } else if (Array.isArray(toolsParam)) {
        parsedEnabledTools = toolsParam;
      }
    }

    const normalizedConfig = {
      exaApiKey: config.exaApiKey,
      enabledTools: parsedEnabledTools,
      debug: config.debug
    };

    if (config.debug) {
      log("Starting Websets MCP Server (Smithery) in debug mode");
      if (parsedEnabledTools) {
        log(`Enabled tools from config: ${parsedEnabledTools.join(', ')}`);
      }
    }

    // Create MCP server
    const server = new McpServer({
      name: "websets-server",
      title: "Exa Websets",
      version: "1.0.1"
    });

    log("Server initialized with modern MCP SDK and Smithery CLI support");

    // Initialize server with shared logic
    initializeMcpServer(server, normalizedConfig);

    // Return the server object (Smithery CLI handles transport)
    return server.server;

  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
