import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerGetWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_webset",
    "Get details about a specific webset by ID or externalId. Returns full webset information including status, searches, enrichments, monitors, imports, and metadata.",
    {
      id: z.string().describe("The ID or externalId of the webset"),
      expandItems: z.boolean().optional().describe("Include all items in the response (default: false)")
    },
    async ({ id, expandItems }) => {
      const requestId = `get_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset');
      
      logger.start(`Getting webset: ${id}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (expandItems) {
          params.expand = ['items'];
        }
        
        checkpoint('get_webset_request_prepared');
        logger.log("Sending get webset request to API");
        
        const response = await client.get<Webset>(
          API_CONFIG.ENDPOINTS.WEBSET_BY_ID(id),
          params
        );
        
        logger.log(`Retrieved webset: ${response.id}`);
        checkpoint('get_webset_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('get_webset_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting webset');
      }
    }
  );
}
