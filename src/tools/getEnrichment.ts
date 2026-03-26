import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetEnrichment } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerGetEnrichmentTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "get_enrichment",
    "Get details about a specific enrichment, including its status and progress.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      enrichmentId: z.string().describe("The ID of the enrichment to retrieve")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `get_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_enrichment');
      
      logger.start(`Getting enrichment ${enrichmentId} from webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('get_enrichment_request_prepared');
        logger.log("Sending get enrichment request to API");
        
        const response = await client.get<WebsetEnrichment>(
          API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID(websetId, enrichmentId)
        );
        
        logger.log(`Retrieved enrichment: ${response.id} (status: ${response.status})`);
        checkpoint('get_enrichment_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('get_enrichment_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'getting enrichment');
      }
    }
  );
}
