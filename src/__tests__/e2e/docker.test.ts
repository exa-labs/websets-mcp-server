import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { HAS_API_KEY } from './setup.js';

const SKIP_DOCKER = process.env.SKIP_DOCKER_TESTS === 'true';
const HAS_DOCKER = (() => {
  try {
    execSync('docker compose version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

const DOCKER_PORT = 17860; // non-standard port to avoid conflicts
const BASE_URL = `http://127.0.0.1:${DOCKER_PORT}`;

describe.skipIf(!HAS_DOCKER || SKIP_DOCKER || !HAS_API_KEY)('Docker E2E', () => {
  beforeAll(async () => {
    // Build and start container on a non-conflicting port
    execSync(
      `PORT=${DOCKER_PORT} docker compose up --build -d --wait`,
      { stdio: 'pipe', timeout: 120_000 }
    );

    // Wait for health endpoint
    const maxRetries = 20;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(`${BASE_URL}/health`);
        if (res.ok) return;
      } catch {
        // not ready yet
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error('Docker container health check timed out');
  }, 180_000);

  afterAll(() => {
    try {
      execSync('docker compose down', { stdio: 'pipe', timeout: 30_000 });
    } catch {
      // best effort cleanup
    }
  });

  it('health endpoint responds', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('MCP client can connect and list tools', async () => {
    const client = new Client({ name: 'docker-e2e', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(
      new URL(`${BASE_URL}/message`)
    );
    try {
      await client.connect(transport);
      const result = await client.listTools();
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('manage_websets');
    } finally {
      await client.close();
    }
  });
});
