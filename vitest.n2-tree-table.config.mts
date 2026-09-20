import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    disableConsoleIntercept: true,
    fileParallelism: false,
    maxWorkers: 1,
  },
});
