import { describe, it, expect } from 'vitest';
import { HAS_API_KEY, createTestClient } from './setup.js';

describe.skipIf(!HAS_API_KEY)('Smoke test: API connection', () => {
  it('can list websets with real API key', async () => {
    const exa = createTestClient();
    const response = await exa.websets.list({ limit: 1 });
    expect(response).toBeDefined();
    expect(response).toHaveProperty('data');
  });
});
