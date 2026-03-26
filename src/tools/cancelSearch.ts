import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetSearch } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerCancelSearchTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "cancel_search",
    "Cancel a running search operation. This will stop the search from finding more items.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      searchId: z.string().describe("The ID of the search to cancel")
    },
    async ({ websetId, searchId }) => {
      const requestId = `cancel_search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_search');
      
      logger.start(`Canceling search ${searchId} from webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('cancel_search_request_prepared');
        logger.log("Sending cancel search request to API");
        
        const response = await client.post<WebsetSearch>(
          `${API_CONFIG.ENDPOINTS.WEBSET_SEARCH_BY_ID(websetId, searchId)}/cancel`
        );
        
        logger.log(`Canceled search: ${response.id}`);
        checkpoint('cancel_search_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('cancel_search_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'canceling search');
      }
    }
  );
}
