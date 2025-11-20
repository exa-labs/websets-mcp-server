import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerGetWebsetTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "get_webset",
    "Get details about a specific webset by ID or externalId. Returns full webset information including status, item count, and metadata.",
    {
      id: z.string().describe("The ID or externalId of the webset"),
      expandItems: z.boolean().optional().describe("Include all items in the response (default: false)")
    },
    async ({ id, expandItems }) => {
      const requestId = `get_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset', config?.debug);
      
      logger.start(`Getting webset: ${id}`);
      
      try {
        const axiosInstance = createAxiosClient(config);

        const params: Record<string, any> = {};
        if (expandItems) {
          params.expand = ['items'];
        }
        
        logger.log("Sending get webset request to API");
        
        const response = await axiosInstance.get<Webset>(
          API_CONFIG.ENDPOINTS.WEBSET_BY_ID(id),
          { params }
        );
        
        logger.log(`Retrieved webset: ${response.data.id}`);

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
            text: formatApiError(error, 'get_webset')
          }],
          isError: true,
        };
      }
    }
  );
}
