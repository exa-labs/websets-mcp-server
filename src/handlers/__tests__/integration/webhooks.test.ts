import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HAS_API_KEY, createTestClient } from './setup.js';
import * as webhooks from '../../webhooks.js';
import type { Exa } from 'exa-js';

describe.skipIf(!HAS_API_KEY)('webhooks (integration)', () => {
  let exa: Exa;
  let webhookId: string;

  beforeAll(() => {
    exa = createTestClient();
  });

  afterAll(async () => {
    if (webhookId) {
      try { await exa.websets.webhooks.delete(webhookId); } catch {}
    }
  });

  it('webhooks.create — creates a webhook', async () => {
    const result = await webhooks.create(
      {
        url: 'https://httpbin.org/post',
        events: ['webset.created', 'webset.deleted'],
      },
      exa,
    );
    if (result.isError) console.error('WEBHOOK CREATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('url');
    webhookId = data.id;
  });

  it('webhooks.get — retrieves the created webhook', async () => {
    const result = await webhooks.get({ id: webhookId }, exa);
    if (result.isError) console.error('WEBHOOK GET ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.id).toBe(webhookId);
  });

  it('webhooks.list — returns a paginated list', async () => {
    const result = await webhooks.list({ limit: 10 }, exa);
    if (result.isError) console.error('WEBHOOK LIST ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('webhooks.update — updates the webhook URL', async () => {
    const result = await webhooks.update(
      { id: webhookId, url: 'https://httpbin.org/anything' },
      exa,
    );
    if (result.isError) console.error('WEBHOOK UPDATE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
  });

  it('webhooks.listAttempts — lists delivery attempts', async () => {
    const result = await webhooks.listAttempts({ id: webhookId, limit: 10 }, exa);
    if (result.isError) console.error('WEBHOOK LIST ATTEMPTS ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('webhooks.delete — deletes the webhook', async () => {
    const result = await webhooks.del({ id: webhookId }, exa);
    if (result.isError) console.error('WEBHOOK DELETE ERROR:', result.content[0].text);
    expect(result.isError, result.content[0].text).toBeUndefined();
    webhookId = '';
  });
});
