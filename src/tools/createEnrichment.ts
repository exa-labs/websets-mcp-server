import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetEnrichment, CreateEnrichmentParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerCreateEnrichmentTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_enrichment",
    "Create a new enrichment for a webset. Enrichments automatically extract custom data from each item using AI agents (e.g., 'company revenue', 'CEO name', 'funding amount').",
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      name: z.string().describe("Name of the enrichment column (e.g., 'Revenue', 'Employee Count')"),
      description: z.string().describe("Detailed description of what data to extract (e.g., 'Annual revenue in USD', 'Number of full-time employees')")
    },
    async ({ websetId, name, description }) => {
      const requestId = `create_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_enrichment');
      
      logger.start(`Creating enrichment "${name}" for webset: ${websetId}`);
      
      try {
        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: 30000
        });

        const params: CreateEnrichmentParams = {
          name,
          description
        };
        
        logger.log("Sending create enrichment request to API");
        
        const response = await axiosInstance.post<WebsetEnrichment>(
          API_CONFIG.ENDPOINTS.WEBSET_ENRICHMENTS(websetId),
          params
        );
        
        logger.log(`Created enrichment: ${response.data.id}`);

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
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status || 'unknown';
          const errorMessage = error.response?.data?.message || error.message;
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          return {
            content: [{
              type: "text" as const,
              text: `Error creating enrichment (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error creating enrichment: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
