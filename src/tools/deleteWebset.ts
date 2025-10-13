import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerDeleteWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "delete_webset",
    "Delete a webset and all its items. This action is permanent and cannot be undone.",
    {
      id: z.string().describe("The ID or externalId of the webset to delete")
    },
    async ({ id }) => {
      const requestId = `delete_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_webset');
      
      logger.start(`Deleting webset: ${id}`);
      
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
        
        logger.log("Sending delete webset request to API");
        
        const response = await axiosInstance.delete<Webset>(
          API_CONFIG.ENDPOINTS.WEBSET_BY_ID(id)
        );
        
        logger.log(`Deleted webset: ${id}`);

        const result = {
          content: [{
            type: "text" as const,
            text: `Successfully deleted webset: ${id}\n\n${JSON.stringify(response.data, null, 2)}`
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
              text: `Error deleting webset (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error deleting webset: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
