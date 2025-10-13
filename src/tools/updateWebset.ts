import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset, UpdateWebsetParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerUpdateWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "update_webset",
    "Update a webset's name or description. Use this to rename or add/update metadata for an existing webset.",
    {
      id: z.string().describe("The ID or externalId of the webset to update"),
      name: z.string().optional().describe("New name for the webset"),
      description: z.string().optional().describe("New description for the webset")
    },
    async ({ id, name, description }) => {
      const requestId = `update_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'update_webset');
      
      logger.start(`Updating webset: ${id}`);
      
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

        const params: UpdateWebsetParams = {};
        if (name) params.name = name;
        if (description) params.description = description;
        
        logger.log("Sending update webset request to API");
        
        const response = await axiosInstance.post<Webset>(
          API_CONFIG.ENDPOINTS.WEBSET_BY_ID(id),
          params
        );
        
        logger.log(`Updated webset: ${response.data.id}`);

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
              text: `Error updating webset (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error updating webset: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
