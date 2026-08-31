import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Angular's compiled lazy chunks can map the same source file into multiple workers.
    // Serial files keep V8's source coverage merge deterministic without changing timeouts.
    fileParallelism: false,
    maxWorkers: 1,
  },
});
