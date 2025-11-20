import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetSearch } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerCancelSearchTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "cancel_search",
    "Cancel a running search operation. This will stop the search from finding more items.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      searchId: z.string().describe("The ID of the search to cancel")
    },
    async ({ websetId, searchId }) => {
      const requestId = `cancel_search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_search', config?.debug);
      
      logger.start(`Canceling search ${searchId} from webset: ${websetId}`);
      
      try {
        const axiosInstance = createAxiosClient(config);
        
        logger.log("Sending cancel search request to API");
        
        const response = await axiosInstance.post<WebsetSearch>(
          `${API_CONFIG.ENDPOINTS.WEBSET_SEARCH_BY_ID(websetId, searchId)}/cancel`
        );
        
        logger.log(`Canceled search: ${response.data.id}`);

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
            text: formatApiError(error, 'cancel_search')
          }],
          isError: true,
        };
      }
    }
  );
}

