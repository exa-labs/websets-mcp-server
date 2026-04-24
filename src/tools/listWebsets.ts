import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListWebsetsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerListWebsetsTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "list_websets",
    "List all websets in your account. Returns a paginated list of webset collections with their current status, searches, enrichments, imports, and metadata.",
    {
      limit: z.coerce.number().optional().describe("Number of websets to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ limit, cursor }) => {
      const requestId = `list_websets-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_websets');
      
      logger.start("Listing websets");
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        
        checkpoint('list_websets_request_prepared');
        logger.log("Sending list websets request to API");
        
        const response = await client.get<ListWebsetsResponse>(
          API_CONFIG.ENDPOINTS.WEBSETS,
          params
        );
        
        logger.log(`Retrieved ${response.data.length} websets`);
        checkpoint('list_websets_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('list_websets_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'listing websets');
      }
    }
  );
}
