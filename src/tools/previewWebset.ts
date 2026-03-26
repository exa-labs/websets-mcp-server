import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { PreviewWebsetResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";

export function registerPreviewWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "preview_webset",
    "Preview how a search query will be interpreted before creating a webset. Returns the detected entity type, generated search criteria, and suggested enrichment columns. Useful for understanding what a query will produce before committing.",
    {
      query: z.string().describe("Natural language query to preview (e.g., 'AI startups in San Francisco')")
    },
    async ({ query }) => {
      const requestId = `preview_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'preview_webset');
      
      logger.start(`Previewing webset for query: "${query}"`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        logger.log("Sending preview request to API");
        
        const response = await client.post<PreviewWebsetResponse>(
          API_CONFIG.ENDPOINTS.WEBSET_PREVIEW,
          { query }
        );
        
        logger.log("Preview complete");

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'previewing webset');
      }
    }
  );
}
