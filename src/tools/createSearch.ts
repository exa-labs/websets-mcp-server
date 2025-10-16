import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetSearch, CreateSearchParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerCreateSearchTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_search",
    `Create a new search to find and add items to a webset. The search will discover entities matching your query and criteria.

IMPORTANT PARAMETER FORMATS:
- entity: MUST be an object like {type: "company"} (NOT a string)
- criteria: MUST be array of objects like [{description: "..."}] (NOT array of strings)

Example call:
{
  "websetId": "webset_123",
  "query": "AI startups in San Francisco",
  "entity": {"type": "company"},
  "criteria": [{"description": "Founded after 2020"}],
  "count": 10
}`,
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      query: z.string().describe("Natural language query describing what to search for (e.g., 'AI startups in San Francisco')"),
      count: z.number().optional().describe("Number of items to find (default: 10, min: 1)"),
      entity: z.object({
        type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']).describe("Type of entity to search for")
      }).optional().describe("Entity type to search for. Must be an object with a 'type' field. Example: {type: 'company'}"),
      criteria: z.array(z.object({
        description: z.string()
      })).optional().describe("Additional criteria for evaluating search results. Each criterion is an object with a 'description' field. Example: [{description: 'Company is profitable'}, {description: 'Has raised Series A or later'}]"),
      behavior: z.enum(['override', 'append']).optional().describe("'override' replaces existing items, 'append' adds to them (default: override)"),
      recall: z.boolean().optional().describe("Whether to compute recall metrics for the search"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this search")
    },
    async ({ websetId, query, count, entity, criteria, behavior, recall, metadata }) => {
      const requestId = `create_search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_search');
      
      logger.start(`Creating search for webset: ${websetId}`);
      
      try {
        // Validate input parameters before sending to API
        if (count !== undefined && count < 1) {
          return {
            content: [{
              type: "text" as const,
              text: `Invalid count: ${count}. Must be at least 1.`
            }],
            isError: true,
          };
        }

        const axiosInstance = axios.create({
          baseURL: API_CONFIG.BASE_URL,
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': config?.exaApiKey || process.env.EXA_API_KEY || ''
          },
          timeout: 30000
        });

        const params: CreateSearchParams = {
          query,
          ...(count && { count }),
          ...(entity && { entity }),
          ...(criteria && { criteria }),
          ...(behavior && { behavior }),
          ...(recall !== undefined && { recall }),
          ...(metadata && { metadata })
        };
        
        logger.log("Sending create search request to API");
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
        const response = await axiosInstance.post<WebsetSearch>(
          API_CONFIG.ENDPOINTS.WEBSET_SEARCHES(websetId),
          params
        );
        
        logger.log(`Created search: ${response.data.id}`);

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
          const errorDetails = error.response?.data?.details || '';
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          
          // Provide helpful error message with correct format examples
          let helpText = '';
          if (statusCode === 400) {
            helpText = '\n\nCommon issues:\n' +
              '- criteria must be array of objects: [{description: "criterion"}]\n' +
              '- entity must be object: {type: "company"}\n' +
              '- count must be a positive number\n' +
              '- behavior must be "override" or "append"\n\n' +
              'Example:\n' +
              '{\n' +
              '  "websetId": "webset_123",\n' +
              '  "query": "AI startups in San Francisco",\n' +
              '  "entity": {"type": "company"},\n' +
              '  "criteria": [{"description": "Founded after 2020"}],\n' +
              '  "count": 10\n' +
              '}';
          }
          
          return {
            content: [{
              type: "text" as const,
              text: `Error creating search (${statusCode}): ${errorMessage}${errorDetails ? '\nDetails: ' + errorDetails : ''}${helpText}`
            }],
            isError: true,
          };
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Error creating search: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true,
        };
      }
    }
  );
}

