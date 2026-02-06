import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createServer, type ServerInstance } from '../../server.js';
import type { Server as HttpServer } from 'node:http';

export const API_KEY = process.env.EXA_API_KEY ?? '';
export const HAS_API_KEY = API_KEY.length > 0;

export interface E2EContext {
  client: Client;
  httpServer: HttpServer;
  baseUrl: string;
  serverInstance: ServerInstance;
}

/**
 * Start an isolated E2E server on a random port with a real MCP client connected.
 */
export async function startE2EServer(opts?: { apiKey?: string }): Promise<E2EContext> {
  const apiKey = opts?.apiKey ?? API_KEY;
  const serverInstance = createServer({ exaApiKey: apiKey, host: '127.0.0.1' });

  const httpServer = await new Promise<HttpServer>((resolve) => {
    const s = serverInstance.app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const addr = httpServer.address();
  if (!addr || typeof addr === 'string') throw new Error('Failed to get server address');
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  const client = new Client({ name: 'e2e-test', version: '1.0.0' });
  const clientTransport = new StreamableHTTPClientTransport(
    new URL(`${baseUrl}/message`)
  );
  await client.connect(clientTransport);

  return { client, httpServer, baseUrl, serverInstance };
}

/**
 * Cleanly shut down an E2E server and client.
 */
export async function stopE2EServer(ctx: E2EContext): Promise<void> {
  try {
    await ctx.client.close();
  } catch {
    // client may already be closed
  }
  await new Promise<void>((resolve, reject) => {
    ctx.httpServer.close((err) => (err ? reject(err) : resolve()));
  });
}
