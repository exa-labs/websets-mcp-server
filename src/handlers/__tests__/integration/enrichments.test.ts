import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HAS_API_KEY, createTestClient, testId } from './setup.js';
import * as enrichments from '../../enrichments.js';
import * as websets from '../../websets.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('enrichments (integration)', () => {
  let exa: Exa;
  let websetId: string;
  let enrichmentId: string;

  beforeAll(async () => {
    exa = createTestClient();
    const ws = await websets.create(
      {
        searchQuery: 'tech companies in Seattle',
        searchCount: 1,
        externalId: testId(),
      },
      exa,
    );
    const data = JSON.parse(ws.content[0].text);
    websetId = data.id;
  });

  afterAll(async () => {
    if (websetId) {
      try { await exa.websets.delete(websetId); } catch {}
    }
  });

  it('enrichments.create — creates a text enrichment', async () => {
    const result = await enrichments.create(
      {
        websetId,
        description: 'What year was this company founded?',
        format: 'text',
      },
      exa,
    );
    if (result.isError) console.error('ENRICHMENT CREATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('id');
    enrichmentId = data.id;
  });

  it('enrichments.get — retrieves the created enrichment', async () => {
    const result = await enrichments.get({ websetId, enrichmentId }, exa);
    if (result.isError) console.error('ENRICHMENT GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(enrichmentId);
  });

  it('enrichments.update — updates the enrichment description', async () => {
    const result = await enrichments.update(
      {
        websetId,
        enrichmentId,
        description: 'What year was this company founded? (updated)',
      },
      exa,
    );
    if (result.isError) console.error('ENRICHMENT UPDATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('enrichments.cancel — cancels the enrichment', async () => {
    const result = await enrichments.cancel({ websetId, enrichmentId }, exa);
    if (result.isError) console.error('ENRICHMENT CANCEL ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('enrichments.delete — deletes the enrichment', async () => {
    const result = await enrichments.del({ websetId, enrichmentId }, exa);
    if (result.isError) console.error('ENRICHMENT DELETE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    enrichmentId = '';
  });
});
