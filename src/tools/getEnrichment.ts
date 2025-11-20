import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetEnrichment } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerGetEnrichmentTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "get_enrichment",
    "Get details about a specific enrichment, including its status and progress.",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      enrichmentId: z.string().describe("The ID of the enrichment to retrieve")
    },
    async ({ websetId, enrichmentId }) => {
      const requestId = `get_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'get_enrichment', config?.debug);
      
      logger.start(`Getting enrichment ${enrichmentId} from webset: ${websetId}`);
      
      try {
        const axiosInstance = createAxiosClient(config);
        
        logger.log("Sending get enrichment request to API");
        
        const response = await axiosInstance.get<WebsetEnrichment>(
          API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENT_BY_ID(websetId, enrichmentId)
        );
        
        logger.log(`Retrieved enrichment: ${response.data.id} (status: ${response.data.status})`);

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
            text: formatApiError(error, 'get_enrichment')
          }],
          isError: true,
        };
      }
    }
  );
}

