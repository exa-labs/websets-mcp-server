import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { CreateWebsetParams, Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { createAxiosClient, formatApiError } from "../utils/http.js";

export function registerCreateWebsetTool(server: McpServer, config?: { exaApiKey?: string; debug?: boolean }): void {
  server.tool(
    "create_webset",
    `Create a new Webset collection. Websets are collections of web entities (companies, people, papers) that can be automatically searched, verified, and enriched with custom data.

IMPORTANT PARAMETER FORMATS:
- searchCriteria: MUST be array of objects like [{description: "..."}] (NOT array of strings)
- enrichments: Each must have description field, optional format and options
- enrichment options: MUST be array of objects like [{label: "..."}] (NOT array of strings)

Example call:
{
  "name": "AI Startups",
  "searchQuery": "AI startups in San Francisco",
  "searchCriteria": [{"description": "Founded after 2020"}],
  "enrichments": [
    {"description": "CEO name", "format": "text"},
    {"description": "Company stage", "format": "options", "options": [{"label": "Seed"}, {"label": "Series A"}]}
  ]
}`,
    {
      name: z.string().optional().describe("Name for the webset"),
      description: z.string().optional().describe("Description of the webset"),
      externalId: z.string().max(300).optional().describe("Your own identifier for the webset (max 300 characters)"),
      searchQuery: z.string().optional().describe("Natural language query to populate the webset (e.g., 'AI startups in San Francisco')"),
      searchCount: z.number().int().min(1).optional().describe("Number of items to search for (default: 10, must be positive integer)"),
      searchCriteria: z.array(z.object({
        description: z.string()
      })).optional().describe("Additional criteria to filter search results. Each criterion is an object with a 'description' field. Example: [{description: 'Founded after 2020'}, {description: 'Has more than 50 employees'}]"),
      enrichments: z.array(z.object({
        description: z.string().describe("What data to extract (e.g., 'Annual revenue in USD', 'Number of full-time employees')"),
        format: z.enum(['text', 'date', 'number', 'options', 'email', 'phone', 'url']).optional().describe("Format of the enrichment response"),
        options: z.array(z.object({
          label: z.string()
        })).optional().describe("When format is 'options', the different options to choose from. Example: [{label: 'B2B'}, {label: 'B2C'}, {label: 'B2B2C'}]")
      })).optional().describe("Data enrichments to automatically extract for each item. Example: [{description: 'CEO name', format: 'text'}, {description: 'Company type', format: 'options', options: [{label: 'B2B'}, {label: 'B2C'}]}]")
    },
    async ({ name, description, externalId, searchQuery, searchCount, searchCriteria, enrichments }) => {
      const requestId = `create_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webset', config?.debug);
      
      logger.start(`Creating webset${name ? ` "${name}"` : ''}`);
      
      try {
        const axiosInstance = createAxiosClient(config);

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
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
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
        
        const errorMessage = formatApiError(error, 'create_webset', true);
        
        return {
          content: [{
            type: "text" as const,
            text: errorMessage + '\n\nExample:\n' +
              '{\n' +
              '  "name": "AI Startups",\n' +
              '  "searchQuery": "AI startups in San Francisco",\n' +
              '  "searchCriteria": [{"description": "Founded after 2020"}],\n' +
              '  "enrichments": [\n' +
              '    {"description": "CEO name", "format": "text"},\n' +
              '    {"description": "Company stage", "format": "options", "options": [{"label": "Seed"}, {"label": "Series A"}]}\n' +
              '  ]\n' +
              '}'
          }],
          isError: true,
        };
      }
    }
  );
}
