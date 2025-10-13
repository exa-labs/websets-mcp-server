import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerGetWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_webset",
    "Get details about a specific webset by ID or externalId. Returns full webset information including status, item count, and metadata.",
    {
      id: z.string().describe("The ID or externalId of the webset"),
      expandItems: z.boolean().optional().describe("Include all items in the response (default: false)")
    },
    async ({ id, expandItems }) => {
      const requestId = `get_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webset');
      
      logger.start(`Getting webset: ${id}`);
      
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
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Error getting webset (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error getting webset: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
