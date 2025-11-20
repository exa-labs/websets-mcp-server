import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset, UpdateWebsetParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerUpdateWebsetTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "update_webset",
    "Update a webset's metadata. Use this to add or update custom key-value pairs associated with the webset.",
    {
      id: z.string().describe("The ID or externalId of the webset to update"),
      metadata: z.record(z.string().max(1000)).describe("Key-value pairs to associate with the webset. Each value must be a string with max length 1000.")
    },
    async ({ id, metadata }) => {
      const requestId = `update_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'update_webset', config?.debug);
      
      logger.start(`Updating webset: ${id}`);
      
      try {
        const axiosInstance = createAxiosClient(config);

        const params: UpdateWebsetParams = {
          metadata: metadata || null
        };
        
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
        
        return {
          content: [{
            type: "text" as const,
            text: formatApiError(error, 'update_webset')
          }],
          isError: true,
        };
      }
    }
  );
}
