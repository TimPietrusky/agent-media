import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use environment variables from .env file
    setupFiles: ['dotenv/config'],
    // Increase timeout for e2e tests that call external APIs
    testTimeout: 120000,
    // Increase hook timeout for setup that generates test images
    hookTimeout: 120000,
    // Run tests sequentially to avoid rate limiting
    isolate: false,
    fileParallelism: false,
  },
});
