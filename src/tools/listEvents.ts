import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListEventsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerListEventsTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "list_events",
    "List system events with optional filtering. Events track all state changes across websets, searches, enrichments, monitors, and webhooks.",
    {
      limit: z.number().optional().describe("Number of events to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response"),
      type: z.string().optional().describe("Filter by event type (e.g., 'webset.idle', 'webset.search.completed', 'webset.enrichment.completed')")
    },
    async ({ limit, cursor, type }) => {
      const requestId = `list_events-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_events');
      
      logger.start("Listing events");
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        if (type) params.type = type;
        
        checkpoint('list_events_request_prepared');
        logger.log("Sending list events request to API");
        
        const response = await client.get<ListEventsResponse>(
          API_CONFIG.ENDPOINTS.EVENTS,
          params
        );
        
        logger.log(`Retrieved ${response.data.length} events`);
        checkpoint('list_events_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('list_events_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'listing events');
      }
    }
  );
}
