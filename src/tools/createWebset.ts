import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { CreateWebsetParams, Webset } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";
import { ExaApiClient, handleApiError } from "../utils/api.js";
import { checkpoint } from "agnost";

export function registerCreateWebsetTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_webset",
    `Create a new Webset collection. Websets are collections of web entities (companies, people, papers) that can be automatically searched, verified, and enriched with custom data.

IMPORTANT PARAMETER FORMATS:
- searchCriteria: MUST be array of objects like [{description: "..."}] (NOT array of strings)
- enrichments: Each must have description field, optional format and options
- enrichment options: MUST be array of objects like [{label: "..."}] (NOT array of strings)
- entity: MUST be an object like {type: "company"} — for "custom" type, include description: {type: "custom", description: "..."}
- exclude: Array of sources like [{source: "webset", id: "webset_123"}]

Example call:
{
  "searchQuery": "AI startups in San Francisco",
  "searchEntity": {"type": "company"},
  "searchCriteria": [{"description": "Founded after 2020"}],
  "enrichments": [
    {"description": "CEO name", "format": "text"},
    {"description": "Company stage", "format": "options", "options": [{"label": "Seed"}, {"label": "Series A"}]}
  ]
}

AFTER CREATING: The response includes the webset ID. The webset will take time to populate. Wait at least 10 seconds before polling with get_webset. If status is not "idle", wait another 10 seconds before checking again.`,
    {
      externalId: z.string().max(300).optional().describe("Your own identifier for the webset (max 300 chars)"),
      searchQuery: z.string().optional().describe("Natural language query to populate the webset (e.g., 'AI startups in San Francisco')"),
      searchCount: z.number().int().min(1).optional().describe("Number of items to search for (default: 10, min: 1)"),
      searchEntity: z.object({
        type: z.enum(['company', 'person', 'article', 'research_paper', 'custom']).describe("Type of entity to search for"),
        description: z.string().optional().describe("Required when type is 'custom'. Describes the entity type (2-200 chars).")
      }).optional().describe("Entity type for the search. Example: {type: 'company'} or {type: 'custom', description: 'SaaS tools'}"),
      searchCriteria: z.array(z.object({
        description: z.string()
      })).optional().describe("Additional criteria to filter search results. Each criterion is an object with a 'description' field. Example: [{description: 'Founded after 2020'}, {description: 'Has more than 50 employees'}]"),
      searchBehavior: z.enum(['override', 'append']).optional().describe("'override' replaces existing items, 'append' adds to them (default: override)"),
      searchExclude: z.array(z.object({
        source: z.enum(['import', 'webset']),
        id: z.string()
      })).optional().describe("Exclude results found in these imports or websets. Example: [{source: 'webset', id: 'webset_123'}]"),
      searchScope: z.object({
        source: z.enum(['import', 'webset']),
        id: z.string(),
        relationship: z.string().optional().describe("For hop searches — describes the relationship to traverse (e.g., 'investors of these companies')")
      }).optional().describe("Scope the search to items within an existing import or webset. Enables hop searches with relationship."),
      searchRecall: z.boolean().optional().describe("Whether to compute recall metrics for the search"),
      enrichments: z.array(z.object({
        description: z.string().describe("What data to extract (e.g., 'Annual revenue in USD', 'Number of full-time employees')"),
        format: z.enum(['text', 'date', 'number', 'options', 'email', 'phone', 'url']).optional().describe("Format of the enrichment response"),
        options: z.array(z.object({
          label: z.string()
        })).optional().describe("When format is 'options', the different options to choose from. Example: [{label: 'B2B'}, {label: 'B2C'}, {label: 'B2B2C'}]")
      })).optional().describe("Data enrichments to automatically extract for each item. Example: [{description: 'CEO name', format: 'text'}, {description: 'Company type', format: 'options', options: [{label: 'B2B'}, {label: 'B2C'}]}]"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this webset"),
      excludes: z.array(z.object({
        source: z.enum(['import', 'webset']),
        id: z.string()
      })).optional().describe("Global exclude sources — results found in these imports or websets will be omitted across all operations in this webset")
    },
    async ({ externalId, searchQuery, searchCount, searchEntity, searchCriteria, searchBehavior, searchExclude, searchScope, searchRecall, enrichments, metadata, excludes }) => {
      const requestId = `create_webset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_webset');
      
      logger.start(`Creating webset${searchQuery ? ` for "${searchQuery}"` : ''}`);
      
      try {
        const client = new ExaApiClient(config?.exaApiKey || process.env.EXA_API_KEY || '');

        const params: CreateWebsetParams = {
          ...(externalId && { externalId }),
          ...(metadata && { metadata }),
          ...(excludes && { excludes })
        };

        if (searchQuery) {
          params.search = {
            query: searchQuery,
            ...(searchCount && { count: searchCount }),
            ...(searchEntity && { entity: searchEntity }),
            ...(searchCriteria && { criteria: searchCriteria }),
            ...(searchBehavior && { behavior: searchBehavior }),
            ...(searchExclude && { exclude: searchExclude }),
            ...(searchScope && { scope: searchScope }),
            ...(searchRecall !== undefined && { recall: searchRecall })
          };
        }

        if (enrichments && enrichments.length > 0) {
          params.enrichments = enrichments;
        }
        
        checkpoint('create_webset_request_prepared');
        logger.log("Sending create webset request to API");
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
        const response = await client.post<Webset>(
          API_CONFIG.ENDPOINTS.WEBSETS,
          params
        );
        
        logger.log(`Created webset: ${response.id}`);
        checkpoint('create_webset_response_received');

        const result = {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2) + '\n\n---\nWebset created successfully. It will take some time to populate. Wait at least 10 seconds before checking status with get_webset. If status is not "idle", wait another 10 seconds before polling again.'
          }]
        };
        
        checkpoint('create_webset_complete');
        logger.complete();
        return result;
      } catch (error) {
        return handleApiError(error, logger, 'creating webset', (statusCode) => {
          if (statusCode === 400) {
            return '\n\nCommon issues:\n' +
              '- searchCriteria must be array of objects: [{description: "criterion"}]\n' +
              '- enrichments must be array of objects with description field\n' +
              '- enrichment options must be array of objects: [{label: "option"}]\n' +
              '- searchCount must be a positive number\n' +
              '- entity type "custom" requires a description field\n\n' +
              'Example:\n' +
              '{\n' +
              '  "searchQuery": "AI startups in San Francisco",\n' +
              '  "searchEntity": {"type": "company"},\n' +
              '  "searchCriteria": [{"description": "Founded after 2020"}],\n' +
              '  "enrichments": [\n' +
              '    {"description": "CEO name", "format": "text"},\n' +
              '    {"description": "Company stage", "format": "options", "options": [{"label": "Seed"}, {"label": "Series A"}]}\n' +
              '  ]\n' +
              '}';
          }
          return '';
        });
      }
    }
  );
}
