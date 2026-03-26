import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetSearch } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerGetSearchTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_search",
    "Get details about a specific search, including its status, progress, and results found.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      searchId: z.string().describe("The ID of the search to retrieve")
    },
    async ({ websetId, searchId }) => {
      const requestId = `get_search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_search');
      
      logger.start(`Getting search ${searchId} from webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('get_search_request_prepared');
        logger.log("Sending get search request to API");
        
        const response = await client.get<WebsetSearch>(
          API_CONFIG.ENDPOINTS.WEBSET_SEARCH_BY_ID(websetId, searchId)
        );
        
        logger.log(`Retrieved search: ${response.id} (status: ${response.status})`);
        checkpoint('get_search_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('get_search_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting search');
      }
    }
  );
}
