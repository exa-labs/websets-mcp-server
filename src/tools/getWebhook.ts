import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webhook } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerGetWebhookTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_webhook",
    "Get details about a specific webhook. The webhook secret is not returned here for security — it is only shown when the webhook is first created.",
    {
      webhookId: z.string().describe("The ID of the webhook to retrieve")
    },
    async ({ webhookId }) => {
      const requestId = `get_webhook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_webhook');
      
      logger.start(`Getting webhook: ${webhookId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        logger.log("Sending get webhook request to API");
        
        const response = await client.get<Webhook>(
          API_CONFIG.ENDPOINTS.WEBHOOK_BY_ID(webhookId)
        );
        
        logger.log(`Retrieved webhook: ${response.id} (status: ${response.status})`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting webhook');
      }
    }
  );
}
