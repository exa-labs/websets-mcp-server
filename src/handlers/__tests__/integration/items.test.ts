import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HAS_API_KEY, createTestClient, testId } from './setup.js';
import * as items from '../../items.js';
import * as websets from '../../websets.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('items (integration)', () => {
  let exa: Exa;
  let websetId: string;

  beforeAll(async () => {
    exa = createTestClient();
    // Create a webset with a search — items will be populated as search runs
    const ws = await websets.create(
      {
        searchQuery: 'notable AI companies',
        searchCount: 3,
        externalId: testId(),
      },
      exa,
    );
    const data = JSON.parse(ws.content[0].text);
    websetId = data.id;
    // Wait a bit for items to populate
    await new Promise((r) => setTimeout(r, 5000));
  });

  afterAll(async () => {
    if (websetId) {
      try { await exa.websets.delete(websetId); } catch {}
    }
  });

  it('items.list — returns a paginated list (may be empty if search is still running)', async () => {
    const result = await items.list({ websetId, limit: 10 }, exa);
    if (result.isError) console.error('ITEMS LIST ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('items.get — retrieves a specific item (if available)', async () => {
    // First get the items list to find an ID
    const listResult = await items.list({ websetId, limit: 1 }, exa);
    const listData = JSON.parse(listResult.content[0].text);

    if (listData.data.length === 0) {
      // Search hasn't produced items yet — skip gracefully
      console.log('No items yet (search still running), skipping items.get');
      return;
    }

    const itemId = listData.data[0].id;
    const result = await items.get({ websetId, itemId }, exa);
    if (result.isError) console.error('ITEMS GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(itemId);
  });

  it('items.delete — deletes a specific item (if available)', async () => {
    const listResult = await items.list({ websetId, limit: 1 }, exa);
    const listData = JSON.parse(listResult.content[0].text);

    if (listData.data.length === 0) {
      console.log('No items yet (search still running), skipping items.delete');
      return;
    }

    const itemId = listData.data[0].id;
    const result = await items.del({ websetId, itemId }, exa);
    if (result.isError) console.error('ITEMS DELETE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });
});
