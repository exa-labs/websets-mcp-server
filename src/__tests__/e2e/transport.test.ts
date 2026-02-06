import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { startE2EServer, stopE2EServer, HAS_API_KEY, type E2EContext } from './setup.js';

describe.skipIf(!HAS_API_KEY)('MCP Transport E2E', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await startE2EServer();
  });

  afterAll(async () => {
    if (ctx) await stopE2EServer(ctx);
  });

  it('ping succeeds', async () => {
    // ping() returns an empty result object on success, throws on failure
    await expect(ctx.client.ping()).resolves.toBeDefined();
  });

  it('tools/list returns manage_websets', async () => {
    const result = await ctx.client.listTools();
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('manage_websets');
    expect(result.tools[0].description).toContain('Manage Exa Websets');
  });

  it('tool call: websets.list returns data', async () => {
    const result = await ctx.client.callTool({
      name: 'manage_websets',
      arguments: { operation: 'websets.list', args: { limit: 1 } },
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
  });

  it('tool call: unknown operation returns error', async () => {
    const result = await ctx.client.callTool({
      name: 'manage_websets',
      arguments: { operation: 'nonexistent.op', args: {} },
    });
    // The dispatcher validates operation via zod enum, so the SDK may throw
    // or return an error result depending on how the server handles it
    expect(result.isError).toBeTruthy();
  });

  it('tool call: websets.preview returns results', async () => {
    const result = await ctx.client.callTool({
      name: 'manage_websets',
      arguments: {
        operation: 'websets.preview',
        args: { query: 'AI research labs', count: 2 },
      },
    });
    expect(result.isError).toBeFalsy();
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content.length).toBeGreaterThan(0);
    expect(content[0].type).toBe('text');
  });

  it('full lifecycle: create → get → cancel → delete', async () => {
    let websetId: string | undefined;
    try {
      // Create
      const createResult = await ctx.client.callTool({
        name: 'manage_websets',
        arguments: {
          operation: 'websets.create',
          args: {
            searchQuery: 'E2E test companies',
            searchCount: 5,
            entity: { type: 'company' },
          },
        },
      });
      expect(createResult.isError).toBeFalsy();
      const createContent = createResult.content as Array<{ type: string; text: string }>;
      const createData = JSON.parse(createContent[0].text);
      websetId = createData.id;
      expect(websetId).toBeDefined();

      // Get
      const getResult = await ctx.client.callTool({
        name: 'manage_websets',
        arguments: {
          operation: 'websets.get',
          args: { id: websetId },
        },
      });
      expect(getResult.isError).toBeFalsy();
      const getContent = getResult.content as Array<{ type: string; text: string }>;
      const getData = JSON.parse(getContent[0].text);
      expect(getData.id).toBe(websetId);

      // Cancel
      const cancelResult = await ctx.client.callTool({
        name: 'manage_websets',
        arguments: {
          operation: 'websets.cancel',
          args: { id: websetId },
        },
      });
      expect(cancelResult.isError).toBeFalsy();
    } finally {
      // Delete (cleanup)
      if (websetId) {
        await ctx.client.callTool({
          name: 'manage_websets',
          arguments: {
            operation: 'websets.delete',
            args: { id: websetId },
          },
        });
      }
    }
  });
});
