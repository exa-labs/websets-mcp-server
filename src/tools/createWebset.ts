import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { CreateWebsetParams, Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerCreateWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_webset",
    "Create a new Webset collection. Websets are collections of web entities (companies, people, papers) that can be automatically searched, verified, and enriched with custom data.",
    {
      name: z.string().optional().describe("Name for the webset"),
      description: z.string().optional().describe("Description of the webset"),
      externalId: z.string().optional().describe("Your own identifier for the webset"),
      searchQuery: z.string().optional().describe("Natural language query to populate the webset (e.g., 'AI startups in San Francisco')"),
      searchCount: z.number().optional().describe("Number of items to search for (default: 10)"),
      searchCriteria: z.array(z.string()).optional().describe("Additional criteria to filter search results"),
      enrichments: z.array(z.object({
        name: z.string().describe("Name of the enrichment column"),
        description: z.string().describe("What data to extract (e.g., 'company revenue', 'CEO name')")
      })).optional().describe("Data enrichments to automatically extract for each item")
    },
    async ({ name, description, externalId, searchQuery, searchCount, searchCriteria, enrichments }) => {
      const requestId = `create_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webset');
      
      logger.start(`Creating webset${name ? ` "${name}"` : ''}`);
      
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

        const params: CreateWebsetParams = {
          name,
          description,
          externalId
        };

        if (searchQuery) {
          params.search = {
            query: searchQuery,
            count: searchCount,
            criteria: searchCriteria
          };
        }

        if (enrichments && enrichments.length > 0) {
          params.enrichments = enrichments;
        }
        
        logger.log("Sending create webset request to API");
        
        const response = await axiosInstance.post<Webset>(
          API_CONFIG.ENDPOINTS.WEBSETS,
          params
        );
        
        logger.log(`Created webset: ${response.data.id}`);

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
              text: `Error creating webset (${statusCode}): ${errorMessage}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error creating webset: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}
