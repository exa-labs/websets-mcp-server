import { Exa } from 'exa-js';

export const API_KEY = process.env.EXA_API_KEY ?? '';
export const HAS_API_KEY = API_KEY.length > 0;

export function createTestClient(): Exa {
  if (!HAS_API_KEY) throw new Error('EXA_API_KEY not set');
  return new Exa(API_KEY);
}

export function testId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
