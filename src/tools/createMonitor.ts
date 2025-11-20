import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetMonitor, CreateMonitorParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerCreateMonitorTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "create_monitor",
    `Create a monitor to automatically update a webset on a schedule. Monitors run search operations to find new items.

IMPORTANT PARAMETER FORMATS:
- cron: MUST be 5-field format "minute hour day month weekday" (e.g., "0 9 * * 1")
- entity: MUST be an object like {type: "company"} (NOT a string)
- criteria: MUST be array of objects like [{description: "..."}] (NOT array of strings)

Example call:
{
  "websetId": "webset_123",
  "cron": "0 9 * * 1",
  "query": "New AI startups",
  "entity": {"type": "company"},
  "criteria": [{"description": "Founded in last 30 days"}],
  "count": 10
}`,
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      cron: z.string().describe("Cron expression for the schedule (e.g., '0 9 * * 1' for every Monday at 9am). Must be valid Unix cron with 5 fields."),
      timezone: z.string().optional().describe("IANA timezone (e.g., 'America/New_York'). Defaults to 'Etc/UTC'"),
      query: z.string().optional().describe("The search query to use. Defaults to the last search query used."),
      criteria: z.array(z.object({
        description: z.string()
      })).optional().describe("Additional criteria for evaluating search results. Each criterion is an object with a 'description' field. Example: [{description: 'Recently received funding'}, {description: 'Hiring engineers'}]"),
      entity: z.object({
        type: z.string()
      }).optional().describe("Entity type configuration for the search. Must be an object with a 'type' field. Example: {type: 'company'}"),
      count: z.number().int().min(1).optional().describe("Maximum number of results to find per run (must be positive integer)"),
      behavior: z.enum(['append', 'override']).optional().describe("How new items should be added: 'append' adds to existing items, 'override' replaces them (default: append)")
    },
    async ({ websetId, cron, timezone, query, criteria, entity, count, behavior }) => {
      const requestId = `create_monitor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_monitor', config?.debug);
      
      logger.start(`Creating monitor for webset: ${websetId}`);
      
      try {
        // Validate cron expression has 5 fields
        const cronFields = cron.trim().split(/\s+/);
        if (cronFields.length !== 5) {
          return {
            content: [{
              type: "text" as const,
              text: `Invalid cron expression: "${cron}". Must have exactly 5 fields (minute hour day month weekday). Examples: "0 9 * * 1" (every Monday at 9am), "0 0 * * *" (daily at midnight)`
            }],
            isError: true,
          };
        }

        const axiosInstance = createAxiosClient(config);

        const params: CreateMonitorParams = {
          websetId,
          cadence: {
            cron,
            ...(timezone && { timezone })
          },
          behavior: {
            type: 'search',
            config: {
              ...(query && { query }),
              ...(criteria && { criteria }),
              ...(entity && { entity }),
              ...(count && { count }),
              ...(behavior && { behavior })
            }
          }
        };
        
        logger.log("Sending create monitor request to API");
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
        const response = await axiosInstance.post<WebsetMonitor>(
          API_CONFIG.ENDPOINTS.MONITORS,
          params
        );
        
        logger.log(`Created monitor: ${response.data.id}`);

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        return {
          content: [{
            type: "text" as const,
            text: formatApiError(error, 'create_monitor', true) + '\n\nExample:\n' +
              '{\n' +
              '  "websetId": "webset_123",\n' +
              '  "cron": "0 9 * * 1",\n' +
              '  "timezone": "America/New_York",\n' +
              '  "query": "New AI startups",\n' +
              '  "criteria": [{"description": "Founded in last 30 days"}],\n' +
              '  "entity": {"type": "company"},\n' +
              '  "count": 10,\n' +
              '  "behavior": "append"\n' +
              '}\n\n' +
              'Common cron schedules:\n' +
              '- "0 9 * * 1" = Every Monday at 9am\n' +
              '- "0 0 * * *" = Daily at midnight\n' +
              '- "0 */6 * * *" = Every 6 hours'
          }],
          isError: true,
        };
      }
    }
  );
}
