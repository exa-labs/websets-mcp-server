import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListWebhooksResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerListWebhooksTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "list_webhooks",
    "List all webhooks in your account. Returns a paginated list of webhooks with their URL, events, status, and metadata.",
    {
      limit: z.coerce.number().optional().describe("Number of webhooks to return (default: 25, max: 200)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ limit, cursor }) => {
      const requestId = `list_webhooks-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_webhooks');
      
      logger.start("Listing webhooks");
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (limit) params.limit = Math.min(limit, 200);
        if (cursor) params.cursor = cursor;
        
        checkpoint('list_webhooks_request_prepared');
        logger.log("Sending list webhooks request to API");
        
        const response = await client.get<ListWebhooksResponse>(
          API_CONFIG.ENDPOINTS.WEBHOOKS,
          params
        );
        
        logger.log(`Retrieved ${response.data.length} webhooks`);
        checkpoint('list_webhooks_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('list_webhooks_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'listing webhooks');
      }
    }
  );
}
