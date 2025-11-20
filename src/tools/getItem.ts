import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetItem } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerGetItemTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "get_item",
    "Get a specific item from a webset by its ID. Returns detailed information about the item including all enrichment data.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      itemId: z.string().describe("The ID of the item to retrieve")
    },
    async ({ websetId, itemId }) => {
      const requestId = `get_item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_item', config?.debug);
      
      logger.start(`Getting item ${itemId} from webset: ${websetId}`);
      
      try {
        const axiosInstance = createAxiosClient(config);
        
        logger.log("Sending get item request to API");
        
        const response = await axiosInstance.get<WebsetItem>(
          API_CONFIG.ENDPOINTS.WEBSET_ITEM_BY_ID(websetId, itemId)
        );
        
        logger.log(`Retrieved item: ${response.data.id}`);

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
            text: formatApiError(error, 'get_item')
          }],
          isError: true,
        };
      }
    }
  );
}

