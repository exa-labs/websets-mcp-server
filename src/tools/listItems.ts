import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListItemsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerListItemsTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "list_webset_items",
    "List all items in a webset. Returns entities (companies, people, papers) that have been discovered and verified in the collection.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      limit: z.number().int().min(1).max(100).optional().describe("Number of items to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ websetId, limit, cursor }) => {
      const requestId = `list_items-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_webset_items', config?.debug);
      
      logger.start(`Listing items for webset: ${websetId}`);
      
      try {
        const axiosInstance = createAxiosClient(config);

        const params: Record<string, any> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        
        logger.log("Sending list items request to API");
        
        const response = await axiosInstance.get<ListItemsResponse>(
          API_CONFIG.ENDPOINTS.WEBSET_ITEMS(websetId),
          { params }
        );
        
        logger.log(`Retrieved ${response.data.data.length} items`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        return {
          content: [{
            type: "text" as const,
            text: formatApiError(error, 'list_webset_items')
          }],
          isError: true,
        };
      }
    }
  );
}
