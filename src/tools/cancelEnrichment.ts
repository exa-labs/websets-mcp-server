import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetEnrichment } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerCancelEnrichmentTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "cancel_enrichment",
    "Cancel a running enrichment operation. This will stop the enrichment from processing more items.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      enrichmentId: z.string().describe("The ID of the enrichment to cancel")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `cancel_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'cancel_enrichment', config?.debug);
      
      logger.start(`Canceling enrichment ${enrichmentId} from webset: ${websetId}`);
      
      try {
        const axiosInstance = createAxiosClient(config);
        
        logger.log("Sending cancel enrichment request to API");
        
        const response = await axiosInstance.post<WebsetEnrichment>(
          `${API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID(websetId, enrichmentId)}/cancel`
        );
        
        logger.log(`Canceled enrichment: ${response.data.id}`);

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
        
        return {
          content: [{
            type: "text" as const,
            text: formatApiError(error, 'cancel_enrichment')
          }],
          isError: true,
        };
      }
    }
  );
}

