import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Import } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerGetImportTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_import",
    "Get details about a specific import, including its status, upload URL, and processing progress.",
    {
      importId: z.string().describe("The ID of the import to retrieve")
    },
    async ({ importId }) => {
      const requestId = `get_import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_import');
      
      logger.start(`Getting import: ${importId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('get_import_request_prepared');
        logger.log("Sending get import request to API");
        
        const response = await client.get<Import>(
          API_CONFIG.ENDPOINTS.IMPORT_BY_ID(importId)
        );
        
        logger.log(`Retrieved import: ${response.id} (status: ${response.status})`);
        checkpoint('get_import_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('get_import_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting import');
      }
    }
  );
}
