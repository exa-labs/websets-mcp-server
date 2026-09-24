process.env.AGNOST_LOG_LEVEL = process.env.AGNOST_LOG_LEVEL ?? "error";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeMcpServer, type McpConfig } from "./mcp-handler.js";

// Reads EXA_API_KEY, ENABLED_TOOLS / TOOLS, DEBUG from env.
// HTTP/Vercel entry point lives in api/mcp.ts; CLI bootstrap lives in src/stdio-cli.ts.

function parseTools(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const tools = value
    .split(",")
    .map(tool => tool.trim())
    .filter(tool => tool.length > 0);
  return tools.length > 0 ? tools : undefined;
}

export function buildConfigFromEnv(env: NodeJS.ProcessEnv = process.env): McpConfig {
  return {
    exaApiKey: env.EXA_API_KEY,
    enabledTools: parseTools(env.ENABLED_TOOLS ?? env.TOOLS),
    debug: env.DEBUG === "true",
  };
}

export async function main(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const config = buildConfigFromEnv(env);

  const server = new McpServer({
    name: "websets-server",
    title: "Exa Websets",
    version: "1.0.1"
  });

  initializeMcpServer(server, config);

  await server.connect(new StdioServerTransport());
}
