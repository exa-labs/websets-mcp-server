import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListItemsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

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
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: 30000
        });

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
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Error listing items (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error listing items: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
