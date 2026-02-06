import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HAS_API_KEY, createTestClient, testId } from './setup.js';
import * as searches from '../../searches.js';
import * as websets from '../../websets.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('searches (integration)', () => {
  let exa: Exa;
  let websetId: string;
  let searchId: string;

  beforeAll(async () => {
    exa = createTestClient();
    // Create a webset with a search, then cancel it so we free up the concurrency slot
    const ws = await websets.create(
      {
        searchQuery: 'AI research labs in Boston',
        searchCount: 1,
        externalId: testId(),
      },
      exa,
    );
    const data = JSON.parse(ws.content[0].text);
    websetId = data.id;
    // Cancel the webset to stop the initial search, freeing up concurrency
    await websets.cancel({ id: websetId }, exa);
  });

  afterAll(async () => {
    if (websetId) {
      try { await exa.websets.delete(websetId); } catch {}
    }
  });

  it('searches.create — creates a search on the webset', async () => {
    const result = await searches.create(
      {
        websetId,
        query: 'machine learning startups in New York',
        count: 1,
        behavior: 'append',
      },
      exa,
    );
    if (result.isError) console.error('SEARCH CREATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
    searchId = data.id;
  });

  it('searches.get — retrieves the created search', async () => {
    const result = await searches.get({ websetId, searchId }, exa);
    if (result.isError) console.error('SEARCH GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(searchId);
  });

  it('searches.cancel — cancels the search', async () => {
    const result = await searches.cancel({ websetId, searchId }, exa);
    if (result.isError) console.error('SEARCH CANCEL ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });
});
