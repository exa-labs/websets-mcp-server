import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerCreateExportTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_export",
    "Export webset data. Creates an export job that generates a downloadable file containing all items and enrichments from the webset.",
    {
      websetId: z.string().describe("The ID or externalId of the webset to export"),
      format: z.enum(['csv', 'json']).optional().describe("Export format (default: csv)")
    },
    async ({ websetId, format }) => {
      const requestId = `create_export-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_export');
      
      logger.start(`Creating export for webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (format) params.format = format;
        
        logger.log("Sending create export request to API");
        
        const response = await client.post<Record<string, unknown>>(
          API_CONFIG.ENDPOINTS.WEBSET_EXPORTS(websetId),
          params
        );
        
        logger.log("Export created");

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'creating export');
      }
    }
  );
}
