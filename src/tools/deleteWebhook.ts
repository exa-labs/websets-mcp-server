import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webhook } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerDeleteWebhookTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "delete_webhook",
    "Delete a webhook. The webhook stops receiving notifications immediately and cannot be recovered.",
    {
      webhookId: z.string().describe("The ID of the webhook to delete")
    },
    async ({ webhookId }) => {
      const requestId = `delete_webhook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_webhook');
      
      logger.start(`Deleting webhook: ${webhookId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('delete_webhook_request_prepared');
        logger.log("Sending delete webhook request to API");
        
        const response = await client.delete<Webhook>(
          API_CONFIG.ENDPOINTS.WEBHOOK_BY_ID(webhookId)
        );
        
        logger.log(`Deleted webhook: ${webhookId}`);
        checkpoint('delete_webhook_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: `Successfully deleted webhook: ${webhookId}\n\n${JSON.stringify(response, null, 2)}`
          }]
        };
        
        checkpoint('delete_webhook_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'deleting webhook');
      }
    }
  );
}
