import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/cli.ts', 'src/server.ts', 'src/fetch/**', 'src/parse/index.ts', 'src/declarations.d.ts'],
    },
    testTimeout: 30000,
  },
});
