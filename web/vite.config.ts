/// <reference types="vitest/config" />
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function pagesSpaFallback() {
  return {
    name: 'pages-spa-fallback',
    closeBundle() {
      const index = resolve(import.meta.dirname, 'dist/index.html');
      if (existsSync(index)) {
        copyFileSync(index, resolve(import.meta.dirname, 'dist/404.html'));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pagesSpaFallback()],
  base: '/votr/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test/**',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 70,
        branches: 70,
      },
    },
  },
});
