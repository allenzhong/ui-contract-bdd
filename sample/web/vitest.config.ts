// Test-only bundling. Mirror anything webpack.config.js resolves (aliases, defines,
// loaders) here so components render identically in both pipelines.
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'contracts',
          include: ['src/**/*.flows.browser.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            // Use the locally installed Google Chrome instead of downloading Playwright's Chromium.
            provider: playwright({ launchOptions: { channel: 'chrome' } }),
            instances: [{ browser: 'chromium' }],
            viewport: { width: 1280, height: 800 },
          },
        },
      },
    ],
  },
});
