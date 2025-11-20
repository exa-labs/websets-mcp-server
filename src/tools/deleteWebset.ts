import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerDeleteWebsetTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "delete_webset",
    "Delete a webset and all its items. This action is permanent and cannot be undone.",
    {
      id: z.string().describe("The ID or externalId of the webset to delete")
    },
    async ({ id }) => {
      const requestId = `delete_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_webset', config?.debug);
      
      logger.start(`Deleting webset: ${id}`);
      
      try {
        const axiosInstance = createAxiosClient(config);
        
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
        
        return {
          content: [{
            type: "text" as const,
            text: formatApiError(error, 'delete_webset')
          }],
          isError: true,
        };
      }
    }
  );
}
