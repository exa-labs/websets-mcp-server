import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetMonitor } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerDeleteMonitorTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "delete_monitor",
    "Delete a monitor. This stops the scheduled search operations permanently.",
    {
      monitorId: z.string().describe("The ID of the monitor to delete")
    },
    async ({ monitorId }) => {
      const requestId = `delete_monitor-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_monitor');
      
      logger.start(`Deleting monitor: ${monitorId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        logger.log("Sending delete monitor request to API");
        
        const response = await client.delete<WebsetMonitor>(
          API_CONFIG.ENDPOINTS.MONITOR_BY_ID(monitorId)
        );
        
        logger.log(`Deleted monitor: ${monitorId}`);

        const result = {
          content: [{
            type: "text" as const,
            text: `Successfully deleted monitor: ${monitorId}\n\n${JSON.stringify(response, null, 2)}`
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'deleting monitor');
      }
    }
  );
}
