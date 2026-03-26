import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetMonitor } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerGetMonitorTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_monitor",
    "Get details about a specific monitor, including its schedule, behavior configuration, and status.",
    {
      monitorId: z.string().describe("The ID of the monitor to retrieve")
    },
    async ({ monitorId }) => {
      const requestId = `get_monitor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_monitor');
      
      logger.start(`Getting monitor: ${monitorId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('get_monitor_request_prepared');
        logger.log("Sending get monitor request to API");
        
        const response = await client.get<WebsetMonitor>(
          API_CONFIG.ENDPOINTS.MONITOR_BY_ID(monitorId)
        );
        
        logger.log(`Retrieved monitor: ${response.id} (status: ${response.status})`);
        checkpoint('get_monitor_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('get_monitor_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting monitor');
      }
    }
  );
}
