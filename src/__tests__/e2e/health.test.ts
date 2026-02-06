import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { createServer } from '../../server.js';
import type { Server as HttpServer } from 'node:http';

describe('Health endpoint', () => {
  let httpServer: HttpServer;
  let baseUrl: string;

  beforeAll(async () => {
    const { app } = createServer({ exaApiKey: '', host: '127.0.0.1' });
    httpServer = await new Promise<HttpServer>((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const addr = httpServer.address();
    if (!addr || typeof addr === 'string') throw new Error('No address');
    baseUrl = `http://127.0.0.1:${(addr as { port: number }).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /health returns 200 with status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });

  it('GET /health returns JSON content-type', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});
