import crypto from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Exa } from "exa-js";
import { registerManageWebsetsTool } from "./tools/manageWebsets.js";
import type { Express, Request, Response } from "express";

export interface ServerConfig {
  exaApiKey: string;
  host?: string;
}

export interface ServerInstance {
  app: Express;
  sessions: Map<string, SessionEntry>;
}

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
}

export function createServer(config: ServerConfig): ServerInstance {
  const app = createMcpExpressApp({
    host: config.host ?? '0.0.0.0'
  });

  // Health endpoint for Docker healthchecks and k8s probes
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  const exa = new Exa(config.exaApiKey);
  const sessions = new Map<string, SessionEntry>();

  app.all("/message", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      // Existing session — route to its transport
      if (sessionId && sessions.has(sessionId)) {
        const entry = sessions.get(sessionId)!;
        await entry.transport.handleRequest(req, res, req.body);

        if (req.method === "DELETE") {
          sessions.delete(sessionId);
          entry.transport.close();
        }
        return;
      }

      // New session — create server + transport pair
      const newSessionId = sessionId || crypto.randomUUID();

      const server = new McpServer({
        name: "websets-server",
        version: "2.0.0"
      });

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        enableJsonResponse: true,
      });

      registerManageWebsetsTool(server, exa);

      transport.onclose = () => {
        sessions.delete(transport.sessionId || newSessionId);
      };

      await server.connect(transport);
      sessions.set(newSessionId, { transport, server });

      await transport.handleRequest(req, res, req.body);

      if (req.method === "DELETE") {
        sessions.delete(newSessionId);
        transport.close();
      }
    } catch (error) {
      console.error("MCP ERROR:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  return { app, sessions };
}
