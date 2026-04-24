import { trackMCP, createConfig } from 'agnost';

// Import tool implementations
import { registerCreateWebsetTool } from "./tools/createWebset.js";
import { registerListWebsetsTool } from "./tools/listWebsets.js";
import { registerGetWebsetTool } from "./tools/getWebset.js";
import { registerUpdateWebsetTool } from "./tools/updateWebset.js";
import { registerDeleteWebsetTool } from "./tools/deleteWebset.js";
import { registerListItemsTool } from "./tools/listItems.js";
import { registerGetItemTool } from "./tools/getItem.js";
import { registerCreateSearchTool } from "./tools/createSearch.js";
import { registerGetSearchTool } from "./tools/getSearch.js";
import { registerCancelSearchTool } from "./tools/cancelSearch.js";
import { registerCreateEnrichmentTool } from "./tools/createEnrichment.js";
import { registerGetEnrichmentTool } from "./tools/getEnrichment.js";
import { registerCancelEnrichmentTool } from "./tools/cancelEnrichment.js";
import { registerCreateMonitorTool } from "./tools/createMonitor.js";
import { registerGetMonitorTool } from "./tools/getMonitor.js";
import { registerUpdateMonitorTool } from "./tools/updateMonitor.js";
import { registerDeleteMonitorTool } from "./tools/deleteMonitor.js";
import { registerListMonitorsTool } from "./tools/listMonitors.js";
import { registerPreviewWebsetTool } from "./tools/previewWebset.js";
import { registerCreateWebhookTool } from "./tools/createWebhook.js";
import { registerGetWebhookTool } from "./tools/getWebhook.js";
import { registerUpdateWebhookTool } from "./tools/updateWebhook.js";
import { registerDeleteWebhookTool } from "./tools/deleteWebhook.js";
import { registerListWebhooksTool } from "./tools/listWebhooks.js";
import { registerCreateImportTool } from "./tools/createImport.js";
import { registerGetImportTool } from "./tools/getImport.js";
import { registerListImportsTool } from "./tools/listImports.js";
import { registerListEventsTool } from "./tools/listEvents.js";
import { log, setDebugEnabled } from "./utils/logger.js";

// Tool registry for managing available tools
const availableTools = {
  'create_webset': { name: 'Create Webset', description: 'Create a new webset collection', enabled: true },
  'list_websets': { name: 'List Websets', description: 'List all websets', enabled: true },
  'get_webset': { name: 'Get Webset', description: 'Get details about a specific webset', enabled: true },
  'update_webset': { name: 'Update Webset', description: 'Update webset metadata', enabled: true },
  'delete_webset': { name: 'Delete Webset', description: 'Delete a webset', enabled: true },
  'list_webset_items': { name: 'List Items', description: 'List items in a webset', enabled: true },
  'get_item': { name: 'Get Item', description: 'Get a specific item from a webset', enabled: true },
  'create_search': { name: 'Create Search', description: 'Create a new search for a webset', enabled: true },
  'get_search': { name: 'Get Search', description: 'Get search details and status', enabled: true },
  'cancel_search': { name: 'Cancel Search', description: 'Cancel a running search', enabled: true },
  'create_enrichment': { name: 'Create Enrichment', description: 'Add data enrichment to webset', enabled: true },
  'get_enrichment': { name: 'Get Enrichment', description: 'Get enrichment details and status', enabled: true },
  'cancel_enrichment': { name: 'Cancel Enrichment', description: 'Cancel a running enrichment', enabled: true },
  'create_monitor': { name: 'Create Monitor', description: 'Create automated webset monitor', enabled: true },
  'get_monitor': { name: 'Get Monitor', description: 'Get monitor details', enabled: true },
  'update_monitor': { name: 'Update Monitor', description: 'Update a monitor', enabled: true },
  'delete_monitor': { name: 'Delete Monitor', description: 'Delete a monitor', enabled: true },
  'list_monitors': { name: 'List Monitors', description: 'List all monitors', enabled: true },
  'preview_webset': { name: 'Preview Webset', description: 'Preview how a search query will be interpreted', enabled: true },
  'create_webhook': { name: 'Create Webhook', description: 'Create a webhook for webset events', enabled: true },
  'get_webhook': { name: 'Get Webhook', description: 'Get webhook details', enabled: true },
  'update_webhook': { name: 'Update Webhook', description: 'Update a webhook', enabled: true },
  'delete_webhook': { name: 'Delete Webhook', description: 'Delete a webhook', enabled: true },
  'list_webhooks': { name: 'List Webhooks', description: 'List all webhooks', enabled: true },
  'create_import': { name: 'Create Import', description: 'Create an import to upload your own data', enabled: true },
  'get_import': { name: 'Get Import', description: 'Get import details and status', enabled: true },
  'list_imports': { name: 'List Imports', description: 'List all imports', enabled: true },
  'list_events': { name: 'List Events', description: 'List system events', enabled: true },
};

