import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  // The servers start from their binaries rather than package scripts, so a
  // package manager's pre-run dependency check can never block the journeys.
  webServer: [
    {
      command: 'npx vite --host 127.0.0.1',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node mock-api/server.mjs',
      url: 'http://localhost:3001/api/v1/health',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
