import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListItemsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerListItemsTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "list_webset_items",
    "List all items in a webset. Returns entities (companies, people, papers) that have been discovered and verified in the collection.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      limit: z.number().optional().describe("Number of items to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ websetId, limit, cursor }) => {
      const requestId = `list_items-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_webset_items');
      
      logger.start(`Listing items for webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        
        logger.log("Sending list items request to API");
        
        const response = await client.get<ListItemsResponse>(
          API_CONFIG.ENDPOINTS.WEBSET_ITEMS(websetId),
          params
        );
        
        logger.log(`Retrieved ${response.data.length} items`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'listing items');
      }
    }
  );
}
