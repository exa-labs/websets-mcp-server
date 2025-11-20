import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerDeleteEnrichmentTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "delete_enrichment",
    "Delete an enrichment from a webset. This will remove all enriched data for this enrichment from all items.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      enrichmentId: z.string().describe("The ID of the enrichment to delete")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `delete_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'delete_enrichment', config?.debug);
      
      logger.start(`Deleting enrichment ${enrichmentId} from webset: ${websetId}`);
      
      try {
        const axiosInstance = createAxiosClient(config);
        
        logger.log("Sending delete enrichment request to API");
        
        await axiosInstance.delete(
          API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID(websetId, enrichmentId)
        );
        
        logger.log(`Deleted enrichment: ${enrichmentId}`);

        const result = {
          content: [{
            type: "text" as const,
            text: `Successfully deleted enrichment ${enrichmentId} from webset ${websetId}`
          }]
        };
        
        logger.complete();
        return result;
      } catch (error) {
        logger.error(error);
        
        return {
          content: [{
            type: "text" as const,
            text: formatApiError(error, 'delete_enrichment')
          }],
          isError: true,
        };
      }
    }
  );
}

