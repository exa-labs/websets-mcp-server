import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetEnrichment } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerCancelEnrichmentTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "cancel_enrichment",
    "Cancel a running enrichment operation. Only enrichments with status 'running' can be canceled; enrichments still in 'pending' status are unaffected.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      enrichmentId: z.string().describe("The ID of the enrichment to cancel")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `cancel_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_enrichment');
      
      logger.start(`Canceling enrichment ${enrichmentId} from webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');
        
        checkpoint('cancel_enrichment_request_prepared');
        logger.log("Sending cancel enrichment request to API");
        
        const response = await client.post<WebsetEnrichment>(
          `${API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID(websetId, enrichmentId)}/cancel`
        );
        
        logger.log(`Canceled enrichment: ${response.id}`);
        checkpoint('cancel_enrichment_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('cancel_enrichment_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'canceling enrichment');
      }
    }
  );
}
