import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetSearch } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

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
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: 30000
        });
        
        logger.log("Sending get search request to API");
        
        const response = await axiosInstance.get<WebsetSearch>(
          API_CONFIG.ENDPOINTS.WEBSET_SEARCH_BY_ID(websetId, searchId)
        );
        
        logger.log(`Retrieved search: ${response.data.id} (status: ${response.data.status})`);

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
            text: formatApiError(error, 'get_search')
          }],
          isError: true,
        };
      }
    }
  );
}

