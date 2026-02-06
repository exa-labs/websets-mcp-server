import { describe, it, expect, beforeAll } from 'vitest';
import { HAS_API_KEY, createTestClient } from './setup.js';
import * as events from '../../events.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('events (integration)', () => {
  let exa: Exa;

  beforeAll(() => {
    exa = createTestClient();
  });

  it('events.list — returns a paginated list of events', async () => {
    const result = await events.list({ limit: 10 }, exa);
    if (result.isError) console.error('EVENTS LIST ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('events.get — retrieves a specific event (if available)', async () => {
    // List events first to find one
    const listResult = await events.list({ limit: 1 }, exa);
    const listData = JSON.parse(listResult.content[0].text);

    if (listData.data.length === 0) {
      console.log('No events available, skipping events.get');
      return;
    }

    const eventId = listData.data[0].id;
    const result = await events.get({ id: eventId }, exa);
    if (result.isError) console.error('EVENTS GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(eventId);
  });
});
