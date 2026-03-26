import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Webhook, CreateWebhookParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerCreateWebhookTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_webhook",
    `Create a webhook to receive real-time HTTP callbacks when events occur in your websets.

Example call:
{
  "url": "https://example.com/webhook",
  "events": ["webset.search.completed", "webset.enrichment.completed"]
}`,
    {
      url: z.string().url().describe("The URL to send webhook events to"),
      events: z.array(z.string()).describe("List of event types to subscribe to (e.g., 'webset.search.completed', 'webset.enrichment.completed', 'webset.idle')"),
      secret: z.string().optional().describe("A secret string used to sign webhook payloads for verification"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this webhook")
    },
    async ({ url, events, secret, metadata }) => {
      const requestId = `create_webhook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webhook');
      
      logger.start(`Creating webhook for: ${url}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: CreateWebhookParams = {
          url,
          events,
          ...(secret && { secret }),
          ...(metadata && { metadata })
        };
        
        logger.log("Sending create webhook request to API");
        
        const response = await client.post<Webhook>(
          API_CONFIG.ENDPOINTS.WEBHOOKS,
          params
        );
        
        logger.log(`Created webhook: ${response.id}`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'creating webhook');
      }
    }
  );
}
