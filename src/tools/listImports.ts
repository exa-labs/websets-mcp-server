import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { ListImportsResponse } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerListImportsTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "list_imports",
    "List all imports. Returns a paginated list of imports with their status and metadata.",
    {
      limit: z.coerce.number().optional().describe("Number of imports to return (default: 25, max: 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response")
    },
    async ({ limit, cursor }) => {
      const requestId = `list_imports-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'list_imports');
      
      logger.start("Listing imports");
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: Record<string, unknown> = {};
        if (limit) params.limit = Math.min(limit, API_CONFIG.MAX_LIMIT);
        if (cursor) params.cursor = cursor;
        
        checkpoint('list_imports_request_prepared');
        logger.log("Sending list imports request to API");
        
        const response = await client.get<ListImportsResponse>(
          API_CONFIG.ENDPOINTS.IMPORTS,
          params
        );
        
        logger.log(`Retrieved ${response.data.length} imports`);
        checkpoint('list_imports_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('list_imports_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'listing imports');
      }
    }
  );
}
