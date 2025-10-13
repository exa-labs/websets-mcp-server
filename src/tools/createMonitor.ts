import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetMonitor, CreateMonitorParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerCreateMonitorTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_monitor",
    "Create a monitor to automatically update a webset on a schedule. Monitors can either search for new items or refresh existing ones.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      name: z.string().optional().describe("Name for the monitor"),
      schedule: z.string().describe("Cron expression for the schedule (e.g., '0 9 * * 1' for every Monday at 9am)"),
      behavior: z.enum(['search', 'refresh']).describe("'search' to find new items, 'refresh' to update existing items"),
      enabled: z.boolean().optional().describe("Whether the monitor should be enabled immediately (default: true)")
    },
    async ({ websetId, name, schedule, behavior, enabled }) => {
      const requestId = `create_monitor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_monitor');
      
      logger.start(`Creating monitor for webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: 30000
        });

        const params: CreateMonitorParams = {
          name,
          schedule,
          behavior,
          enabled: enabled !== undefined ? enabled : true
        };
        
        logger.log("Sending create monitor request to API");
        
        const response = await axiosInstance.post<WebsetMonitor>(
          API_CONFIG.ENDPOINTS.WEBSET_MONITORS(websetId),
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
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Error creating monitor (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error creating monitor: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
