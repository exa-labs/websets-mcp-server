import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListWebsetsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerListWebsetsTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "list_websets",
    "List all websets in your account. Returns a paginated list of webset collections with their current status and item counts.",
    {
      limit: z.number().int().min(1).max(100).optional().describe("Number of websets to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ limit, cursor }) => {
      const requestId = `list_websets-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_websets', config?.debug);
      
      logger.start("Listing websets");
      
      try {
        const axiosInstance = createAxiosClient(config);

        const params: Record<string, any> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        
        logger.log("Sending list websets request to API");
        
        const response = await axiosInstance.get<ListWebsetsResponse>(
          API_CONFIG.ENDPOINTS.WEBSETS,
          { params }
        );
        
        logger.log(`Retrieved ${response.data.data.length} websets`);

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
            text: formatApiError(error, 'list_websets')
          }],
          isError: true,
        };
      }
    }
  );
}
