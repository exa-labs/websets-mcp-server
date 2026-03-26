import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webhook, UpdateWebhookParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerUpdateWebhookTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "update_webhook",
    "Update a webhook's URL, events, or metadata. Changes take effect immediately. The webhook keeps its current status (active/inactive) when updated.",
    {
      webhookId: z.string().describe("The ID of the webhook to update"),
      url: z.string().url().optional().describe("New URL to send webhook events to"),
      events: z.array(z.string()).min(1).optional().describe("New list of event types to subscribe to"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this webhook")
    },
    async ({ webhookId, url, events, metadata }) => {
      const requestId = `update_webhook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'update_webhook');
      
      logger.start(`Updating webhook: ${webhookId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: UpdateWebhookParams = {
          ...(url && { url }),
          ...(events && { events }),
          ...(metadata && { metadata })
        };
        
        checkpoint('update_webhook_request_prepared');
        logger.log("Sending update webhook request to API");
        
        const response = await client.patch<Webhook>(
          API_CONFIG.ENDPOINTS.WEBHOOK_BY_ID(webhookId),
          params
        );
        
        logger.log(`Updated webhook: ${response.id}`);
        checkpoint('update_webhook_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('update_webhook_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'updating webhook');
      }
    }
  );
}