export interface McpConfig {
  exaApiKey?: string;
  enabledTools?: string[];
  debug?: boolean;
}

/**
 * Initialize and configure the MCP server with all websets tools.
 * Called by both the Vercel Function entry point (api/mcp.ts) and the
 * Smithery CLI entry point (src/index.ts).
 */
export function initializeMcpServer(server: any, config: McpConfig = {}) {
  try {
    if (config.debug) {
      setDebugEnabled(true);
      log("Initializing Websets MCP Server in debug mode");
      if (config.enabledTools) {
        log(`Enabled tools from config: ${config.enabledTools.join(', ')}`);
      }
    } else {
      setDebugEnabled(false);
    }

    const shouldRegisterTool = (toolId: string): boolean => {
      if (config.enabledTools && config.enabledTools.length > 0) {
        return config.enabledTools.includes(toolId);
      }
      return availableTools[toolId as keyof typeof availableTools]?.enabled ?? false;
    };

    const registeredTools: string[] = [];

    if (shouldRegisterTool('create_webset')) {
      registerCreateWebsetTool(server, config);
      registeredTools.push('create_webset');
    }

    if (shouldRegisterTool('list_websets')) {
      registerListWebsetsTool(server, config);
      registeredTools.push('list_websets');
    }

    if (shouldRegisterTool('get_webset')) {
      registerGetWebsetTool(server, config);
      registeredTools.push('get_webset');
    }

    if (shouldRegisterTool('update_webset')) {
      registerUpdateWebsetTool(server, config);
      registeredTools.push('update_webset');
    }

    if (shouldRegisterTool('delete_webset')) {
      registerDeleteWebsetTool(server, config);
      registeredTools.push('delete_webset');
    }

    if (shouldRegisterTool('list_webset_items')) {
      registerListItemsTool(server, config);
      registeredTools.push('list_webset_items');
    }

    if (shouldRegisterTool('get_item')) {
      registerGetItemTool(server, config);
      registeredTools.push('get_item');
    }

    if (shouldRegisterTool('create_search')) {
      registerCreateSearchTool(server, config);
      registeredTools.push('create_search');
    }

    if (shouldRegisterTool('get_search')) {
      registerGetSearchTool(server, config);
      registeredTools.push('get_search');
    }

    if (shouldRegisterTool('cancel_search')) {
      registerCancelSearchTool(server, config);
      registeredTools.push('cancel_search');
    }

    if (shouldRegisterTool('create_enrichment')) {
      registerCreateEnrichmentTool(server, config);
      registeredTools.push('create_enrichment');
    }

    if (shouldRegisterTool('get_enrichment')) {
      registerGetEnrichmentTool(server, config);
      registeredTools.push('get_enrichment');
    }

    if (shouldRegisterTool('cancel_enrichment')) {
      registerCancelEnrichmentTool(server, config);
      registeredTools.push('cancel_enrichment');
    }

    if (shouldRegisterTool('create_monitor')) {
      registerCreateMonitorTool(server, config);
      registeredTools.push('create_monitor');
    }

    if (shouldRegisterTool('get_monitor')) {
      registerGetMonitorTool(server, config);
      registeredTools.push('get_monitor');
    }

    if (shouldRegisterTool('update_monitor')) {
      registerUpdateMonitorTool(server, config);
      registeredTools.push('update_monitor');
    }

    if (shouldRegisterTool('delete_monitor')) {
      registerDeleteMonitorTool(server, config);
      registeredTools.push('delete_monitor');
    }

    if (shouldRegisterTool('list_monitors')) {
      registerListMonitorsTool(server, config);
      registeredTools.push('list_monitors');
    }

    if (shouldRegisterTool('preview_webset')) {
      registerPreviewWebsetTool(server, config);
      registeredTools.push('preview_webset');
    }

    if (shouldRegisterTool('create_webhook')) {
      registerCreateWebhookTool(server, config);
      registeredTools.push('create_webhook');
    }

    if (shouldRegisterTool('get_webhook')) {
      registerGetWebhookTool(server, config);
      registeredTools.push('get_webhook');
    }

    if (shouldRegisterTool('update_webhook')) {
      registerUpdateWebhookTool(server, config);
      registeredTools.push('update_webhook');
    }

    if (shouldRegisterTool('delete_webhook')) {
      registerDeleteWebhookTool(server, config);
      registeredTools.push('delete_webhook');
    }

    if (shouldRegisterTool('list_webhooks')) {
      registerListWebhooksTool(server, config);
      registeredTools.push('list_webhooks');
    }

    if (shouldRegisterTool('create_import')) {
      registerCreateImportTool(server, config);
      registeredTools.push('create_import');
    }

    if (shouldRegisterTool('get_import')) {
      registerGetImportTool(server, config);
      registeredTools.push('get_import');
    }

    if (shouldRegisterTool('list_imports')) {
      registerListImportsTool(server, config);
      registeredTools.push('list_imports');
    }

    if (shouldRegisterTool('list_events')) {
      registerListEventsTool(server, config);
      registeredTools.push('list_events');
    }

    if (config.debug) {
      log(`Registered ${registeredTools.length} tools: ${registeredTools.join(', ')}`);
    }

    // Register resource to expose available tools list
    server.resource(
      "tools_list",
      "websets://tools/list",
      {
        mimeType: "application/json",
        description: "List of available Websets tools and their descriptions"
      },
      async () => {
        const toolsList = Object.entries(availableTools).map(([id, tool]) => ({
          id,
          name: tool.name,
          description: tool.description,
          enabled: registeredTools.includes(id)
        }));

        return {
          contents: [{
            uri: "websets://tools/list",
            text: JSON.stringify(toolsList, null, 2),
            mimeType: "application/json"
          }]
        };
      }
    );

    // Add Agnost analytics tracking
    const agnostOrgId = process.env.AGNOST_ORG_ID;
    if (agnostOrgId) {
      const underlyingServer = (server as any).server || server;

      try {
        trackMCP(underlyingServer, agnostOrgId, createConfig({
          endpoint: "https://api.agnost.ai",
          disableLogs: true,
          disableInput: true,
          disableOutput: true
        }));

        if (config.debug) {
          log("Agnost analytics tracking enabled");
        }
      } catch (analyticsError) {
        // Log but don't fail if analytics setup fails
        if (config.debug) {
          log(`Analytics tracking setup failed (non-critical): ${analyticsError}`);
        }
      }
    } else if (config.debug) {
      log("AGNOST_ORG_ID not set, analytics tracking disabled");
    }

    if (config.debug) {
      log("MCP server initialization complete");
    }

  } catch (error) {
    log(`Server initialization error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
