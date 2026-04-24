import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetSearch, CreateSearchParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerCreateSearchTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_search",
    `Create a new search to find and add items to a webset. The search will discover entities matching your query and criteria.

IMPORTANT PARAMETER FORMATS:
- entity: MUST be an object like {type: "company"} (NOT a string). For "custom" type, include description: {type: "custom", description: "SaaS tools"}
- criteria: MUST be array of objects like [{description: "..."}] (NOT array of strings)
- exclude: Array of sources like [{source: "webset", id: "webset_123"}]
- scope: Object for scoped/hop searches: {source: "import", id: "import_123", relationship: "investors of these companies"}

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
      count: z.coerce.number().int().min(1).optional().describe("Number of items to find (default: 10, min: 1)"),
      entity: z.object({
        type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']).describe("Type of entity to search for"),
        description: z.string().optional().describe("Required when type is 'custom'. Describes the entity type (2-200 chars).")
      }).optional().describe("Entity type to search for. Example: {type: 'company'} or {type: 'custom', description: 'SaaS tools'}"),
      criteria: z.array(z.object({
        description: z.string().max(1000)
      })).max(5).optional().describe("Additional criteria for evaluating search results (max 5). Each criterion is an object with a 'description' field (max 1000 chars). Example: [{description: 'Company is profitable'}, {description: 'Has raised Series A or later'}]"),
      behavior: z.enum(['override', 'append']).optional().describe("'override' replaces existing items, 'append' adds to them (default: override)"),
      exclude: z.array(z.object({
        source: z.enum(['import', 'webset']),
        id: z.string()
      })).optional().describe("Exclude results found in these imports or websets. Example: [{source: 'webset', id: 'webset_123'}]"),
      scope: z.object({
        source: z.enum(['import', 'webset']),
        id: z.string(),
        relationship: z.string().optional().describe("For hop searches — describes the relationship to traverse (e.g., 'investors of these companies')")
      }).optional().describe("Scope the search to items within an existing import or webset. Enables hop searches with relationship."),
      recall: z.boolean().optional().describe("Whether to compute recall metrics for the search"),
      maxPeoplePerCompany: z.number().int().min(1).optional().describe("Soft cap on how many people from the same employer to include in person searches"),
      metadata: z.record(z.coerce.string(), z.coerce.string()).optional().describe("Key-value pairs to associate with this search")
    },
    async ({ websetId, query, count, entity, criteria, behavior, exclude, scope, recall, maxPeoplePerCompany, metadata }) => {
      const requestId = `create_search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_search');
      
      logger.start(`Creating search for webset: ${websetId}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: CreateSearchParams = {
          query,
          ...(count && { count }),
          ...(entity && { entity }),
          ...(criteria && { criteria }),
          ...(behavior && { behavior }),
          ...(exclude && { exclude }),
          ...(scope && { scope }),
          ...(recall !== undefined && { recall }),
          ...(maxPeoplePerCompany && { maxPeoplePerCompany }),
          ...(metadata && { metadata })
        };
        
        checkpoint('create_search_request_prepared');
        logger.log("Sending create search request to API");
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
        const response = await client.post<WebsetSearch>(
          API_CONFIG.ENDPOINTS.WEBSET_SEARCHES(websetId),
          params
        );
        
        logger.log(`Created search: ${response.id}`);
        checkpoint('create_search_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2)
          }]
        };
        
        checkpoint('create_search_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'creating search', (statusCode) => {
          if (statusCode === 400) {
            return '\n\nCommon issues:\n' +
              '- criteria must be array of objects: [{description: "criterion"}]\n' +
              '- entity must be object: {type: "company"}\n' +
              '- entity type "custom" requires a description field: {type: "custom", description: "..."}\n' +
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
          return '';
        });
      }
    }
  );
}
