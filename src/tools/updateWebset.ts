import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webset, UpdateWebsetParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerUpdateWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "update_webset",
    "Update a webset's title and/or metadata.",
    {
      id: z.string().describe("The ID or externalId of the webset to update"),
      title: z.string().min(1).optional().describe("New title for the webset"),
      metadata: z.record(z.string().max(1000)).optional().describe("Key-value pairs to associate with the webset. Each value must be a string with max length 1000. Pass null to clear.")
    },
    async ({ id, title, metadata }) => {
      const requestId = `update_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'update_webset');
      
      logger.start(`Updating webset: ${id}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: UpdateWebsetParams = {
          ...(title && { title }),
          ...(metadata !== undefined && { metadata: metadata || null })
        };
        
        logger.log("Sending update webset request to API");
        
        const response = await client.post<Webset>(
          API_CONFIG.ENDPOINTS.WEBSET_BY_ID(id),
          params
        );
        
        logger.log(`Updated webset: ${response.id}`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'updating webset');
      }
    }
  );
}
