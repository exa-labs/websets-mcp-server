import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HAS_API_KEY, createTestClient, testId } from './setup.js';
import * as monitors from '../../monitors.js';
import * as websets from '../../websets.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('monitors (integration)', () => {
  let exa: Exa;
  let websetId: string;
  let monitorId: string;

  beforeAll(async () => {
    exa = createTestClient();
    const ws = await websets.create(
      {
        searchQuery: 'biotech companies in San Diego',
        searchCount: 1,
        externalId: testId(),
      },
      exa,
    );
    const data = JSON.parse(ws.content[0].text);
    websetId = data.id;
  });

  afterAll(async () => {
    // Clean up monitor first, then webset
    if (monitorId) {
      try { await exa.websets.monitors.delete(monitorId); } catch {}
    }
    if (websetId) {
      try { await exa.websets.delete(websetId); } catch {}
    }
  });

  it('monitors.create — creates a monitor with weekly cron', async () => {
    const result = await monitors.create(
      {
        websetId,
        cron: '0 9 * * 1',
        query: 'new biotech startups in San Diego',
        count: 5,
        behavior: 'append',
      },
      exa,
    );
    if (result.isError) console.error('MONITOR CREATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('id');
    monitorId = data.id;
  });

  it('monitors.get — retrieves the created monitor', async () => {
    const result = await monitors.get({ id: monitorId }, exa);
    if (result.isError) console.error('MONITOR GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(monitorId);
  });

  it('monitors.list — returns a paginated list', async () => {
    const result = await monitors.list({ limit: 10 }, exa);
    if (result.isError) console.error('MONITOR LIST ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('monitors.update — updates the monitor metadata', async () => {
    const result = await monitors.update(
      { id: monitorId, metadata: { test: 'updated' } },
      exa,
    );
    if (result.isError) console.error('MONITOR UPDATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('monitors.runs.list — lists runs for the monitor', async () => {
    const result = await monitors.runsList({ monitorId }, exa);
    if (result.isError) console.error('MONITOR RUNS LIST ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('monitors.delete — deletes the monitor', async () => {
    const result = await monitors.del({ id: monitorId }, exa);
    if (result.isError) console.error('MONITOR DELETE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    monitorId = '';
  });
});
