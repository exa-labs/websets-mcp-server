process.env.AGNOST_LOG_LEVEL = 'error';

import { createMcpHandler } from 'mcp-handler';
import { initializeMcpServer } from '../src/mcp-handler.js';

/**
 * Vercel Function entry point for MCP server
 *
 * Users must provide their own API key via:
 * - Authorization: Bearer YOUR_KEY (recommended)
 * - ?exaApiKey=YOUR_KEY
 *
 * Other URL query parameters:
 * - ?tools=create_webset,list_websets - Enable specific tools
 * - ?debug=true - Enable debug logging
 *
 * A fresh handler is created per request to ensure each request gets its own
 * configuration (no API key leakage between users).
 */

function getApiKeyFromHeader(request: Request): string | undefined {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return undefined;
}

function getConfigFromRequest(request: Request) {
  let exaApiKey: string | undefined;
  let enabledTools: string[] | undefined;
  let debug = process.env.DEBUG === 'true';

  // 1. Check Authorization: Bearer header (highest priority)
  const headerApiKey = getApiKeyFromHeader(request);
  if (headerApiKey) {
    exaApiKey = headerApiKey;
  }

  try {
    const parsedUrl = new URL(request.url);
    const params = parsedUrl.searchParams;

    // 2. Check ?exaApiKey=YOUR_KEY (fallback, only if no header)
    if (!headerApiKey && params.has('exaApiKey')) {
      const keyFromUrl = params.get('exaApiKey');
      if (keyFromUrl) {
        exaApiKey = keyFromUrl;
      }
    }

    // Support ?tools=tool1,tool2
    if (params.has('tools')) {
      const toolsParam = params.get('tools');
      if (toolsParam) {
        enabledTools = toolsParam
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }
    }

    // Support ?debug=true
    if (params.has('debug')) {
      debug = params.get('debug') === 'true';
    }
  } catch (error) {
    if (debug) {
      console.error('Failed to parse request URL:', error);
    }
  }

  // Fall back to env vars for tools
  if (!enabledTools && process.env.ENABLED_TOOLS) {
    enabledTools = process.env.ENABLED_TOOLS
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  return { exaApiKey, enabledTools, debug };
}

function createHandler(config: { exaApiKey?: string; enabledTools?: string[]; debug: boolean }) {
  return createMcpHandler(
    (server: any) => {
      initializeMcpServer(server, config);
    },
    { serverInfo: { name: "websets-server", version: "1.0.1" } },
    { basePath: '/api' }
  );
}

async function handleRequest(request: Request): Promise<Response> {
  const config = getConfigFromRequest(request);

  if (config.debug) {
    console.log(`[WEBSETS-MCP] Request URL: ${request.url}`);
    console.log(`[WEBSETS-MCP] Enabled tools: ${config.enabledTools?.join(', ') || 'default'}`);
  }

  const handler = createHandler(config);

  // Normalize URL pathname to /api/mcp for mcp-handler
  const url = new URL(request.url);
  if (url.pathname === '/mcp' || url.pathname === '/') {
    url.pathname = '/api/mcp';
    request = new Request(url.toString(), request);
  }

  return handler(request);
}

export { handleRequest as GET, handleRequest as POST, handleRequest as DELETE };
