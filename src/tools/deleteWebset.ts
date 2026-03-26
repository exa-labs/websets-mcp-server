import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

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
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('delete_webset_request_prepared');
        logger.log("Sending delete webset request to API");
        
        const response = await client.delete<Webset>(
          API_CONFIG.ENDPOINTS.WEBSET_BY_ID(id)
        );
        
        logger.log(`Deleted webset: ${id}`);
        checkpoint('delete_webset_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: `Successfully deleted webset: ${id}\n\n${JSON.stringify(response, null, 2)}`
          }]
        };
        
        checkpoint('delete_webset_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'deleting webset');
      }
    }
  );
}
