import { z } from "zod";
import axios from "axios";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_CONFIG } from "./config.js";
import { WebsetEnrichment, CreateEnrichmentParams } from "../types.js";
import { createRequestLogger } from "../utils/logger.js";

export function registerCreateEnrichmentTool(server: McpServer, config?: { exaApiKey?: string }): void {
  server.tool(
    "create_enrichment",
    `Create a new enrichment for a webset. Enrichments automatically extract custom data from each item using AI agents (e.g., 'company revenue', 'CEO name', 'funding amount').

IMPORTANT PARAMETER FORMATS:
- options (when format is "options"): MUST be array of objects like [{label: "..."}] (NOT array of strings)

Example call (text format):
{"websetId": "webset_123", "description": "CEO name", "format": "text"}

Example call (options format):
{"websetId": "webset_123", "description": "Company stage", "format": "options", "options": [{"label": "Seed"}, {"label": "Series A"}]}`,
    {
      websetId: z.string().describe("The ID or externalId of the webset"),
      description: z.string().describe("Detailed description of what data to extract (e.g., 'Annual revenue in USD', 'Number of full-time employees')"),
      format: z.enum(['text', 'date', 'number', 'options', 'email', 'phone', 'url']).optional().describe("Format of the enrichment response. API auto-selects if not specified."),
      options: z.array(z.object({
        label: z.string()
      })).optional().describe("When format is 'options', the different options for the enrichment agent to choose from (1-150 options). Each option is an object with a 'label' field. Example: [{label: 'Small (1-50)'}, {label: 'Medium (51-200)'}, {label: 'Large (201+)'}]"),
      metadata: z.record(z.string(), z.string()).optional().describe("Key-value pairs to associate with this enrichment")
    },
    async ({ websetId, description, format, options, metadata }) => {
      const requestId = `create_enrichment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logger = createRequestLogger(requestId, 'create_enrichment');
      
      logger.start(`Creating enrichment for webset: ${websetId}`);
      
      try {
        // Validate input parameters
        if (format === 'options' && (!options || options.length === 0)) {
          return {
            content: [{
              type: "text" as const,
              text: `When format is "options", you must provide the options parameter with at least one option.`
            }],
            isError: true,
          };
        }

        if (options && options.length > 150) {
          return {
            content: [{
              type: "text" as const,
              text: `Too many options: ${options.length}. Maximum is 150 options.`
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

        const params: CreateEnrichmentParams = {
          description,
          ...(format && { format }),
          ...(options && { options }),
          ...(metadata && { metadata })
        };
        
        logger.log("Sending create enrichment request to API");
        logger.log(`Parameters: ${JSON.stringify(params, null, 2)}`);
        
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
          const errorDetails = error.response?.data?.details || '';
          
          logger.log(`API error (${statusCode}): ${errorMessage}`);
          
          // Provide helpful error message with correct format examples
          let helpText = '';
          if (statusCode === 400) {
            helpText = '\n\nCommon issues:\n' +
              '- options must be array of objects: [{label: "option"}]\n' +
              '- format must be one of: text, date, number, options, email, phone, url\n' +
              '- When format is "options", you must provide the options parameter\n' +
              '- Maximum 150 options allowed\n\n' +
              'Example (text format):\n' +
              '{\n' +
              '  "websetId": "webset_123",\n' +
              '  "description": "CEO name",\n' +
              '  "format": "text"\n' +
              '}\n\n' +
              'Example (options format):\n' +
              '{\n' +
              '  "websetId": "webset_123",\n' +
              '  "description": "Company stage",\n' +
              '  "format": "options",\n' +
              '  "options": [{"label": "Seed"}, {"label": "Series A"}, {"label": "Series B"}]\n' +
              '}';
          }
          
          return {
            content: [{
              type: "text" as const,
              text: `Error creating enrichment (${statusCode}): ${errorMessage}${errorDetails ? '\nDetails: ' + errorDetails : ''}${helpText}`
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
