/**
 * Well-known endpoint for MCP configuration schema
 *
 * Exposes a JSON Schema at /.well-known/mcp-config for MCP clients
 * to discover available configuration options.
 */

const AVAILABLE_TOOLS = [
  'create_webset',
  'list_websets',
  'get_webset',
  'update_webset',
  'delete_webset',
  'list_webset_items',
  'get_item',
  'create_search',
  'get_search',
  'cancel_search',
  'create_enrichment',
  'get_enrichment',
  'cancel_enrichment',
  'create_monitor',
];

const configSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "/.well-known/mcp-config",
  "title": "Exa Websets MCP Server Configuration",
  "description": "Configuration for connecting to the Exa Websets MCP server",
  "x-query-style": "dot+bracket",
  "type": "object",
  "properties": {
    "exaApiKey": {
      "type": "string",
      "title": "Exa API Key",
      "description": "Your Exa AI API key for websets operations. Get one at https://dashboard.exa.ai/api-keys"
    },
    "tools": {
      "type": "string",
      "title": "Enabled Tools",
      "description": "Comma-separated list of tools to enable. Leave empty to enable all tools.",
      "examples": [
        "create_webset,list_websets,get_webset",
        "create_webset,create_search,create_enrichment"
      ],
      "x-available-values": AVAILABLE_TOOLS
    },
    "debug": {
      "type": "boolean",
      "title": "Debug Mode",
      "description": "Enable debug logging for troubleshooting",
      "default": false
    }
  },
  "additionalProperties": false
};

export function GET(): Response {
  return new Response(JSON.stringify(configSchema, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
