import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8090',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  reporter: [['list']],
});

