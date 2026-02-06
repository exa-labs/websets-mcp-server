import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

config();

export default defineConfig({
  test: {
    exclude: ['dist/**', 'node_modules/**'],
    testTimeout: 60_000,
    hookTimeout: 30_000,
    // Run test files sequentially to avoid Exa API rate limits during integration tests
    fileParallelism: false,
  },
});
