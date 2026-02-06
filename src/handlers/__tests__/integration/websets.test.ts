import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HAS_API_KEY, createTestClient, testId } from './setup.js';
import * as websets from '../../websets.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('websets (integration)', () => {
  let exa: Exa;
  let createdId: string;

  beforeAll(() => {
    exa = createTestClient();
  });

  afterAll(async () => {
    if (createdId) {
      try { await exa.websets.delete(createdId); } catch {}
    }
  });

  it('websets.create — creates a webset with search', async () => {
    const result = await websets.create(
      {
        searchQuery: 'small AI startups in Austin Texas',
        searchCount: 1,
        externalId: testId(),
        metadata: { test: 'true' },
      },
      exa,
    );
    if (result.isError) console.error('CREATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
    createdId = data.id;
  });

  it('websets.get — retrieves the created webset', async () => {
    const result = await websets.get({ id: createdId }, exa);
    if (result.isError) console.error('GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(createdId);
  });

  it('websets.list — returns a paginated list', async () => {
    const result = await websets.list({ limit: 10 }, exa);
    if (result.isError) console.error('LIST ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('websets.update — updates metadata', async () => {
    const result = await websets.update(
      { id: createdId, metadata: { test: 'updated' } },
      exa,
    );
    if (result.isError) console.error('UPDATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('websets.preview — previews a query without executing', async () => {
    const result = await websets.preview(
      { query: 'AI startups in San Francisco', count: 5 },
      exa,
    );
    if (result.isError) console.error('PREVIEW ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('websets.cancel — cancels the webset', async () => {
    const result = await websets.cancel({ id: createdId }, exa);
    if (result.isError) console.error('CANCEL ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('websets.delete — deletes the webset', async () => {
    const result = await websets.del({ id: createdId }, exa);
    if (result.isError) console.error('DELETE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    createdId = '';
  });
});
