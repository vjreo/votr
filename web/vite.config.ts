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
    environment: 'node',
  },
});
