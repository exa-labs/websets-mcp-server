import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetItem } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerGetItemTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_item",
    "Get a specific item from a webset by its ID. Returns detailed information about the item including all enrichment data.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      itemId: z.string().describe("The ID of the item to retrieve")
    },
    async ({ websetId, itemId }) => {
      const requestId = `get_item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_item');
      
      logger.start(`Getting item ${itemId} from webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('get_item_request_prepared');
        logger.log("Sending get item request to API");
        
        const response = await client.get<WebsetItem>(
          API_CONFIG.ENDPOINTS.WEBSET_ITEM_BY_ID(websetId, itemId)
        );
        
        logger.log(`Retrieved item: ${response.id}`);
        checkpoint('get_item_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('get_item_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting item');
      }
    }
  );
}
