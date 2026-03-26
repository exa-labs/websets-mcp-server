import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { Import, CreateImportParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerCreateImportTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_import",
    `Create a new import to upload your own data (CSV) into Websets. Imports can be used for enrichment, scoped searches, or excluding known results. Returns an uploadUrl where you can PUT your CSV file.

Example call:
{
  "format": "csv",
  "size": 1024,
  "count": 100,
  "entity": {"type": "company"},
  "title": "My company list"
}`,
    {
      format: z.literal('csv').describe("Format of the import file (currently only 'csv' is supported)"),
      size: z.number().max(50000000).describe("Size of the file in bytes (max 50 MB)"),
      count: z.number().describe("Number of records in the file"),
      entity: z.object({
        type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']).describe("Type of entity in the import"),
        description: z.string().optional().describe("Required when type is 'custom'. Describes the entity type (2-200 chars).")
      }).describe("Entity type of the imported data. Example: {type: 'company'}"),
      title: z.string().optional().describe("Title for the import"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this import"),
      csvIdentifier: z.number().optional().describe("Column index (0-based) containing the key identifier (e.g., URL). If not provided, we infer it.")
    },
    async ({ format, size, count, entity, title, metadata, csvIdentifier }) => {
      const requestId = `create_import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_import');
      
      logger.start("Creating import");
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: CreateImportParams = {
          format,
          size,
          count,
          entity,
          ...(title && { title }),
          ...(metadata && { metadata }),
          ...(csvIdentifier !== undefined && { csv: { identifier: csvIdentifier } })
        };
        
        checkpoint('create_import_request_prepared');
        logger.log("Sending create import request to API");
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
        const response = await client.post<Import>(
          API_CONFIG.ENDPOINTS.IMPORTS,
          params
        );
        
        logger.log(`Created import: ${response.id}`);
        checkpoint('create_import_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('create_import_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'creating import');
      }
    }
  );
}
