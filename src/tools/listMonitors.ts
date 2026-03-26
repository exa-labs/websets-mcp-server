import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListMonitorsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerListMonitorsTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "list_monitors",
    "List all monitors. Returns a paginated list of monitors with their schedule, status, and configuration.",
    {
      limit: z.number().optional().describe("Number of monitors to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ limit, cursor }) => {
      const requestId = `list_monitors-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_monitors');
      
      logger.start("Listing monitors");
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        
        checkpoint('list_monitors_request_prepared');
        logger.log("Sending list monitors request to API");
        
        const response = await client.get<ListMonitorsResponse>(
          API_CONFIG.ENDPOINTS.MONITORS,
          params
        );
        
        logger.log(`Retrieved ${response.data.length} monitors`);
        checkpoint('list_monitors_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('list_monitors_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'listing monitors');
      }
    }
  );
}
