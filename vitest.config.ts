import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // No .tsx file in this repo imports React (Next.js's SWC compiler uses the
  // automatic JSX runtime), so esbuild's classic default ("React.createElement"
  // with React expected in scope) fails on any component test. This makes
  // vitest's transform match production.
  esbuild: {
    jsx: 'automatic',
  },
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
