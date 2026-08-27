import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**', 'content/_verify/**'],
  },
  resolve: {
    // Array form: order matters, '@kui' must resolve before the broader '@'.
    alias: [
      { find: /^@kui\//, replacement: path.resolve(__dirname, 'modules/shared/ui/kui') + '/' },
      { find: /^@\//, replacement: path.resolve(__dirname) + '/' },
    ],
  },
});
