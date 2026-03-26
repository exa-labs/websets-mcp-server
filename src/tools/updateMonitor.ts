import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetMonitor, UpdateMonitorParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerUpdateMonitorTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "update_monitor",
    "Update a monitor's schedule, behavior, or status (enable/disable).",
    {
      monitorId: z.string().describe("The ID of the monitor to update"),
      cron: z.string().optional().describe("New cron expression for the schedule (e.g., '0 9 * * 1' for every Monday at 9am)"),
      timezone: z.string().optional().describe("IANA timezone (e.g., 'America/New_York'). Only used with cron."),
      status: z.enum(['enabled', 'disabled']).optional().describe("Enable or disable the monitor"),
      query: z.string().optional().describe("New search query for the monitor"),
      criteria: z.array(z.object({
        description: z.string()
      })).optional().describe("New criteria for evaluating search results"),
      entity: z.object({
        type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']),
        description: z.string().optional()
      }).optional().describe("New entity type configuration"),
      count: z.number().optional().describe("New maximum number of results per run"),
      searchBehavior: z.enum(['append', 'override']).optional().describe("How new items should be added"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this monitor")
    },
    async ({ monitorId, cron, timezone, status, query, criteria, entity, count, searchBehavior, metadata }) => {
      const requestId = `update_monitor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'update_monitor');
      
      logger.start(`Updating monitor: ${monitorId}`);
      
      try {
        if (count !== undefined && count < 1) {
          return {
            content: [{
              type: "text" as const,
              text: `Invalid count: ${count}. Must be at least 1.`
            }],
            isError: true,
          };
        }

        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: UpdateMonitorParams = {
          ...(status && { status }),
          ...(metadata && { metadata })
        };

        if (cron) {
          params.cadence = { cron, ...(timezone && { timezone }) };
        }

        if (query || criteria || entity || count !== undefined || searchBehavior) {
          params.behavior = {
            type: 'search',
            config: {
              ...(query && { query }),
              ...(criteria && { criteria }),
              ...(entity && { entity }),
              ...(count !== undefined && { count }),
              ...(searchBehavior && { behavior: searchBehavior })
            }
          };
        }
        
        logger.log("Sending update monitor request to API");
        
        const response = await client.patch<WebsetMonitor>(
          API_CONFIG.ENDPOINTS.MONITOR_BY_ID(monitorId),
          params
        );
        
        logger.log(`Updated monitor: ${response.id}`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'updating monitor');
      }
    }
  );
}
